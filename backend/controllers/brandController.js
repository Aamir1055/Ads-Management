const { pool } = require('../config/database');

// =============================================================================
// HELPERS
// =============================================================================

const createResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString()
  };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return response;
};

const handleDatabaseError = (error, operation = 'database operation') => {
  console.error(`[BrandController] Error during ${operation}:`, error);

  if (error && error.code === 'ER_DUP_ENTRY') {
    return {
      statusCode: 409,
      response: createResponse(false, 'Brand name already exists. Please use a different name.')
    };
  }

  if (error && error.code === 'ER_NO_SUCH_TABLE') {
    return {
      statusCode: 500,
      response: createResponse(false, 'Database table not found. Please contact administrator.')
    };
  }

  return {
    statusCode: 500,
    response: createResponse(
      false,
      'Database error occurred. Please try again later.',
      null,
      process.env.NODE_ENV === 'development' ? { error: error.message } : null
    )
  };
};

const normalizeBooleanToBit = (val, defaultVal = null) => {
  if (val === undefined || val === null) return defaultVal;
  return val ? 1 : 0;
};

const buildSearchConditions = (search, status) => {
  const where = [];
  const params = [];

  if (search) {
    where.push('(name LIKE ? OR description LIKE ?)');
    const term = `%${search}%`;
    params.push(term, term);
  }

  if (status && status !== 'all') {
    where.push('is_active = ?');
    params.push(status === 'active' ? 1 : 0);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
  return { whereClause, queryParams: params };
};

// Strict whitelist for updatable columns
const UPDATABLE_FIELDS = new Set(['name', 'description', 'is_active']);

// =============================================================================
// CRUD
// =============================================================================

/**
 * POST /api/brands
 */
const createBrand = async (req, res) => {
  let connection;
  try {
    const body = req.validatedData || req.body || {};
    const name = (body.name || '').trim();
    const description = (body.description || '').trim();
    const is_active = normalizeBooleanToBit(body.is_active, 1);
    const created_by = req.user?.id || null;

    if (!name) {
      return res.status(400).json(createResponse(false, 'Brand name is required'));
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO brands (name, description, is_active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [name, description, is_active, created_by]
    );

    if (!result.insertId) {
      await connection.rollback();
      return res.status(500).json(createResponse(false, 'Failed to create brand'));
    }

    const [rows] = await connection.execute(
      `SELECT id, name, description, is_active, created_by, updated_by, created_at, updated_at
       FROM brands
       WHERE id = ?`,
      [result.insertId]
    );

    await connection.commit();

    // Return a single row object (not an array)
    const data = rows && rows[0] ? rows[0] : null;
    return res.status(201).json(
      createResponse(true, 'Brand created successfully', data)
    );
  } catch (error) {
    if (connection) await connection.rollback();
    const { statusCode, response } = handleDatabaseError(error, 'brand creation');
    return res.status(statusCode).json(response);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * GET /api/brands
 */
const getAllBrands = async (req, res) => {
  try {
    const query = req.validatedQuery || req.query || {};
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const search = (query.search || '').trim() || null;
    const status = query.status || 'all';
    const offset = (page - 1) * limit;

    const { whereClause, queryParams } = buildSearchConditions(search, status);

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM brands ${whereClause}`,
      queryParams
    );
    // FIX: countRows is an array; pick the first element
    const totalCount = (countRows && countRows[0] && Number(countRows[0].total)) || 0;

    const [rows] = await pool.execute(
      `SELECT id, name, description, is_active, created_by, updated_by, created_at, updated_at
       FROM brands
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, Number(limit), Number(offset)]
    );

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const meta = {
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search: search || null,
        status
      }
    };

    return res.status(200).json(
      createResponse(true, `Retrieved ${rows.length} brand(s)`, rows, meta)
    );
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'brands retrieval');
    return res.status(statusCode).json(response);
  }
};

/**
 * GET /api/brands/:id
 */
const getBrandById = async (req, res) => {
  try {
    const params = req.validatedParams || req.params || {};
    const id = parseInt(params.id, 10);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json(createResponse(false, 'Invalid brand ID'));
    }

    const [rows] = await pool.execute(
      `SELECT id, name, description, is_active, created_by, updated_by, created_at, updated_at
       FROM brands
       WHERE id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json(createResponse(false, 'Brand not found'));
    }

    // Return a single row object (not an array)
    const data = rows && rows[0] ? rows[0] : null;
    return res.status(200).json(
      createResponse(true, 'Brand retrieved successfully', data)
    );
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'brand retrieval');
    return res.status(statusCode).json(response);
  }
};

/**
 * PUT /api/brands/:id
 */
const updateBrand = async (req, res) => {
  let connection;
  try {
    const params = req.validatedParams || req.params || {};
    const id = parseInt(params.id, 10);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json(createResponse(false, 'Invalid brand ID'));
    }

    const body = req.validatedData || req.body || {};
    const updateData = {};
    const updated_by = req.user?.id || null;

    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      const v = (body.name || '').trim();
      if (!v) return res.status(400).json(createResponse(false, 'Brand name cannot be empty'));
      updateData.name = v;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      updateData.description = (body.description || '').trim();
    }
    if (Object.prototype.hasOwnProperty.call(body, 'is_active')) {
      updateData.is_active = normalizeBooleanToBit(body.is_active, null);
    }

    const fields = Object.keys(updateData).filter(k => UPDATABLE_FIELDS.has(k));
    if (fields.length === 0) {
      return res.status(400).json(createResponse(false, 'No valid fields provided for update'));
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      `SELECT id FROM brands WHERE id = ?`,
      [id]
    );
    if (!existing || existing.length === 0) {
      await connection.rollback();
      return res.status(404).json(createResponse(false, 'Brand not found'));
    }

    const setParts = [];
    const values = [];
    for (const key of fields) {
      setParts.push(`${key} = ?`);
      values.push(updateData[key]);
    }
    setParts.push('updated_by = ?', 'updated_at = NOW()');
    values.push(updated_by, id);

    await connection.execute(
      `UPDATE brands SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await connection.execute(
      `SELECT id, name, description, is_active, created_by, updated_by, created_at, updated_at
       FROM brands WHERE id = ?`,
      [id]
    );

    await connection.commit();

    const data = updated && updated[0] ? updated[0] : null;
    return res.status(200).json(
      createResponse(true, 'Brand updated successfully', data)
    );
  } catch (error) {
    if (connection) await connection.rollback();
    const { statusCode, response } = handleDatabaseError(error, 'brand update');
    return res.status(statusCode).json(response);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * DELETE /api/brands/:id (soft delete)
 */
const deleteBrand = async (req, res) => {
  let connection;
  try {
    const params = req.validatedParams || req.params || {};
    const id = parseInt(params.id, 10);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json(createResponse(false, 'Invalid brand ID'));
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      `SELECT id, name, is_active FROM brands WHERE id = ?`,
      [id]
    );
    if (!existing || existing.length === 0) {
      await connection.rollback();
      return res.status(404).json(createResponse(false, 'Brand not found'));
    }

    // FIX: pick the first row
    const row = existing[0];

    if (row.is_active === 0) {
      await connection.rollback();
      return res.status(200).json(
        createResponse(true, 'Brand is already inactive', {
          id,
          name: row.name,
          deleted_at: null
        })
      );
    }

    const updated_by = req.user?.id || null;
    const [result] = await connection.execute(
      `UPDATE brands SET is_active = 0, updated_by = ?, updated_at = NOW() WHERE id = ?`,
      [updated_by, id]
    );
    if (!result || result.affectedRows === 0) {
      await connection.rollback();
      return res.status(500).json(createResponse(false, 'Failed to delete brand'));
    }

    await connection.commit();

    return res.status(200).json(
      createResponse(true, 'Brand deleted successfully', {
        id,
        name: row.name,
        deleted_at: new Date().toISOString()
      })
    );
  } catch (error) {
    if (connection) await connection.rollback();
    const { statusCode, response } = handleDatabaseError(error, 'brand deletion');
    return res.status(statusCode).json(response);
  } finally {
    if (connection) connection.release();
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  createBrand,
  getAllBrands,
  getBrandById,
  updateBrand,
  deleteBrand
};

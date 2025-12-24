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
  // Handle string representations
  if (typeof val === 'string') {
    const lowerVal = val.toLowerCase();
    if (lowerVal === 'true' || lowerVal === '1') return 1;
    if (lowerVal === 'false' || lowerVal === '0') return 0;
    return defaultVal;
  }
  // Handle boolean and numeric values
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

// Enhanced ID validation
const validateId = (id, paramName = 'ID') => {
  const numId = parseInt(id, 10);
  if (!id || isNaN(numId) || numId <= 0 || numId > Number.MAX_SAFE_INTEGER) {
    return { valid: false, error: `Invalid ${paramName}` };
  }
  return { valid: true, value: numId };
};

// Input sanitization with malicious content detection
const sanitizeText = (text, maxLength = 255) => {
  if (typeof text !== 'string') return '';
  
  // Remove control characters
  let sanitized = text.trim().substring(0, maxLength).replace(/[\x00-\x1f\x7f]/g, '');
  
  // Check for potentially malicious patterns
  const maliciousPatterns = [
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /'\s*(or|and)\s+'\d+'\s*=\s*'\d+/i,
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i
  ];
  
  // If malicious patterns detected, return empty string to trigger validation error
  for (const pattern of maliciousPatterns) {
    if (pattern.test(sanitized)) {
      return '';
    }
  }
  
  return sanitized;
};

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
    const name = sanitizeText(body.name, 255);
    const description = sanitizeText(body.description, 1000);
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
    const limitNum = Number.isFinite(Number(limit)) ? Number(limit) : 10;
    const offset = Math.max(0, (page - 1) * limitNum);

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
       LIMIT ${limitNum} OFFSET ${offset}`,
      queryParams
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
    const validation = validateId(params.id, 'brand ID');
    if (!validation.valid) {
      return res.status(400).json(createResponse(false, validation.error));
    }
    const id = validation.value;

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
    const validation = validateId(params.id, 'brand ID');
    if (!validation.valid) {
      return res.status(400).json(createResponse(false, validation.error));
    }
    const id = validation.value;

    const body = req.validatedData || req.body || {};
    const updateData = {};
    const updated_by = req.user?.id || null;

    if (Object.prototype.hasOwnProperty.call(body, 'name')) {
      const v = sanitizeText(body.name, 255);
      if (!v) return res.status(400).json(createResponse(false, 'Brand name cannot be empty'));
      updateData.name = v;
    }
    if (Object.prototype.hasOwnProperty.call(body, 'description')) {
      updateData.description = sanitizeText(body.description, 1000);
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
 * GET /api/brands/active - Get only active brands (for dropdowns)
 */
const getActiveBrands = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, description
       FROM brands
       WHERE is_active = 1
       ORDER BY name ASC`
    );

    return res.status(200).json(
      createResponse(true, `Retrieved ${rows.length} active brand(s)`, rows)
    );
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'active brands retrieval');
    return res.status(statusCode).json(response);
  }
};

/**
 * DELETE /api/brands/:id (soft delete)
 */
const deleteBrand = async (req, res) => {
  let connection;
  try {
    const params = req.validatedParams || req.params || {};
    const validation = validateId(params.id, 'brand ID');
    if (!validation.valid) {
      return res.status(400).json(createResponse(false, validation.error));
    }
    const id = validation.value;

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
  getActiveBrands,
  deleteBrand
};

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
  console.error(`[CampaignTypeController] Error during ${operation}:`, error);

  if (error && error.code === 'ER_DUP_ENTRY') {
    return {
      statusCode: 409,
      response: createResponse(false, 'Campaign type name already exists. Please use a different name.')
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

// Privacy helper - checks if user is admin or owns the data
const isAdminOrOwner = (req, dataCreatedBy) => {
  const user = req.user;
  if (!user) return false;
  
  // Admins can access all data (check role level or name)
  if (user.role && (user.role.level >= 8 || user.role.name === 'super_admin' || user.role.name === 'admin')) {
    return true;
  }
  
  // User can access their own data
  return user.id === dataCreatedBy;
};

const normalizeBooleanToBit = (val, defaultVal = null) => {
  if (val === undefined || val === null) return defaultVal;
  return val ? 1 : 0;
};

const buildSearchConditions = (search, status, req) => {
  const where = [];
  const params = [];

  // Add privacy filtering for non-admins
  const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
  if (!isAdmin) {
    where.push('created_by = ?');
    params.push(req.user.id);
  }

  if (search) {
    where.push('(type_name LIKE ? OR description LIKE ?)');
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
const UPDATABLE_FIELDS = new Set(['type_name', 'description', 'is_active']);

// =============================================================================
// CRUD WITH PRIVACY
// =============================================================================

/**
 * POST /api/campaign-types - Create with automatic user ownership
 */
const createCampaignType = async (req, res) => {
  let connection;
  try {
    const body = req.validatedData || req.body || {};
    const type_name = (body.type_name || '').trim();
    const description = (body.description || '').trim();
    const is_active = normalizeBooleanToBit(body.is_active, 1);

    if (!type_name) {
      return res.status(400).json(createResponse(false, 'type_name is required'));
    }

    // Check for duplicates in user's own data (for non-admins)
    let duplicateQuery = 'SELECT id FROM campaign_types WHERE type_name = ?';
    let duplicateParams = [type_name];
    
    const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
    if (!isAdmin) {
      duplicateQuery += ' AND created_by = ?';
      duplicateParams.push(req.user.id);
    }
    
    const [existingTypes] = await pool.execute(duplicateQuery, duplicateParams);
    if (existingTypes && existingTypes.length > 0) {
      return res.status(409).json(createResponse(false, 'Campaign type name already exists in your data'));
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO campaign_types (type_name, description, is_active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [type_name, description, is_active, req.user.id]
    );

    if (!result.insertId) {
      await connection.rollback();
      return res.status(500).json(createResponse(false, 'Failed to create campaign type'));
    }

    const [rows] = await connection.execute(
      `SELECT id, type_name, description, is_active, created_by, created_at, updated_at
       FROM campaign_types
       WHERE id = ?`,
      [result.insertId]
    );

    await connection.commit();

    const data = rows && rows[0] ? rows[0] : null;
    return res.status(201).json(
      createResponse(true, 'Campaign type created successfully', data)
    );
  } catch (error) {
    if (connection) await connection.rollback();
    const { statusCode, response } = handleDatabaseError(error, 'campaign type creation');
    return res.status(statusCode).json(response);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * GET /api/campaign-types - List with user-based filtering
 */
const getAllCampaignTypes = async (req, res) => {
  try {
    const query = req.validatedQuery || req.query || {};
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
    const search = (query.search || '').trim() || null;
    const status = query.status || 'all';
    const offset = (page - 1) * limit;

    const { whereClause, queryParams } = buildSearchConditions(search, status, req);

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM campaign_types ${whereClause}`,
      queryParams
    );
    const totalCount = (countRows && countRows[0] && Number(countRows[0].total)) || 0;

    const [rows] = await pool.execute(
      `SELECT id, type_name, description, is_active, created_by, created_at, updated_at
       FROM campaign_types
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
      createResponse(true, `Retrieved ${rows.length} campaign type(s)`, rows, meta)
    );
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'campaign types retrieval');
    return res.status(statusCode).json(response);
  }
};

/**
 * GET /api/campaign-types/:id - Get with ownership validation
 */
const getCampaignTypeById = async (req, res) => {
  try {
    const params = req.validatedParams || req.params || {};
    const id = parseInt(params.id, 10);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json(createResponse(false, 'Invalid campaign type ID'));
    }

    const [rows] = await pool.execute(
      `SELECT id, type_name, description, is_active, created_by, created_at, updated_at
       FROM campaign_types
       WHERE id = ?`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json(createResponse(false, 'Campaign type not found'));
    }

    const campaignType = rows[0];

    // Privacy check - only owner or admin can access
    if (!isAdminOrOwner(req, campaignType.created_by)) {
      return res.status(403).json(createResponse(false, 'Access denied. You can only access campaign types you created.'));
    }

    return res.status(200).json(
      createResponse(true, 'Campaign type retrieved successfully', campaignType)
    );
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'campaign type retrieval');
    return res.status(statusCode).json(response);
  }
};

/**
 * PUT /api/campaign-types/:id - Update with ownership validation
 */
const updateCampaignType = async (req, res) => {
  let connection;
  try {
    const params = req.validatedParams || req.params || {};
    const id = parseInt(params.id, 10);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json(createResponse(false, 'Invalid campaign type ID'));
    }

    // Check if campaign type exists and user has access
    const [existing] = await pool.execute(
      `SELECT id, type_name, created_by FROM campaign_types WHERE id = ?`,
      [id]
    );
    if (!existing || existing.length === 0) {
      return res.status(404).json(createResponse(false, 'Campaign type not found'));
    }

    const existingType = existing[0];

    // Privacy check - only owner or admin can update
    if (!isAdminOrOwner(req, existingType.created_by)) {
      return res.status(403).json(createResponse(false, 'Access denied. You can only update campaign types you created.'));
    }

    const body = req.validatedData || req.body || {};
    const updateData = {};

    if (Object.prototype.hasOwnProperty.call(body, 'type_name')) {
      const v = (body.type_name || '').trim();
      if (!v) return res.status(400).json(createResponse(false, 'type_name cannot be empty'));
      updateData.type_name = v;
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

    // Check for duplicate names - scoped to user for non-admins
    if (updateData.type_name && updateData.type_name !== existingType.type_name) {
      let duplicateQuery = 'SELECT id FROM campaign_types WHERE type_name = ? AND id != ?';
      let duplicateParams = [updateData.type_name, id];
      
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        duplicateQuery += ' AND created_by = ?';
        duplicateParams.push(req.user.id);
      }
      
      const [duplicates] = await pool.execute(duplicateQuery, duplicateParams);
      if (duplicates && duplicates.length > 0) {
        return res.status(409).json(createResponse(false, 'Campaign type name already exists'));
      }
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const setParts = [];
    const values = [];
    for (const key of fields) {
      setParts.push(`${key} = ?`);
      values.push(updateData[key]);
    }
    setParts.push('updated_at = NOW()');
    values.push(id);

    await connection.execute(
      `UPDATE campaign_types SET ${setParts.join(', ')} WHERE id = ?`,
      values
    );

    const [updated] = await connection.execute(
      `SELECT id, type_name, description, is_active, created_by, created_at, updated_at
       FROM campaign_types WHERE id = ?`,
      [id]
    );

    await connection.commit();

    const data = updated && updated[0] ? updated[0] : null;
    return res.status(200).json(
      createResponse(true, 'Campaign type updated successfully', data)
    );
  } catch (error) {
    if (connection) await connection.rollback();
    const { statusCode, response } = handleDatabaseError(error, 'campaign type update');
    return res.status(statusCode).json(response);
  } finally {
    if (connection) connection.release();
  }
};

/**
 * DELETE /api/campaign-types/:id - Soft delete with ownership validation
 */
const deleteCampaignType = async (req, res) => {
  let connection;
  try {
    const params = req.validatedParams || req.params || {};
    const id = parseInt(params.id, 10);
    if (!id || isNaN(id) || id <= 0) {
      return res.status(400).json(createResponse(false, 'Invalid campaign type ID'));
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.execute(
      `SELECT id, type_name, is_active, created_by FROM campaign_types WHERE id = ?`,
      [id]
    );
    if (!existing || existing.length === 0) {
      await connection.rollback();
      return res.status(404).json(createResponse(false, 'Campaign type not found'));
    }

    const row = existing[0];

    // Privacy check - only owner or admin can delete
    if (!isAdminOrOwner(req, row.created_by)) {
      await connection.rollback();
      return res.status(403).json(createResponse(false, 'Access denied. You can only delete campaign types you created.'));
    }

    if (row.is_active === 0) {
      await connection.rollback();
      return res.status(200).json(
        createResponse(true, 'Campaign type is already inactive', {
          id,
          type_name: row.type_name,
          deleted_at: null
        })
      );
    }

    const [result] = await connection.execute(
      `UPDATE campaign_types SET is_active = 0, updated_at = NOW() WHERE id = ?`,
      [id]
    );
    if (!result || result.affectedRows === 0) {
      await connection.rollback();
      return res.status(500).json(createResponse(false, 'Failed to delete campaign type'));
    }

    await connection.commit();

    return res.status(200).json(
      createResponse(true, 'Campaign type deleted successfully', {
        id,
        type_name: row.type_name,
        deleted_at: new Date().toISOString()
      })
    );
  } catch (error) {
    if (connection) await connection.rollback();
    const { statusCode, response } = handleDatabaseError(error, 'campaign type deletion');
    return res.status(statusCode).json(response);
  } finally {
    if (connection) connection.release();
  }
};

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = {
  createCampaignType,
  getAllCampaignTypes,
  getCampaignTypeById,
  updateCampaignType,
  deleteCampaignType
};

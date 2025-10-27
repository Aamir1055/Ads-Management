const { pool } = require('../config/database');
const { isAdmin } = require('../middleware/dataPrivacy');

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

const handleDatabaseError = (error, operation = 'database operation', req = null) => {
  console.error(`[CampaignDataController] Error during ${operation}:`, {
    error,
    requestData: req ? (req.body || req.query || req.params) : undefined
  });

  if (error && error.code === 'ER_DUP_ENTRY') {
    return {
      statusCode: 409,
      response: createResponse(false, 'Campaign data for this date already exists. Use update instead.')
    };
  }
  if (error && error.code === 'ER_NO_REFERENCED_ROW_2') {
    return {
      statusCode: 400,
      response: createResponse(false, 'Foreign key constraint failed: check campaign_id, card_id, or created_by exist.')
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
      process.env.NODE_ENV === 'development' ? { error: error.message, stack: error.stack } : null
    )
  };
};

// Normalize to YYYY-MM-DD for DATE column
const toMysqlDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// Map database field names to frontend-compatible names
const mapDatabaseToFrontend = (data) => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => mapDatabaseToFrontend(item));
  }
  
  // Clone the object to avoid modifying the original
  const mapped = { ...data };
  
  // Map xoho_result to zoho_result for frontend compatibility
  if ('xoho_result' in mapped) {
    mapped.zoho_result = mapped.xoho_result;
    // Keep xoho_result for backward compatibility but frontend should use zoho_result
  }
  
  return mapped;
};

// Add user-based filtering to WHERE clause
const addUserFilter = (whereClause, queryParams, userId, userIsAdmin) => {
  if (userIsAdmin) {
    // Admins see all data
    return { whereClause, queryParams };
  }

  // Add user filtering for regular users
  const userFilter = 'cd.created_by = ?';
  
  if (whereClause && whereClause.includes('WHERE')) {
    // Already has WHERE clause, add AND condition
    whereClause += ` AND ${userFilter}`;
  } else {
    // No WHERE clause, add one
    whereClause = `WHERE ${userFilter}`;
  }
  
  queryParams.push(userId);
  return { whereClause, queryParams };
};

const buildSearchConditions = (filters, userId, userIsAdmin) => {
  const whereConditions = [];
  const queryParams = [];

  const { campaign_id, card_id, date_from, date_to, search } = filters;

  if (campaign_id) {
    // campaign_id now refers to campaigns.id
    whereConditions.push('cd.campaign_id = ?');
    queryParams.push(Number(campaign_id));
  }

  if (card_id) {
    whereConditions.push('cd.card_id = ?');
    queryParams.push(Number(card_id));
  }

  if (date_from) {
    const df = toMysqlDate(date_from);
    if (df) {
      whereConditions.push('cd.data_date >= ?');
      queryParams.push(df);
    }
  }

  if (date_to) {
    const dt = toMysqlDate(date_to);
    if (dt) {
      whereConditions.push('cd.data_date <= ?');
      queryParams.push(dt);
    }
  }

  if (search) {
    // search by campaign name or card_name
    whereConditions.push('(c.name LIKE ? OR cd.card_name LIKE ?)');
    const term = `%${search}%`;
    queryParams.push(term, term);
  }

  // Add user-based filtering for non-admin users
  if (!userIsAdmin && userId) {
    whereConditions.push('cd.created_by = ?');
    queryParams.push(userId);
  }

  const whereClause = whereConditions.length ? `WHERE ${whereConditions.join(' AND ')}` : '';
  return { whereClause, queryParams };
};

// =============================================================================
// CRUD WITH DATA PRIVACY
// =============================================================================

/**
 * POST /api/campaign-data
 * Creates campaign data with automatic user ownership
 */
const createCampaignData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    console.log('[CampaignDataController] Creating new campaign data:', req.body);
    console.log('[CampaignDataController] User context:', {
      userId: req.user?.id,
      username: req.user?.username,
      isAdmin: isAdmin(req.user)
    });

    await connection.beginTransaction();

    // Automatically set created_by from token
    const userId = req.user?.id;
    if (!userId) {
      await connection.rollback();
      return res.status(401).json(createResponse(false, 'User authentication required'));
    }

    const {
      campaign_id,
      facebook_result = 0,
      zoho_result = 0,
      spent = 0.00,
      data_date,
      card_id = null,
      card_name = ''
    } = req.body || {};
    
    // Map zoho_result to xoho_result for database compatibility
    const xoho_result = zoho_result;

    // Resolve card_name when card_id present and card_name blank
    let finalCardName = card_name;
    if (card_id && !card_name) {
      const [cardInfo] = await connection.execute(
        'SELECT card_name FROM cards WHERE id = ?',
        [Number(card_id)]
      );
      if (cardInfo && cardInfo.length > 0) {
        finalCardName = cardInfo[0].card_name;
      }
    }

    const dateForInsert = data_date ? toMysqlDate(data_date) : null;

    // Build columns with automatic user ownership
    const cols = ['campaign_id', 'facebook_result', 'xoho_result', 'spent', 'card_id', 'card_name', 'created_by'];
    const vals = [Number(campaign_id), Number(facebook_result), Number(xoho_result), Number(spent), card_id ? Number(card_id) : null, finalCardName || null, userId];

    if (dateForInsert) {
      cols.splice(4, 0, 'data_date');
      vals.splice(4, 0, dateForInsert);
    }

    const placeholders = cols.map(() => '?').join(', ');
    const [result] = await connection.execute(
      `INSERT INTO campaign_data (${cols.join(', ')}) VALUES (${placeholders})`,
      vals
    );

    if (!result || !result.insertId) {
      await connection.rollback();
      return res.status(500).json(createResponse(false, 'Failed to create campaign data'));
    }

    // Retrieve the created record with user-based filtering
    let fetchQuery = `
      SELECT 
        cd.*,
        c.name as campaign_name,
        COALESCE(b.name, 'Unknown') as brand_name,
        cards.card_name as card_display_name,
        users.username as created_by_user
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN brands b ON c.brand = b.id
      LEFT JOIN cards ON cd.card_id = cards.id
      LEFT JOIN users ON cd.created_by = users.id
      WHERE cd.id = ?
    `;
    
    // Add user filtering for non-admins
    const queryParams = [Number(result.insertId)];
    if (!isAdmin(req.user)) {
      fetchQuery += ` AND cd.created_by = ?`;
      queryParams.push(userId);
    }

    const [createdRows] = await connection.execute(fetchQuery, queryParams);

    await connection.commit();
    
    const row = Array.isArray(createdRows) && createdRows.length > 0 ? createdRows[0] : null;
    
    console.log('[CampaignDataController] Campaign data created successfully by user:', userId);
    return res.status(201).json(createResponse(
      true, 
      'Campaign data created successfully', 
      mapDatabaseToFrontend(row)
    ));
    
  } catch (error) {
    try { await connection.rollback(); } catch {}
    const { statusCode, response } = handleDatabaseError(error, 'campaign data creation', req);
    return res.status(statusCode).json(response);
  } finally {
    connection.release();
  }
};

/**
 * GET /api/campaign-data
 * Retrieves campaign data with user-based filtering
 */
const getAllCampaignData = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userIsAdmin = isAdmin(req.user);
    
    console.log('[CampaignDataController] Fetching campaign data with filters:', req.query);
    console.log('[CampaignDataController] User context:', {
      userId,
      username: req.user?.username,
      isAdmin: userIsAdmin
    });

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const filters = { ...req.query };
    delete filters.page;
    delete filters.limit;

    const offset = (page - 1) * limit;

    // Build search conditions with user filtering
    const { whereClause, queryParams } = buildSearchConditions(filters, userId, userIsAdmin);

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN brands b ON c.brand = b.id
      ${whereClause}
    `;
    const [countRows] = await pool.execute(countQuery, queryParams);
    const totalCount = Number((Array.isArray(countRows) && countRows.length > 0 && countRows[0].total !== undefined) ? countRows[0].total : 0);

    const dataQuery = `
      SELECT 
        cd.*,
        c.name as campaign_name,
        COALESCE(b.name, 'Unknown') as brand_name,
        cards.card_name as card_display_name,
        users.username as created_by_user
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN brands b ON c.brand = b.id
      LEFT JOIN cards ON cd.card_id = cards.id
      LEFT JOIN users ON cd.created_by = users.id
      ${whereClause}
      ORDER BY cd.data_date DESC, cd.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [campaignData] = await pool.execute(dataQuery, [...queryParams, Number(limit), Number(offset)]);

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
      filters,
      userContext: {
        isAdmin: userIsAdmin,
        showingAllData: userIsAdmin,
        filteredByUser: !userIsAdmin
      }
    };

    console.log(`[CampaignDataController] Retrieved ${Array.isArray(campaignData) ? campaignData.length : 0} records for user ${userId} (${userIsAdmin ? 'admin' : 'regular user'})`);
    
    return res.status(200).json(
      createResponse(
        true,
        `Retrieved ${Array.isArray(campaignData) ? campaignData.length : 0} campaign data entries`,
        mapDatabaseToFrontend(campaignData || []),
        meta
      )
    );
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'campaign data retrieval');
    return res.status(statusCode).json(response);
  }
};

/**
 * GET /api/campaign-data/:id
 * Retrieves single campaign data with ownership validation
 */
const getCampaignDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userIsAdmin = isAdmin(req.user);
    
    console.log('[CampaignDataController] Fetching campaign data by ID:', id, 'for user:', userId);

    let query = `
      SELECT 
        cd.*,
        c.name as campaign_name,
        COALESCE(b.name, 'Unknown') as brand_name,
        cards.card_name as card_display_name,
        users.username as created_by_user
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN brands b ON c.brand = b.id
      LEFT JOIN cards ON cd.card_id = cards.id
      LEFT JOIN users ON cd.created_by = users.id
      WHERE cd.id = ?
    `;
    
    const queryParams = [Number(id)];
    
    // Add user filtering for non-admins
    if (!userIsAdmin) {
      query += ` AND cd.created_by = ?`;
      queryParams.push(userId);
    }

    const [rows] = await pool.execute(query, queryParams);

    if (!rows || rows.length === 0) {
      console.log(`[CampaignDataController] Campaign data ${id} not found or access denied for user ${userId}`);
      return res.status(404).json(createResponse(false, 'Campaign data not found or access denied'));
    }

    console.log(`[CampaignDataController] Campaign data ${id} retrieved successfully for user ${userId}`);
    return res.status(200).json(createResponse(
      true, 
      'Campaign data retrieved successfully', 
      mapDatabaseToFrontend(rows[0])
    ));
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'campaign data retrieval');
    return res.status(statusCode).json(response);
  }
};

/**
 * PUT /api/campaign-data/:id
 * Updates campaign data with ownership validation
 */
const updateCampaignData = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    const userId = req.user?.id;
    const userIsAdmin = isAdmin(req.user);

    console.log('[CampaignDataController] Updating campaign data:', id, 'by user:', userId);

    await connection.beginTransaction();

    // Check if record exists and validate ownership
    let checkQuery = 'SELECT * FROM campaign_data WHERE id = ?';
    const checkParams = [Number(id)];
    
    if (!userIsAdmin) {
      checkQuery += ' AND created_by = ?';
      checkParams.push(userId);
    }

    const [existingRows] = await connection.execute(checkQuery, checkParams);
    
    if (!existingRows || existingRows.length === 0) {
      await connection.rollback();
      console.log(`[CampaignDataController] Campaign data ${id} not found or access denied for user ${userId}`);
      return res.status(404).json(createResponse(false, 'Campaign data not found or access denied'));
    }
    
    const existing = existingRows[0];

    // Validate new campaign if changing
    if (updateData.campaign_id && Number(updateData.campaign_id) !== Number(existing.campaign_id)) {
      const [campaignInfo] = await connection.execute('SELECT id, name, is_enabled FROM campaigns WHERE id = ?', [Number(updateData.campaign_id)]);
      if (!campaignInfo || campaignInfo.length === 0) {
        await connection.rollback();
        return res.status(404).json(createResponse(false, 'New campaign not found'));
      }
      if (campaignInfo[0].is_enabled === 0) {
        await connection.rollback();
        return res.status(400).json(createResponse(false, 'Cannot assign inactive campaign'));
      }
    }

    // Map zoho_result to xoho_result for database compatibility
    if ('zoho_result' in updateData) {
      updateData.xoho_result = updateData.zoho_result;
      delete updateData.zoho_result;
    }
    
    // Resolve card_name if card_id provided without card_name
    if (updateData.card_id && !updateData.card_name) {
      const [cardInfo] = await connection.execute('SELECT card_name FROM cards WHERE id = ?', [Number(updateData.card_id)]);
      if (cardInfo && cardInfo.length > 0) {
        updateData.card_name = cardInfo[0].card_name;
      }
    }

    // Normalize data_date to DATE if present
    if (updateData.data_date) {
      const nd = toMysqlDate(updateData.data_date);
      if (nd) updateData.data_date = nd; else delete updateData.data_date;
    }

    // Remove created_by from update data - users shouldn't be able to change ownership
    delete updateData.created_by;

    // Build dynamic SET list, filtering out undefined values
    const fields = Object.keys(updateData).filter(key => updateData[key] !== undefined);
    if (fields.length === 0) {
      await connection.rollback();
      return res.status(400).json(createResponse(false, 'No valid fields provided for update'));
    }

    const setParts = [];
    const values = [];
    for (const key of fields) {
      const value = updateData[key];
      if (value !== undefined) {
        setParts.push(`${key} = ?`);
        values.push(value === null ? null : value);
      }
    }
    setParts.push('updated_at = NOW()');

    values.push(Number(id));
    
    // Add user filter for non-admins
    let updateQuery = `UPDATE campaign_data SET ${setParts.join(', ')} WHERE id = ?`;
    if (!userIsAdmin) {
      updateQuery = updateQuery.replace('WHERE id = ?', 'WHERE id = ? AND created_by = ?');
      values.push(userId);
    }

    const [updateResult] = await connection.execute(updateQuery, values);

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json(createResponse(false, 'Campaign data not found or access denied'));
    }

    // Fetch updated record with user filtering
    let fetchQuery = `
      SELECT 
        cd.*,
        c.name as campaign_name,
        COALESCE(b.name, 'Unknown') as brand_name,
        cards.card_name as card_display_name,
        users.username as created_by_user
      FROM campaign_data cd
      LEFT JOIN campaigns c ON cd.campaign_id = c.id
      LEFT JOIN brands b ON c.brand = b.id
      LEFT JOIN cards ON cd.card_id = cards.id
      LEFT JOIN users ON cd.created_by = users.id
      WHERE cd.id = ?
    `;
    
    const fetchParams = [Number(id)];
    if (!userIsAdmin) {
      fetchQuery += ` AND cd.created_by = ?`;
      fetchParams.push(userId);
    }

    const [updatedRows] = await connection.execute(fetchQuery, fetchParams);

    await connection.commit();
    
    const updatedRow = updatedRows && updatedRows.length > 0 ? updatedRows[0] : null;
    
    console.log(`[CampaignDataController] Campaign data ${id} updated successfully by user ${userId}`);
    return res.status(200).json(createResponse(
      true, 
      'Campaign data updated successfully', 
      mapDatabaseToFrontend(updatedRow)
    ));
    
  } catch (error) {
    try { await connection.rollback(); } catch {}
    const { statusCode, response } = handleDatabaseError(error, 'campaign data update', req);
    return res.status(statusCode).json(response);
  } finally {
    connection.release();
  }
};

/**
 * DELETE /api/campaign-data/:id
 * Deletes campaign data with ownership validation
 */
const deleteCampaignData = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userIsAdmin = isAdmin(req.user);

    console.log('[CampaignDataController] Deleting campaign data:', id, 'by user:', userId);

    // Build delete query with user filtering for non-admins
    let deleteQuery = 'DELETE FROM campaign_data WHERE id = ?';
    const deleteParams = [Number(id)];
    
    if (!userIsAdmin) {
      deleteQuery = 'DELETE FROM campaign_data WHERE id = ? AND created_by = ?';
      deleteParams.push(userId);
    }

    const [result] = await pool.execute(deleteQuery, deleteParams);

    if (result.affectedRows === 0) {
      console.log(`[CampaignDataController] Campaign data ${id} not found or access denied for user ${userId}`);
      return res.status(404).json(createResponse(false, 'Campaign data not found or access denied'));
    }

    console.log(`[CampaignDataController] Campaign data ${id} deleted successfully by user ${userId}`);
    return res.status(200).json(createResponse(true, 'Campaign data deleted successfully'));
    
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'campaign data deletion');
    return res.status(statusCode).json(response);
  }
};

// =============================================================================
// HELPER ENDPOINTS (no privacy filtering needed for dropdowns)
// =============================================================================

const getCampaignsForDropdown = async (req, res) => {
  try {
    console.log('[CampaignDataController] Fetching campaigns for dropdown');

    // Since campaigns is the master for Campaign Data now, expose it
    const [campaigns] = await pool.execute(
      `
      SELECT id, name
      FROM campaigns
      WHERE is_enabled = 1
      ORDER BY name
      `
    );

    return res.status(200).json(createResponse(true, 'Campaigns retrieved successfully', campaigns || []));
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'campaigns retrieval');
    return res.status(statusCode).json(response);
  }
};

const getCardsForDropdown = async (req, res) => {
  try {
    console.log('[CampaignDataController] Fetching cards for dropdown');
    
    // Check if user is authenticated for privacy filtering
    const userId = req.user?.id;
    const userIsAdmin = isAdmin(req.user);
    
    let query;
    let queryParams;
    
    if (!userId) {
      // If no authentication, return empty array
      console.log('[CampaignDataController] No authenticated user - returning empty cards list');
      return res.status(200).json(createResponse(true, 'Cards retrieved successfully', []));
    }
    
    if (userIsAdmin) {
      // Admins can see all active cards
      query = `
        SELECT id, card_name
        FROM cards
        WHERE is_active = 1
        ORDER BY card_name
      `;
      queryParams = [];
    } else {
      // Regular users can only see cards they created
      query = `
        SELECT id, card_name
        FROM cards
        WHERE is_active = 1 AND created_by = ?
        ORDER BY card_name
      `;
      queryParams = [userId];
    }
    
    const [cards] = await pool.execute(query, queryParams);
    
    console.log(`[CampaignDataController] Retrieved ${cards.length} cards for user ${userId} (${userIsAdmin ? 'admin' : 'regular user'})`);
    
    return res.status(200).json(createResponse(true, 'Cards retrieved successfully', cards || []));
  } catch (error) {
    const { statusCode, response } = handleDatabaseError(error, 'cards retrieval');
    return res.status(statusCode).json(response);
  }
};

module.exports = {
  createCampaignData,
  getAllCampaignData,
  getCampaignDataById,
  updateCampaignData,
  deleteCampaignData,
  getCampaignsForDropdown,
  getCardsForDropdown
};

const { pool } = require('../config/database');
const Joi = require('joi');

// Envelope
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  ...(data !== null && { data }),
  ...(errors && { errors })
});

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

// Validation
const cardUserValidation = {
  createCardUser: Joi.object({
    card_id: Joi.number().integer().positive().required().messages({
      'number.base': 'Card ID must be a number',
      'number.integer': 'Card ID must be an integer',
      'number.positive': 'Card ID must be positive',
      'any.required': 'Card ID is required'
    }),
    user_id: Joi.number().integer().positive().required().messages({
      'number.base': 'User ID must be a number',
      'number.integer': 'User ID must be an integer',
      'number.positive': 'User ID must be positive',
      'any.required': 'User ID is required'
    }),
    assigned_date: Joi.date().optional().messages({
      'date.base': 'Assigned date must be a valid date'
    }),
    is_primary: Joi.boolean().default(false).messages({
      'boolean.base': 'Primary status must be true or false'
    })
  }),

  updateCardUser: Joi.object({
    assigned_date: Joi.date().optional().messages({
      'date.base': 'Assigned date must be a valid date'
    }),
    is_primary: Joi.boolean().optional().messages({
      'boolean.base': 'Primary status must be true or false'
    })
  }).min(1),

  validateId: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required'
    })
  })
};

// Helpers
const validateInput = (schema, data) => {
  const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
  return { isValid: !error, data: value, errors: error ? error.details.map(d => d.message) : null };
};

const toMysqlDate = (val) => {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const handleDatabaseError = (error, operation, res) => {
  console.error(`Database error during ${operation}:`, error);
  switch (error?.code) {
    case 'ER_DUP_ENTRY':
      return res.status(409).json(createResponse(false, 'This card is already assigned to this user', null, process.env.NODE_ENV === 'development' ? [error.message] : null));
    case 'ER_NO_REFERENCED_ROW_2':
      return res.status(400).json(createResponse(false, 'Invalid card ID or user ID provided', null, process.env.NODE_ENV === 'development' ? [error.message] : null));
    case 'ER_ROW_IS_REFERENCED_2':
      return res.status(409).json(createResponse(false, 'Cannot delete card user - record is referenced by other data', null, process.env.NODE_ENV === 'development' ? [error.message] : null));
    default:
      return res.status(500).json(createResponse(false, `Failed to ${operation}`, null, process.env.NODE_ENV === 'development' ? [error.message] : null));
  }
};

const cardUsersController = {
  // Create with automatic ownership
  createCardUser: async (req, res) => {
    try {
      const validation = validateInput(cardUserValidation.createCardUser, req.body);
      if (!validation.isValid) {
        return res.status(400).json(createResponse(false, 'Validation failed', null, validation.errors));
      }

      const { card_id, user_id, assigned_date, is_primary } = validation.data;
      const assignedDate = toMysqlDate(assigned_date) || toMysqlDate(new Date());

      // For regular users, they can only assign cards to themselves
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        if (user_id !== req.user.id) {
          return res.status(403).json(createResponse(false, 'You can only assign cards to yourself'));
        }
      }

      // Card exists and active, and user has access to it
      let cardQuery = 'SELECT id, card_name, is_active, created_by FROM cards WHERE id = ?';
      let cardParams = [Number(card_id)];

      const [cards] = await pool.query(cardQuery, cardParams);
      if (!cards || cards.length === 0) return res.status(404).json(createResponse(false, 'Card not found'));
      if (!cards[0].is_active) return res.status(400).json(createResponse(false, 'Cannot assign an inactive card'));

      // For regular users, check if they own the card OR are assigned to it
      if (!isAdmin) {
        const cardOwnedByUser = cards[0].created_by === req.user.id;
        
        if (!cardOwnedByUser) {
          // Check if user is assigned to this card
          const [assignedCards] = await pool.query('SELECT id FROM card_users WHERE card_id = ? AND user_id = ?', [Number(card_id), req.user.id]);
          const cardAssignedToUser = assignedCards && assignedCards.length > 0;
          
          if (!cardAssignedToUser) {
            return res.status(403).json(createResponse(false, 'You can only assign cards that you own or are assigned to'));
          }
        }
      }

      // User exists and active
      const [users] = await pool.query('SELECT id, username, is_active FROM users WHERE id = ?', [Number(user_id)]);
      if (!users || users.length === 0) return res.status(404).json(createResponse(false, 'User not found'));
      if (!users[0].is_active) return res.status(400).json(createResponse(false, 'Cannot assign card to an inactive user'));

      // Duplicate check
      const [existing] = await pool.query('SELECT id FROM card_users WHERE card_id = ? AND user_id = ?', [Number(card_id), Number(user_id)]);
      if (existing && existing.length > 0) {
        return res.status(409).json(createResponse(false, 'This card is already assigned to this user'));
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Ensure single primary per user
        if (is_primary) {
          await connection.query('UPDATE card_users SET is_primary = FALSE WHERE user_id = ?', [Number(user_id)]);
        }

        const [result] = await connection.query(
          `INSERT INTO card_users (card_id, user_id, assigned_date, is_primary, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [Number(card_id), Number(user_id), assignedDate, is_primary ? 1 : 0, req.user.id]
        );

        if (!result || !result.insertId) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to create card user assignment'));
        }

        await connection.commit();
        connection.release();

        const [newCardUser] = await pool.query(
          `SELECT 
            cu.id,
            cu.card_id,
            cu.user_id,
            cu.assigned_date,
            cu.is_primary,
            cu.created_by,
            cu.created_at,
            cu.updated_at,
            c.card_name,
            c.card_type,
            c.card_number_last4,
            c.current_balance,
            c.credit_limit,
            c.is_active as card_active,
            u.username,
            u.role_id,
            r.display_name as role_name,
            u.is_active as user_active
          FROM card_users cu
          LEFT JOIN cards c ON cu.card_id = c.id
          LEFT JOIN users u ON cu.user_id = u.id
          LEFT JOIN roles r ON u.role_id = r.id
          WHERE cu.id = ?`,
          [Number(result.insertId)]
        );

        const cardUserData = newCardUser[0] || null;
        return res.status(201).json(createResponse(true, 'Card assigned to user successfully', { cardUser: cardUserData }));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'create card user assignment', res);
    }
  },

  // List with privacy filtering - users only see assignments they're involved with
  getAllCardUsers: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const offset = (page - 1) * limit;

      const searchTerm = (req.query.search || '').trim();
      const search = searchTerm ? `%${searchTerm}%` : null;

      const cardId = req.query.card_id ? Number(req.query.card_id) : null;
      const userId = req.query.user_id ? Number(req.query.user_id) : null;
      const isPrimary = typeof req.query.is_primary !== 'undefined' ? (String(req.query.is_primary).toLowerCase() === 'true' ? 1 : 0) : null;

      let countQuery = `
        SELECT COUNT(*) AS total 
        FROM card_users cu
        LEFT JOIN cards c ON cu.card_id = c.id
        LEFT JOIN users u ON cu.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
      `;
      let cardUsersQuery = `
        SELECT 
          cu.id,
          cu.card_id,
          cu.user_id,
          cu.assigned_date,
          cu.is_primary,
          cu.created_by,
          cu.created_at,
          cu.updated_at,
          c.card_name,
          c.card_type,
          c.card_number_last4,
          c.current_balance,
          c.credit_limit,
          c.is_active as card_active,
          u.username,
          u.role_id,
          r.display_name as role_name,
          u.is_active as user_active
        FROM card_users cu
        LEFT JOIN cards c ON cu.card_id = c.id
        LEFT JOIN users u ON cu.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
      `;

      const params = [];
      const where = [];

      // Privacy filtering - users only see assignments they're involved with
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        where.push('(cu.user_id = ? OR cu.created_by = ?)');
        params.push(req.user.id, req.user.id);
      }

      if (search) {
        where.push('(c.card_name LIKE ? OR u.username LIKE ?)');
        params.push(search, search);
      }
      if (cardId) {
        where.push('cu.card_id = ?');
        params.push(cardId);
      }
      if (userId) {
        where.push('cu.user_id = ?');
        params.push(userId);
      }
      if (isPrimary !== null) {
        where.push('cu.is_primary = ?');
        params.push(isPrimary);
      }

      if (where.length) {
        const wc = ' WHERE ' + where.join(' AND ');
        countQuery += wc;
        cardUsersQuery += wc;
      }

      cardUsersQuery += ' ORDER BY cu.created_at DESC LIMIT ? OFFSET ?';

      const [countRows] = await pool.query(countQuery, params);
      const totalCardUsers = Number(countRows[0]?.total || 0);

      const [cardUsers] = await pool.query(cardUsersQuery, [...params, Number(limit), Number(offset)]);

      const totalPages = Math.max(1, Math.ceil(totalCardUsers / limit));
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return res.status(200).json(
        createResponse(true, 'Card user assignments fetched successfully', {
          cardUsers,
          pagination: {
            currentPage: page,
            totalPages,
            totalCardUsers,
            limit,
            hasNextPage,
            hasPrevPage,
            ...(searchTerm && { searchTerm }),
            ...(cardId && { cardId }),
            ...(userId && { userId }),
            ...(isPrimary !== null && { isPrimary: !!isPrimary })
          }
        })
      );
    } catch (error) {
      return handleDatabaseError(error, 'fetch card user assignments', res);
    }
  },

  // Get by id with ownership validation
  getCardUserById: async (req, res) => {
    try {
      const idValidation = validateInput(cardUserValidation.validateId, { id: parseInt(req.params.id, 10) });
      if (!idValidation.isValid) {
        return res.status(400).json(createResponse(false, 'Invalid card user assignment ID', null, idValidation.errors));
      }
      const { id: cardUserId } = idValidation.data;

      const [rows] = await pool.query(
        `SELECT 
          cu.id,
          cu.card_id,
          cu.user_id,
          cu.assigned_date,
          cu.is_primary,
          cu.created_by,
          cu.created_at,
          cu.updated_at,
          c.card_name,
          c.card_type,
          c.card_number_last4,
          c.current_balance,
          c.credit_limit,
          c.is_active as card_active,
          u.username,
          u.role_id,
          r.display_name as role_name,
          u.is_active as user_active
        FROM card_users cu
        LEFT JOIN cards c ON cu.card_id = c.id
        LEFT JOIN users u ON cu.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE cu.id = ?`,
        [Number(cardUserId)]
      );

      if (!rows || rows.length === 0) {
        return res.status(404).json(createResponse(false, 'Card user assignment not found'));
      }

      const cardUser = rows[0];

      // Privacy check - only involved users or admin can access
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        if (cardUser.user_id !== req.user.id && cardUser.created_by !== req.user.id) {
          return res.status(403).json(createResponse(false, 'Access denied. You can only access assignments you are involved with.'));
        }
      }

      return res.status(200).json(createResponse(true, 'Card user assignment retrieved successfully', { cardUser: cardUser }));
    } catch (error) {
      return handleDatabaseError(error, 'fetch card user assignment', res);
    }
  },

  // Update with ownership validation
  updateCardUser: async (req, res) => {
    try {
      const idValidation = validateInput(cardUserValidation.validateId, { id: parseInt(req.params.id, 10) });
      if (!idValidation.isValid) {
        return res.status(400).json(createResponse(false, 'Invalid card user assignment ID', null, idValidation.errors));
      }
      const updateValidation = validateInput(cardUserValidation.updateCardUser, req.body);
      if (!updateValidation.isValid) {
        return res.status(400).json(createResponse(false, 'Validation failed', null, updateValidation.errors));
      }

      const { id: cardUserId } = idValidation.data;
      const updateData = { ...updateValidation.data };

      const [existing] = await pool.query('SELECT id, user_id, is_primary, created_by FROM card_users WHERE id = ?', [Number(cardUserId)]);
      if (!existing || existing.length === 0) {
        return res.status(404).json(createResponse(false, 'Card user assignment not found'));
      }
      const existingRow = existing[0];

      // Privacy check - only creator or admin can update
      if (!isAdminOrOwner(req, existingRow.created_by)) {
        return res.status(403).json(createResponse(false, 'Access denied. You can only update assignments you created.'));
      }

      const fields = Object.keys(updateData);
      if (fields.length === 0) {
        return res.status(400).json(createResponse(false, 'No valid fields provided for update'));
      }

      // Normalize
      if (Object.prototype.hasOwnProperty.call(updateData, 'assigned_date')) {
        const nd = toMysqlDate(updateData.assigned_date);
        if (nd) updateData.assigned_date = nd; else delete updateData.assigned_date;
      }
      if (Object.prototype.hasOwnProperty.call(updateData, 'is_primary')) {
        updateData.is_primary = updateData.is_primary ? 1 : 0;
      }

      // Always update timestamp
      updateData.updated_at = new Date();

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // If setting primary to true when previously false, unset other primaries for the same user
        if (updateData.is_primary === 1 && !existingRow.is_primary) {
          await connection.query('UPDATE card_users SET is_primary = FALSE WHERE user_id = ? AND id != ?', [Number(existingRow.user_id), Number(cardUserId)]);
        }

        const setClause = Object.keys(updateData).map(k => `${k} = ?`).join(', ');
        const values = [...Object.values(updateData), Number(cardUserId)];

        const [result] = await connection.query(`UPDATE card_users SET ${setClause} WHERE id = ?`, values);
        if (!result || result.affectedRows === 0) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to update card user assignment'));
        }

        await connection.commit();
        connection.release();

        const [updated] = await pool.query(
          `SELECT 
            cu.id,
            cu.card_id,
            cu.user_id,
            cu.assigned_date,
            cu.is_primary,
            cu.created_by,
            cu.created_at,
            cu.updated_at,
            c.card_name,
            c.card_type,
            c.card_number_last4,
            c.current_balance,
            c.credit_limit,
            c.is_active as card_active,
            u.username,
            u.role_id,
            r.display_name as role_name,
            u.is_active as user_active
          FROM card_users cu
          LEFT JOIN cards c ON cu.card_id = c.id
          LEFT JOIN users u ON cu.user_id = u.id
          LEFT JOIN roles r ON u.role_id = r.id
          WHERE cu.id = ?`,
          [Number(cardUserId)]
        );

        return res.status(200).json(createResponse(true, 'Card user assignment updated successfully', { cardUser: updated[0] || null }));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'update card user assignment', res);
    }
  },

  // Delete with ownership validation
  deleteCardUser: async (req, res) => {
    try {
      const idValidation = validateInput(cardUserValidation.validateId, { id: parseInt(req.params.id, 10) });
      if (!idValidation.isValid) {
        return res.status(400).json(createResponse(false, 'Invalid card user assignment ID', null, idValidation.errors));
      }
      const { id: cardUserId } = idValidation.data;

      const [existing] = await pool.query(
        `SELECT 
          cu.id, 
          cu.user_id,
          cu.is_primary,
          cu.created_by,
          c.card_name, 
          u.username
        FROM card_users cu
        LEFT JOIN cards c ON cu.card_id = c.id
        LEFT JOIN users u ON cu.user_id = u.id
        WHERE cu.id = ?`,
        [Number(cardUserId)]
      );
      if (!existing || existing.length === 0) {
        return res.status(404).json(createResponse(false, 'Card user assignment not found'));
      }
      const row = existing[0];

      // Privacy check - only creator or admin can delete
      if (!isAdminOrOwner(req, row.created_by)) {
        return res.status(403).json(createResponse(false, 'Access denied. You can only delete assignments you created.'));
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [result] = await connection.query('DELETE FROM card_users WHERE id = ?', [Number(cardUserId)]);
        if (!result || result.affectedRows === 0) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to delete card user assignment'));
        }

        await connection.commit();
        connection.release();

        return res.status(200).json(createResponse(true, `Card "${row.card_name}" has been unassigned from user "${row.username}" successfully`));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'delete card user assignment', res);
    }
  },

  // Helper: cards by user - only for the logged in user or admins
  getCardsByUser: async (req, res) => {
    try {
      const userId = parseInt(req.params.userId, 10);
      if (!userId || userId <= 0) return res.status(400).json(createResponse(false, 'Invalid user ID'));

      // Privacy check - users can only get their own cards
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        if (userId !== req.user.id) {
          return res.status(403).json(createResponse(false, 'You can only view your own card assignments'));
        }
      }

      const [rows] = await pool.query(
        `SELECT 
          cu.id,
          cu.assigned_date,
          cu.is_primary,
          c.id as card_id,
          c.card_name,
          c.card_type,
          c.card_number_last4,
          c.current_balance,
          c.credit_limit,
          c.is_active as card_active
        FROM card_users cu
        LEFT JOIN cards c ON cu.card_id = c.id
        WHERE cu.user_id = ?
        ORDER BY cu.is_primary DESC, cu.assigned_date DESC`,
        [Number(userId)]
      );

      return res.status(200).json(createResponse(true, 'User cards retrieved successfully', { cards: rows || [] }));
    } catch (error) {
      return handleDatabaseError(error, 'fetch user cards', res);
    }
  },

  // Helper: users by card - only for cards the user owns or admins
  getUsersByCard: async (req, res) => {
    try {
      const cardId = parseInt(req.params.cardId, 10);
      if (!cardId || cardId <= 0) return res.status(400).json(createResponse(false, 'Invalid card ID'));

      // Privacy check - users can only get users for cards they own
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        const [cardCheck] = await pool.query('SELECT created_by FROM cards WHERE id = ?', [cardId]);
        if (!cardCheck.length || cardCheck[0].created_by !== req.user.id) {
          return res.status(403).json(createResponse(false, 'You can only view users for cards you own'));
        }
      }

      const [rows] = await pool.query(
        `SELECT 
          cu.id,
          cu.assigned_date,
          cu.is_primary,
          u.id as user_id,
          u.username,
          u.role_id,
          r.display_name as role_name,
          u.is_active as user_active
        FROM card_users cu
        LEFT JOIN users u ON cu.user_id = u.id
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE cu.card_id = ?
        ORDER BY cu.is_primary DESC, cu.assigned_date DESC`,
        [Number(cardId)]
      );

      return res.status(200).json(createResponse(true, 'Card users retrieved successfully', { users: rows || [] }));
    } catch (error) {
      return handleDatabaseError(error, 'fetch card users', res);
    }
  }
};

module.exports = cardUsersController;

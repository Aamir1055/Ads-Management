const { pool } = require('../config/database');
const Joi = require('joi');

// Envelope
const createResponse = (success, message, data = null, errors = null) => ({
  success,
  message,
  ...(data !== null && { data }),
  ...(errors && { errors }),
});

// Validation schemas
const cardValidation = {
  createCard: Joi.object({
    card_name: Joi.string().trim().min(2).max(255).required().messages({
      'string.empty': 'Card name is required',
      'string.min': 'Card name must be at least 2 characters long',
      'string.max': 'Card name must not exceed 255 characters',
      'any.required': 'Card name is required',
    }),
    card_number_last4: Joi.string().trim().pattern(/^[0-9]{4}$/).optional().messages({
      'string.pattern.base': 'Last 4 digits must be exactly 4 numbers',
    }),
    card_type: Joi.string().trim().max(50).optional().messages({
      'string.max': 'Card type must not exceed 50 characters',
    }),
    current_balance: Joi.number().precision(2).min(-999999999999.99).max(999999999999.99).default(0.00).messages({
      'number.base': 'Current balance must be a valid number',
      'number.precision': 'Current balance can have maximum 2 decimal places',
      'number.min': 'Current balance is too small',
      'number.max': 'Current balance is too large',
    }),
    credit_limit: Joi.number().precision(2).min(0).max(999999999999.99).optional().messages({
      'number.base': 'Credit limit must be a valid number',
      'number.precision': 'Credit limit can have maximum 2 decimal places',
      'number.min': 'Credit limit cannot be negative',
      'number.max': 'Credit limit is too large',
    }),
    is_active: Joi.boolean().default(true).messages({
      'boolean.base': 'Active status must be true or false',
    }),
  }),

  updateCard: Joi.object({
    card_name: Joi.string().trim().min(1).max(255).optional().allow(''),
    card_number_last4: Joi.string().trim().optional().allow('').allow(null),
    card_type: Joi.string().trim().max(100).optional().allow('').allow(null),
    current_balance: Joi.alternatives().try(
      Joi.number().min(-999999999999.99).max(999999999999.99),
      Joi.string().allow('')
    ).optional().allow(null),
    credit_limit: Joi.alternatives().try(
      Joi.number().min(0).max(999999999999.99),
      Joi.string().allow('')
    ).optional().allow(null),
    is_active: Joi.alternatives().try(Joi.boolean(), Joi.string(), Joi.number()).optional(),
  }).unknown(true),

  validateId: Joi.object({
    id: Joi.number().integer().positive().required().messages({
      'number.base': 'ID must be a number',
      'number.integer': 'ID must be an integer',
      'number.positive': 'ID must be positive',
      'any.required': 'ID is required',
    }),
  }),

  addBalance: Joi.object({
    amount: Joi.number().required(),
    description: Joi.string().optional(),
  }),
};

// Validate helper
const validateInput = (schema, data) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });
  return {
    isValid: !error,
    data: value,
    errors: error ? error.details.map((d) => d.message) : null,
  };
};

// DB error handler
const handleDatabaseError = (error, operation, res) => {
  console.error(`Database error during ${operation}:`, error);
  if (error && error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json(createResponse(false, 'Card name already exists', null, process.env.NODE_ENV === 'development' ? [error.message] : null));
  }
  if (error && error.code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json(createResponse(false, 'Cannot delete card - record is referenced by other data', null, process.env.NODE_ENV === 'development' ? [error.message] : null));
  }
  return res.status(500).json(createResponse(false, `Failed to ${operation}`, null, process.env.NODE_ENV === 'development' ? [error.message] : null));
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

// Controller
const cardsController = {
  // Create - with automatic user assignment
  createCard: async (req, res) => {
    try {
      const validation = validateInput(cardValidation.createCard, req.body);
      if (!validation.isValid) {
        return res.status(400).json(createResponse(false, 'Validation failed', null, validation.errors));
      }

      const { card_name, card_number_last4 = null, card_type = null, current_balance = 0.0, credit_limit = null, is_active = true } = validation.data;
      
      // Get user from token (set by authentication middleware)
      const currentUserId = req.user.id;

      // Duplicate check - scoped to user for non-admins
      let duplicateQuery = 'SELECT id FROM cards WHERE card_name = ?';
      let duplicateParams = [card_name];
      
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        duplicateQuery += ' AND created_by = ?';
        duplicateParams.push(currentUserId);
      }
      
      const [existingCards] = await pool.query(duplicateQuery, duplicateParams);
      if (existingCards && existingCards.length > 0) {
        return res.status(409).json(createResponse(false, 'Card name already exists'));
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [result] = await connection.query(
          `INSERT INTO cards (card_name, card_number_last4, card_type, current_balance, credit_limit, is_active, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [card_name, card_number_last4, card_type, Number(current_balance), credit_limit !== null ? Number(credit_limit) : null, is_active ? 1 : 0, currentUserId]
        );

        if (!result || !result.insertId) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to create card'));
        }

        await connection.commit();
        connection.release();

        const [newCards] = await pool.query('SELECT * FROM cards WHERE id = ?', [result.insertId]);
        const cardData = newCards[0] || null;

        return res.status(201).json(createResponse(true, 'Card created successfully', { card: cardData }));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'create card', res);
    }
  },

  // List with pagination/filter - filtered by user ownership
  getAllCards: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const offset = (page - 1) * limit;

      const searchTerm = (req.query.search || '').trim();
      const search = searchTerm ? `%${searchTerm}%` : null;

      // active=true/false or omit
      const activeParam = (req.query.is_active ?? req.query.active);
      const activeFilter = typeof activeParam !== 'undefined' ? (String(activeParam).toLowerCase() === 'true' ? 1 : 0) : null;

      let countQuery = 'SELECT COUNT(*) AS total FROM cards';
      let cardsQuery = `
        SELECT 
          id,
          card_name,
          card_number_last4,
          card_type,
          current_balance,
          credit_limit,
          is_active,
          created_by,
          created_at,
          updated_at
        FROM cards`;

      const queryParams = [];
      const where = [];

      // Add privacy filtering for non-admins
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        where.push('created_by = ?');
        queryParams.push(req.user.id);
      }

      if (search) {
        where.push('(card_name LIKE ? OR card_type LIKE ?)');
        queryParams.push(search, search);
      }

      if (activeFilter !== null) {
        where.push('is_active = ?');
        queryParams.push(activeFilter);
      }

      if (where.length) {
        const wc = ` WHERE ${where.join(' AND ')}`;
        countQuery += wc;
        cardsQuery += wc;
      }

      cardsQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

      // totals
      const [countRows] = await pool.query(countQuery, queryParams);
      const totalCards = Number((Array.isArray(countRows) ? countRows[0]?.total : countRows?.total) || 0);

      // page rows
      const [cards] = await pool.query(cardsQuery, [...queryParams, Number(limit), Number(offset)]);

      const totalPages = Math.max(1, Math.ceil(totalCards / limit));
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return res.status(200).json(
        createResponse(true, 'Cards fetched successfully', {
          cards,
          pagination: {
            currentPage: page,
            totalPages,
            totalCards,
            limit,
            hasNextPage,
            hasPrevPage,
            ...(searchTerm && { searchTerm }),
            ...(activeFilter !== null && { activeFilter: !!activeFilter }),
          },
        })
      );
    } catch (error) {
      return handleDatabaseError(error, 'fetch cards', res);
    }
  },

  // Get active cards for assignment dropdowns - with ownership validation
  getActiveCards: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
      const offset = (page - 1) * limit;

      const searchTerm = (req.query.search || '').trim();
      const search = searchTerm ? `%${searchTerm}%` : null;

      let countQuery = 'SELECT COUNT(*) AS total FROM cards WHERE is_active = 1';
      let cardsQuery = `
        SELECT 
          id,
          card_name,
          card_number_last4,
          card_type,
          current_balance,
          credit_limit,
          is_active,
          created_by,
          created_at,
          updated_at
        FROM cards WHERE is_active = 1`;

      const queryParams = [];
      const where = [];

      // Add privacy filtering for non-admins
      const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
      if (!isAdmin) {
        where.push('created_by = ?');
        queryParams.push(req.user.id);
      }

      if (search) {
        where.push('(card_name LIKE ? OR card_type LIKE ?)');
        queryParams.push(search, search);
      }

      if (where.length) {
        const wc = ` AND ${where.join(' AND ')}`;
        countQuery += wc;
        cardsQuery += wc;
      }

      cardsQuery += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

      // totals
      const [countRows] = await pool.query(countQuery, queryParams);
      const totalCards = Number((Array.isArray(countRows) ? countRows[0]?.total : countRows?.total) || 0);

      // page rows
      const [cards] = await pool.query(cardsQuery, [...queryParams, Number(limit), Number(offset)]);

      const totalPages = Math.max(1, Math.ceil(totalCards / limit));
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;

      return res.status(200).json(
        createResponse(true, 'Active cards fetched successfully', {
          cards,
          pagination: {
            currentPage: page,
            totalPages,
            totalCards,
            limit,
            hasNextPage,
            hasPrevPage,
            ...(searchTerm && { searchTerm }),
            activeFilter: true, // Always true for this endpoint
          },
        })
      );
    } catch (error) {
      return handleDatabaseError(error, 'fetch active cards', res);
    }
  },

  // Get by id - with ownership validation
  getCardById: async (req, res) => {
    try {
      const idValidation = validateInput(cardValidation.validateId, { id: parseInt(req.params.id, 10) });
      if (!idValidation.isValid) {
        return res.status(400).json(createResponse(false, 'Invalid card ID', null, idValidation.errors));
      }

      const { id: cardId } = idValidation.data;

      const [cards] = await pool.query('SELECT * FROM cards WHERE id = ?', [cardId]);
      if (!cards || cards.length === 0) {
        return res.status(404).json(createResponse(false, 'Card not found'));
      }

      const card = cards[0];

      // Privacy check - only owner or admin can access
      if (!isAdminOrOwner(req, card.created_by)) {
        return res.status(403).json(createResponse(false, 'Access denied. You can only access cards you created.'));
      }

      return res.status(200).json(createResponse(true, 'Card retrieved successfully', { card: card }));
    } catch (error) {
      return handleDatabaseError(error, 'fetch card', res);
    }
  },

  // Update - with ownership validation
  updateCard: async (req, res) => {
    try {
      const idValidation = validateInput(cardValidation.validateId, { id: parseInt(req.params.id, 10) });
      if (!idValidation.isValid) {
        return res.status(400).json(createResponse(false, 'Invalid card ID', null, idValidation.errors));
      }

      const updateValidation = validateInput(cardValidation.updateCard, req.body);
      if (!updateValidation.isValid) {
        return res.status(400).json(createResponse(false, 'Validation failed', null, updateValidation.errors));
      }

      const { id: cardId } = idValidation.data;
      const updateData = { ...updateValidation.data };

      // Normalize empty strings to nulls where appropriate
      if (updateData.card_number_last4 === '') updateData.card_number_last4 = null;
      if (updateData.card_type === '') updateData.card_type = null;
      if (updateData.current_balance === '') delete updateData.current_balance;
      if (updateData.credit_limit === '') delete updateData.credit_limit;

      // Check if card exists and user has access
      const [existingCards] = await pool.query('SELECT id, card_name, created_by FROM cards WHERE id = ?', [cardId]);
      if (!existingCards || existingCards.length === 0) {
        return res.status(404).json(createResponse(false, 'Card not found'));
      }

      const existingCard = existingCards[0];

      // Privacy check - only owner or admin can update
      if (!isAdminOrOwner(req, existingCard.created_by)) {
        return res.status(403).json(createResponse(false, 'Access denied. You can only update cards you created.'));
      }

      // Duplicate name check - scoped to user for non-admins
      if (updateData.card_name && updateData.card_name !== existingCard.card_name) {
        let duplicateQuery = 'SELECT id FROM cards WHERE card_name = ? AND id != ?';
        let duplicateParams = [updateData.card_name, cardId];
        
        const isAdmin = req.user.role && (req.user.role.level >= 8 || req.user.role.name === 'super_admin' || req.user.role.name === 'admin');
        if (!isAdmin) {
          duplicateQuery += ' AND created_by = ?';
          duplicateParams.push(req.user.id);
        }
        
        const [dups] = await pool.query(duplicateQuery, duplicateParams);
        if (dups && dups.length > 0) {
          return res.status(409).json(createResponse(false, 'Card name already exists'));
        }
      }

      const fields = Object.keys(updateData);
      if (fields.length === 0) {
        return res.status(400).json(createResponse(false, 'No valid fields provided for update'));
      }

      // Normalize is_active to 0/1 if present
      if (Object.prototype.hasOwnProperty.call(updateData, 'is_active')) {
        updateData.is_active = updateData.is_active ? 1 : 0;
      }

      // Push updated_at
      updateData.updated_at = new Date();

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const setClause = Object.keys(updateData).map((k) => `${k} = ?`).join(', ');
        const values = [...Object.values(updateData), cardId];

        const [result] = await connection.query(`UPDATE cards SET ${setClause} WHERE id = ?`, values);
        if (!result || result.affectedRows === 0) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to update card'));
        }

        await connection.commit();
        connection.release();

        const [updatedRows] = await pool.query('SELECT * FROM cards WHERE id = ?', [cardId]);
        return res.status(200).json(createResponse(true, 'Card updated successfully', { card: updatedRows[0] || null }));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'update card', res);
    }
  },

  // Add balance to card - with ownership validation
  addBalance: async (req, res) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      const { amount } = req.body;
      
      if (!cardId || isNaN(cardId)) {
        return res.status(400).json(createResponse(false, 'Invalid card ID'));
      }
      
      if (!amount || isNaN(parseFloat(amount))) {
        return res.status(400).json(createResponse(false, 'Invalid amount'));
      }

      // Check if card exists and is active, and user has access
      const [existingCards] = await pool.query('SELECT id, card_name, current_balance, is_active, created_by FROM cards WHERE id = ?', [cardId]);
      if (!existingCards || existingCards.length === 0) {
        return res.status(404).json(createResponse(false, 'Card not found'));
      }

      const cardData = existingCards[0];

      // Privacy check - only owner or admin can add balance
      if (!isAdminOrOwner(req, cardData.created_by)) {
        return res.status(403).json(createResponse(false, 'Access denied. You can only add balance to cards you created.'));
      }

      if (!cardData.is_active) {
        return res.status(400).json(createResponse(false, 'Cannot add balance to an inactive card'));
      }

      const currentBalance = Number(cardData.current_balance) || 0;
      const newBalance = currentBalance + Number(amount);

      // Ensure the new balance doesn't exceed reasonable limits
      if (newBalance > 999999999999.99) {
        return res.status(400).json(createResponse(false, 'New balance would exceed maximum limit'));
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Update card balance
        const [result] = await connection.query(
          'UPDATE cards SET current_balance = ?, updated_at = NOW() WHERE id = ?',
          [newBalance, cardId]
        );

        if (!result || result.affectedRows === 0) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to add balance to card'));
        }

        await connection.commit();
        connection.release();

        // Get updated card data
        const [updatedCards] = await pool.query('SELECT * FROM cards WHERE id = ?', [cardId]);
        const updatedCard = updatedCards[0];

        return res.status(200).json(createResponse(true, 
          `Successfully added $${amount.toFixed(2)} to ${cardData.card_name}. New balance: $${newBalance.toFixed(2)}`, 
          { 
            card: updatedCard,
            transaction: {
              amount: Number(amount),
              previous_balance: currentBalance,
              new_balance: newBalance,
              description: 'Balance addition',
              timestamp: new Date().toISOString()
            }
          }
        ));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'add balance', res);
    }
  },

  // Soft delete (deactivate) - with ownership validation
  deleteCard: async (req, res) => {
    try {
      const idValidation = validateInput(cardValidation.validateId, { id: parseInt(req.params.id, 10) });
      if (!idValidation.isValid) {
        return res.status(400).json(createResponse(false, 'Invalid card ID', null, idValidation.errors));
      }

      const { id: cardId } = idValidation.data;

      const [existingCards] = await pool.query('SELECT id, card_name, is_active, created_by FROM cards WHERE id = ?', [cardId]);
      if (!existingCards || existingCards.length === 0) {
        return res.status(404).json(createResponse(false, 'Card not found'));
      }

      const cardData = existingCards[0];

      // Privacy check - only owner or admin can delete
      if (!isAdminOrOwner(req, cardData.created_by)) {
        return res.status(403).json(createResponse(false, 'Access denied. You can only delete cards you created.'));
      }

      if (!cardData.is_active) {
        return res.status(200).json(createResponse(true, 'Card is already inactive'));
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [result] = await connection.query('UPDATE cards SET is_active = FALSE, updated_at = NOW() WHERE id = ?', [cardId]);
        if (!result || result.affectedRows === 0) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to deactivate card'));
        }

        await connection.commit();
        connection.release();

        return res.status(200).json(createResponse(true, `Card "${cardData.card_name}" has been deactivated successfully`));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'delete card', res);
    }
  },
};

module.exports = cardsController;

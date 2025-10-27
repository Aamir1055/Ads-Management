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
    account_id: Joi.number().integer().positive().optional().allow(null).messages({
      'number.base': 'Account ID must be a number',
      'number.integer': 'Account ID must be an integer',
      'number.positive': 'Account ID must be positive',
    }),

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

// Controller
const cardsController = {
  // Create
  createCard: async (req, res) => {
    try {
      const validation = validateInput(cardValidation.createCard, req.body);
      if (!validation.isValid) {
        return res.status(400).json(createResponse(false, 'Validation failed', null, validation.errors));
      }

  const { card_name, card_number_last4 = null, card_type = null, current_balance = 0.0, credit_limit = null, is_active = true, account_id = null } = validation.data;
      
      // Get user ID from request (set by auth middleware)
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createResponse(false, 'User authentication required'));
      }

      // Duplicate check
      const [existingCards] = await pool.query('SELECT id FROM cards WHERE card_name = ?', [card_name]);
      if (existingCards && existingCards.length > 0) {
        return res.status(409).json(createResponse(false, 'Card name already exists'));
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // Insert card with created_by field
        const [result] = await connection.query(
          `INSERT INTO cards (card_name, card_number_last4, card_type, current_balance, credit_limit, is_active, account_id, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [card_name, card_number_last4, card_type, Number(current_balance), credit_limit !== null ? Number(credit_limit) : null, is_active ? 1 : 0, account_id !== null ? Number(account_id) : null, userId]
        );

        if (!result || !result.insertId) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to create card'));
        }

        const cardId = result.insertId;

        // Automatically assign the card to the creator as primary
        const [assignResult] = await connection.query(
          `INSERT INTO card_users (card_id, user_id, assigned_date, is_primary, created_at)
           VALUES (?, ?, CURDATE(), 1, NOW())`,
          [cardId, userId]
        );

        if (!assignResult) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to assign card to user'));
        }

        await connection.commit();
        connection.release();

        const [newCards] = await pool.query('SELECT * FROM cards WHERE id = ?', [cardId]);
        const cardData = newCards || null;

        return res.status(201).json(createResponse(true, 'Card created and assigned successfully', { card: cardData }));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'create card', res);
    }
  },

  // List with pagination/filter
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
          account_id,
          created_at,
          updated_at
        FROM cards`;

      const queryParams = [];
      const where = [];

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

  // Get by id
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

      return res.status(200).json(createResponse(true, 'Card retrieved successfully', { card: cards }));
    } catch (error) {
      return handleDatabaseError(error, 'fetch card', res);
    }
  },

  // Update
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

      // Exists?
      const [existingCards] = await pool.query('SELECT id, card_name FROM cards WHERE id = ?', [cardId]);
      if (!existingCards || existingCards.length === 0) {
        return res.status(404).json(createResponse(false, 'Card not found'));
      }

      // Duplicate name?
      if (updateData.card_name && updateData.card_name !== existingCards[0].card_name) {
        const [dups] = await pool.query('SELECT id FROM cards WHERE card_name = ? AND id != ?', [updateData.card_name, cardId]);
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
  return res.status(200).json(createResponse(true, 'Card updated successfully', { card: updatedRows || null }));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'update card', res);
    }
  },

  // Add balance to card
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

      // Check if card exists and is active
      const [existingCards] = await pool.query('SELECT id, card_name, current_balance, is_active FROM cards WHERE id = ?', [cardId]);
      if (!existingCards || existingCards.length === 0) {
        return res.status(404).json(createResponse(false, 'Card not found'));
      }

      const cardData = existingCards[0];

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

  // Soft delete (deactivate)
  deleteCard: async (req, res) => {
    try {
      const idValidation = validateInput(cardValidation.validateId, { id: parseInt(req.params.id, 10) });
      if (!idValidation.isValid) {
        return res.status(400).json(createResponse(false, 'Invalid card ID', null, idValidation.errors));
      }

      const { id: cardId } = idValidation.data;

      const [existingCards] = await pool.query('SELECT id, card_name, is_active FROM cards WHERE id = ?', [cardId]);
      if (!existingCards || existingCards.length === 0) {
        return res.status(404).json(createResponse(false, 'Card not found'));
      }

      const cardData = existingCards[0];

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

  // Toggle card active/inactive status (for card owners)
  toggleCardStatus: async (req, res) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      const userId = req.user?.id;
      
      if (!cardId || isNaN(cardId)) {
        return res.status(400).json(createResponse(false, 'Invalid card ID'));
      }

      if (!userId) {
        return res.status(401).json(createResponse(false, 'User authentication required'));
      }

      // Get current card status
      const [cards] = await pool.query('SELECT id, card_name, is_active FROM cards WHERE id = ?', [cardId]);
      if (!cards || cards.length === 0) {
        return res.status(404).json(createResponse(false, 'Card not found'));
      }

      const card = cards[0];
      const newStatus = !card.is_active;

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        const [result] = await connection.query(
          'UPDATE cards SET is_active = ?, updated_at = NOW() WHERE id = ?',
          [newStatus, cardId]
        );

        if (!result || result.affectedRows === 0) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to update card status'));
        }

        await connection.commit();
        connection.release();

        const statusText = newStatus ? 'activated' : 'deactivated';
        return res.status(200).json(createResponse(true, `Card "${card.card_name}" has been ${statusText} successfully`, {
          cardId: cardId,
          cardName: card.card_name,
          isActive: newStatus
        }));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'toggle card status', res);
    }
  },

  // Set card as primary/secondary (for card owners)
  setCardPriority: async (req, res) => {
    try {
      const cardId = parseInt(req.params.id, 10);
      const userId = req.user?.id;
      const { is_primary } = req.body;
      
      if (!cardId || isNaN(cardId)) {
        return res.status(400).json(createResponse(false, 'Invalid card ID'));
      }

      if (!userId) {
        return res.status(401).json(createResponse(false, 'User authentication required'));
      }

      if (typeof is_primary !== 'boolean') {
        return res.status(400).json(createResponse(false, 'is_primary must be a boolean value'));
      }

      // Check if user has this card assigned
      const [cardUsers] = await pool.query(
        'SELECT id, is_primary FROM card_users WHERE card_id = ? AND user_id = ?',
        [cardId, userId]
      );

      if (!cardUsers || cardUsers.length === 0) {
        return res.status(404).json(createResponse(false, 'Card assignment not found for this user'));
      }

      const cardUser = cardUsers[0];
      
      if (cardUser.is_primary === is_primary) {
        const currentStatus = is_primary ? 'primary' : 'secondary';
        return res.status(200).json(createResponse(true, `Card is already set as ${currentStatus}`));
      }

      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();

        // If setting as primary, unset any other primary cards for this user
        if (is_primary) {
          await connection.query(
            'UPDATE card_users SET is_primary = FALSE WHERE user_id = ? AND card_id != ?',
            [userId, cardId]
          );
        }

        // Update the current card assignment
        const [result] = await connection.query(
          'UPDATE card_users SET is_primary = ?, updated_at = NOW() WHERE card_id = ? AND user_id = ?',
          [is_primary, cardId, userId]
        );

        if (!result || result.affectedRows === 0) {
          await connection.rollback();
          connection.release();
          return res.status(500).json(createResponse(false, 'Failed to update card priority'));
        }

        await connection.commit();
        connection.release();

        const priorityText = is_primary ? 'primary' : 'secondary';
        
        // Get updated card info
        const [updatedCard] = await pool.query(
          'SELECT c.card_name FROM cards c WHERE c.id = ?',
          [cardId]
        );

        return res.status(200).json(createResponse(true, `Card "${updatedCard[0].card_name}" has been set as ${priorityText}`, {
          cardId: cardId,
          cardName: updatedCard[0].card_name,
          isPrimary: is_primary
        }));
      } catch (dbError) {
        try { await connection.rollback(); } catch {}
        connection.release();
        throw dbError;
      }
    } catch (error) {
      return handleDatabaseError(error, 'set card priority', res);
    }
  },

  // Get user's own cards
  getMyCards: async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json(createResponse(false, 'User authentication required'));
      }

      const [userCards] = await pool.query(`
        SELECT 
          c.id,
          c.card_name,
          c.card_number_last4,
          c.card_type,
          c.current_balance,
          c.credit_limit,
          c.is_active,
          c.created_at,
          cu.is_primary,
          cu.assigned_date
        FROM cards c
        INNER JOIN card_users cu ON c.id = cu.card_id
        WHERE cu.user_id = ?
        ORDER BY cu.is_primary DESC, c.created_at DESC
      `, [userId]);

      return res.status(200).json(createResponse(true, 'User cards retrieved successfully', {
        cards: userCards || [],
        totalCards: userCards ? userCards.length : 0
      }));
    } catch (error) {
      return handleDatabaseError(error, 'fetch user cards', res);
    }
  },
};

module.exports = cardsController;

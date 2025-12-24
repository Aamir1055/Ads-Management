const { pool } = require('../config/database');

/**
 * Middleware to check if a user owns a card or has permission to modify it
 * Only card owners and super admins can edit/delete cards
 */
const checkCardOwnership = async (req, res, next) => {
  try {
    const cardId = parseInt(req.params.id, 10);
    const userId = req.user?.id;
    const userRole = req.user?.role_name;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!cardId || isNaN(cardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid card ID'
      });
    }

    // Super admins can access any card
    if (userRole === 'super_admin') {
      return next();
    }

    // Check if the user owns the card through card_users table
    const [cardOwnership] = await pool.query(`
      SELECT cu.user_id, c.created_by, c.card_name
      FROM cards c
      LEFT JOIN card_users cu ON c.id = cu.card_id AND cu.user_id = ?
      WHERE c.id = ?
    `, [userId, cardId]);

    if (!cardOwnership || cardOwnership.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    const card = cardOwnership[0];

    // Check if user owns the card (either created it or is assigned to it)
    const isOwner = card.created_by === userId || card.user_id === userId;

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify cards that belong to you.'
      });
    }

    // Add card info to request for potential use in the route handler
    req.cardInfo = {
      cardId: cardId,
      cardName: card.card_name,
      isOwner: isOwner,
      isSuperAdmin: false
    };

    next();
  } catch (error) {
    console.error('Error in checkCardOwnership middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during ownership validation'
    });
  }
};

/**
 * Middleware to check card ownership for card-user assignment operations
 * Only the card owner and super admins can modify card assignments
 */
const checkCardAssignmentOwnership = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role_name;
    let cardId;

    // Card ID might be in params.id, params.cardId, or req.body.card_id
    if (req.params.id && req.route.path.includes('card-users')) {
      // For card-users/:id endpoints, we need to get card_id from the card_users record
      const [cardUser] = await pool.query('SELECT card_id FROM card_users WHERE id = ?', [req.params.id]);
      if (!cardUser || cardUser.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Card assignment not found'
        });
      }
      cardId = cardUser[0].card_id;
    } else {
      cardId = parseInt(req.params.cardId || req.body.card_id, 10);
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    if (!cardId || isNaN(cardId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid card ID'
      });
    }

    // Super admins can modify any card assignments
    if (userRole === 'super_admin') {
      req.cardInfo = {
        cardId: cardId,
        isOwner: true,
        isSuperAdmin: true
      };
      return next();
    }

    // Check if the user owns the card
    const [cardOwnership] = await pool.query(`
      SELECT cu.user_id, c.created_by, c.card_name
      FROM cards c
      LEFT JOIN card_users cu ON c.id = cu.card_id AND cu.user_id = ?
      WHERE c.id = ?
    `, [userId, cardId]);

    if (!cardOwnership || cardOwnership.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Card not found'
      });
    }

    const card = cardOwnership[0];
    const isOwner = card.created_by === userId || card.user_id === userId;

    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only modify assignments for cards that belong to you.'
      });
    }

    req.cardInfo = {
      cardId: cardId,
      cardName: card.card_name,
      isOwner: isOwner,
      isSuperAdmin: false
    };

    next();
  } catch (error) {
    console.error('Error in checkCardAssignmentOwnership middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during ownership validation'
    });
  }
};

module.exports = {
  checkCardOwnership,
  checkCardAssignmentOwnership
};

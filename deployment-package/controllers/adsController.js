const { pool } = require('../config/database');

// @desc    Get all ads
// @route   GET /api/ads
// @access  Private
exports.getAllAds = async (req, res, next) => {
  try {
    const [ads] = await pool.query('SELECT * FROM ads ORDER BY created_at DESC');

    res.status(200).json({
      success: true,
      count: ads.length,
      ads
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ad
// @route   GET /api/ads/:id
// @access  Private
exports.getAd = async (req, res, next) => {
  try {
    const [ads] = await pool.query('SELECT * FROM ads WHERE id = ?', [req.params.id]);

    if (ads.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    res.status(200).json({
      success: true,
      ad: ads[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new ad
// @route   POST /api/ads
// @access  Private/Admin/Manager
exports.createAd = async (req, res, next) => {
  try {
    const { title, description, budget, status, start_date, end_date } = req.body;

    const [result] = await pool.query(
      'INSERT INTO ads (title, description, budget, status, start_date, end_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, budget, status || 'draft', start_date, end_date, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      adId: result.insertId
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update ad
// @route   PUT /api/ads/:id
// @access  Private/Admin/Manager
exports.updateAd = async (req, res, next) => {
  try {
    const { title, description, budget, status, start_date, end_date } = req.body;

    await pool.query(
      'UPDATE ads SET title = ?, description = ?, budget = ?, status = ?, start_date = ?, end_date = ? WHERE id = ?',
      [title, description, budget, status, start_date, end_date, req.params.id]
    );

    res.status(200).json({
      success: true,
      message: 'Ad updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete ad
// @route   DELETE /api/ads/:id
// @access  Private/Admin/Manager
exports.deleteAd = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM ads WHERE id = ?', [req.params.id]);

    res.status(200).json({
      success: true,
      message: 'Ad deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get ad statistics
// @route   GET /api/ads/:id/stats
// @access  Private
exports.getAdStats = async (req, res, next) => {
  try {
    // This is a placeholder - implement actual statistics logic
    const stats = {
      impressions: Math.floor(Math.random() * 10000),
      clicks: Math.floor(Math.random() * 1000),
      conversions: Math.floor(Math.random() * 100),
      spend: Math.random() * 1000
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    next(error);
  }
};

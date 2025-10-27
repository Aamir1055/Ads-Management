
const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Test endpoint to check all data without filtering
router.get('/test-data', async (req, res) => {
  try {
    const tables = ['users', 'campaigns', 'cards', 'brands', 'campaign_types'];
    const results = {};
    
    for (const table of tables) {
      const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM ${table}`);
      results[table] = {
        total: rows[0].total,
        table_exists: true
      };
      
      // Get sample record
      const [sample] = await pool.execute(`SELECT * FROM ${table} LIMIT 1`);
      if (sample.length > 0) {
        results[table].sample_fields = Object.keys(sample[0]);
        results[table].has_is_active = 'is_active' in sample[0];
      }
    }
    
    res.json({
      success: true,
      message: 'Data overview without filtering',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching data',
      error: error.message
    });
  }
});

module.exports = router;

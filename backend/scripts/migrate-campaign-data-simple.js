const { pool } = require('../config/database');

const runMigration = async () => {
  try {
    console.log('🔄 Starting campaign data tables migration...');
    
    // Create campaigns table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_name VARCHAR(255) NOT NULL,
        campaign_type_id INT NOT NULL,
        description TEXT,
        status ENUM('active', 'paused', 'completed') DEFAULT 'active',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(15,2) DEFAULT 0.00,
        target_audience TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_type_id) REFERENCES campaign_types(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_campaign_name (campaign_name),
        INDEX idx_campaign_type_id (campaign_type_id),
        INDEX idx_status (status),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Campaigns table created');

    // Create cards table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        card_name VARCHAR(255) NOT NULL,
        card_code VARCHAR(50) UNIQUE,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_card_name (card_name),
        INDEX idx_card_code (card_code),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Cards table created');

    // Create campaign_data table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS campaign_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id INT NOT NULL,
        facebook_result INT DEFAULT 0,
        xoho_result INT DEFAULT 0,
        spent DECIMAL(15,2) DEFAULT 0.00,
        data_date DATE DEFAULT (CURRENT_DATE - INTERVAL 1 DAY),
        card_id INT,
        card_name VARCHAR(255),
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE SET NULL ON UPDATE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        INDEX idx_campaign_id (campaign_id),
        INDEX idx_data_date (data_date),
        INDEX idx_card_id (card_id),
        UNIQUE KEY unique_campaign_date (campaign_id, data_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Campaign data table created');

    // Insert sample campaigns
    await pool.execute(`
      INSERT IGNORE INTO campaigns (campaign_name, campaign_type_id, description, status, budget, created_by) VALUES 
      ('Summer Sale Campaign', 1, 'Summer promotional campaign using search ads', 'active', 5000.00, 1),
      ('Brand Awareness Drive', 2, 'Display advertising for brand awareness', 'active', 8000.00, 1),
      ('Social Media Boost', 3, 'Social media engagement campaign', 'active', 3000.00, 1),
      ('Product Launch Video', 4, 'Video campaign for new product launch', 'paused', 12000.00, 1),
      ('Holiday Shopping', 5, 'Shopping campaign for holiday season', 'active', 15000.00, 1)
    `);
    console.log('✅ Sample campaigns inserted');

    // Insert sample cards
    await pool.execute(`
      INSERT IGNORE INTO cards (card_name, card_code, description, created_by) VALUES 
      ('Facebook Ads Card', 'FB_001', 'Facebook advertising platform card', 1),
      ('Google Ads Card', 'GA_001', 'Google advertising platform card', 1),
      ('Instagram Card', 'IG_001', 'Instagram advertising platform card', 1),
      ('YouTube Ads Card', 'YT_001', 'YouTube advertising platform card', 1),
      ('LinkedIn Ads Card', 'LI_001', 'LinkedIn advertising platform card', 1)
    `);
    console.log('✅ Sample cards inserted');

    // Insert sample campaign data
    await pool.execute(`
      INSERT IGNORE INTO campaign_data (campaign_id, facebook_result, xoho_result, spent, data_date, card_id, card_name, created_by) VALUES 
      (1, 150, 200, 250.75, '2025-09-07', 1, 'Facebook Ads Card', 1),
      (1, 120, 180, 200.50, '2025-09-06', 1, 'Facebook Ads Card', 1),
      (2, 300, 250, 450.25, '2025-09-07', 2, 'Google Ads Card', 1),
      (3, 80, 100, 150.00, '2025-09-07', 3, 'Instagram Card', 1),
      (4, 500, 400, 800.00, '2025-09-06', 4, 'YouTube Ads Card', 1)
    `);
    console.log('✅ Sample campaign data inserted');

    // Verify the data
    console.log('\n📋 Verifying created tables and data...');
    
    // Check campaigns
    const [campaigns] = await pool.execute(`
      SELECT c.id, c.campaign_name, ct.type_name 
      FROM campaigns c 
      LEFT JOIN campaign_types ct ON c.campaign_type_id = ct.id 
      ORDER BY c.id
    `);
    console.log(`✅ Campaigns table: ${campaigns.length} records`);
    campaigns.forEach(campaign => {
      console.log(`  - ${campaign.id}: ${campaign.campaign_name} (${campaign.type_name})`);
    });
    
    // Check cards
    const [cards] = await pool.execute('SELECT * FROM cards ORDER BY id');
    console.log(`\n✅ Cards table: ${cards.length} records`);
    cards.forEach(card => {
      console.log(`  - ${card.id}: ${card.card_name} (${card.card_code})`);
    });
    
    // Check campaign_data
    const [campaignData] = await pool.execute(`
      SELECT cd.id, c.campaign_name, cd.facebook_result, cd.xoho_result, cd.spent, cd.data_date, cd.card_name 
      FROM campaign_data cd 
      LEFT JOIN campaigns c ON cd.campaign_id = c.id 
      ORDER BY cd.id
    `);
    console.log(`\n✅ Campaign data table: ${campaignData.length} records`);
    campaignData.forEach(data => {
      console.log(`  - ${data.id}: ${data.campaign_name} - FB: ${data.facebook_result}, Xoho: ${data.xoho_result}, Spent: $${data.spent} (${data.data_date})`);
    });
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
};

// Run migration
runMigration();

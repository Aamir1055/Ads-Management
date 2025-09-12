// Campaign Type model (for MySQL)
const db = require('../config/database');

const CampaignType = {
  getAll: async () => {
    const [rows] = await db.query('SELECT * FROM campaign_types ORDER BY id DESC');
    return rows;
  },
  getById: async (id) => {
    const [rows] = await db.query('SELECT * FROM campaign_types WHERE id = ?', [id]);
    return rows[0];
  },
  create: async (data) => {
    const { name, description } = data;
    const [result] = await db.query('INSERT INTO campaign_types (name, description) VALUES (?, ?)', [name, description]);
    return { id: result.insertId, name, description };
  },
  update: async (id, data) => {
    const { name, description } = data;
    await db.query('UPDATE campaign_types SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    return { id, name, description };
  },
  delete: async (id) => {
    await db.query('DELETE FROM campaign_types WHERE id = ?', [id]);
    return { id };
  }
};

module.exports = CampaignType;

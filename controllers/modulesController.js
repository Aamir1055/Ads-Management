// controllers/modulesController.js
const { pool } = require('../config/database');

const createResponse = (success, message, data = null, meta = null) => {
  const out = { success, message, timestamp: new Date().toISOString() };
  if (data !== null) out.data = data;
  if (meta !== null) out.meta = meta;
  return out;
};

const getModuleByName = async (name) => {
  const [rows] = await pool.query('SELECT * FROM modules WHERE module_name = ?', [name]);
  return rows?.length ? rows[0] : null;
};

const modulesController = {
  // POST /api/modules
  create: async (req, res) => {
    try {
      const { module_name, module_path = null, description = '', is_active = true } = req.body || {};
      const name = (module_name || '').trim();
      if (!name) return res.status(400).json(createResponse(false, 'module_name is required'));

      const dup = await getModuleByName(name);
      if (dup) return res.status(409).json(createResponse(false, 'Module already exists'));

      const [result] = await pool.query(
        'INSERT INTO modules (module_name, module_path, description, is_active, created_at) VALUES (?,?,?,?,NOW())',
        [name, module_path, description, is_active ? 1 : 0]
      );
      const [rows] = await pool.query('SELECT * FROM modules WHERE id = ?', [result.insertId]);
  return res.status(201).json(createResponse(true, 'Module created', rows?.length ? rows[0] : null));
    } catch (e) {
      console.error('[Modules] create error:', e);
      return res.status(500).json(createResponse(false, 'Failed to create module', null, process.env.NODE_ENV === 'development' ? { error: e.message } : null));
    }
  },

  // GET /api/modules
  list: async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
      const offset = (page - 1) * limit;
      const searchTerm = (req.query.search || '').trim();
      const search = searchTerm ? `%${searchTerm}%` : null;
      const onlyActive = typeof req.query.active !== 'undefined' ? String(req.query.active).toLowerCase() === 'true' : null;

      let countSql = 'SELECT COUNT(*) AS total FROM modules';
      let dataSql = 'SELECT * FROM modules';
      const where = [];
      const params = [];

      if (search) {
        where.push('(module_name LIKE ? OR description LIKE ?)');
        params.push(search, search);
      }
      if (onlyActive !== null) {
        where.push('is_active = ?');
        params.push(onlyActive ? 1 : 0);
      }
      if (where.length) {
        const wc = ' WHERE ' + where.join(' AND ');
        countSql += wc;
        dataSql += wc;
      }
      dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

      const [countRows] = await pool.query(countSql, params);
  const totalCount = Number((Array.isArray(countRows) && countRows.length > 0 && countRows[0].total !== undefined) ? countRows[0].total : 0);

      const [rows] = await pool.query(dataSql, [...params, Number(limit), Number(offset)]);

      const totalPages = Math.max(1, Math.ceil(totalCount / limit));
      const meta = {
        pagination: {
          currentPage: page, totalPages, totalCount, limit,
          hasNext: page < totalPages, hasPrev: page > 1
        },
        filters: { ...(searchTerm && { search: searchTerm }), ...(onlyActive !== null && { active: !!onlyActive }) }
      };

      return res.status(200).json(createResponse(true, `Retrieved ${rows?.length || 0} module(s)`, rows || [], meta));
    } catch (e) {
      console.error('[Modules] list error:', e);
      return res.status(500).json(createResponse(false, 'Failed to list modules', null, process.env.NODE_ENV === 'development' ? { error: e.message } : null));
    }
  },

  // GET /api/modules/:id
  getById: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid module id'));
      const [rows] = await pool.query('SELECT * FROM modules WHERE id = ?', [id]);
      if (!rows || rows.length === 0) return res.status(404).json(createResponse(false, 'Module not found'));
      return res.status(200).json(createResponse(true, 'Module retrieved', rows));
    } catch (e) {
      console.error('[Modules] getById error:', e);
      return res.status(500).json(createResponse(false, 'Failed to fetch module', null, process.env.NODE_ENV === 'development' ? { error: e.message } : null));
    }
  },

  // PUT /api/modules/:id
  update: async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (!id || id <= 0) return res.status(400).json(createResponse(false, 'Invalid module id'));

      const [existRows] = await pool.query('SELECT * FROM modules WHERE id = ?', [id]);
      if (!existRows || existRows.length === 0) return res.status(404).json(createResponse(false, 'Module not found'));

      const update = {};
      if (typeof req.body?.module_name === 'string') update.module_name = req.body.module_name.trim();
      if (typeof req.body?.module_path === 'string' || req.body?.module_path === null) update.module_path = req.body.module_path;
      if (typeof req.body?.description === 'string') update.description = req.body.description;
      if (typeof req.body?.is_active !== 'undefined') update.is_active = req.body.is_active ? 1 : 0;

      if (update.module_name && update.module_name !== existRows.module_name) {
        const dup = await getModuleByName(update.module_name);
        if (dup) return res.status(409).json(createResponse(false, 'Module name already exists'));
      }

      if (Object.keys(update).length === 0) {
        return res.status(400).json(createResponse(false, 'No fields to update'));
      }

      update.updated_at = new Date();

      const clause = Object.keys(update).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(update), id];
      await pool.query(`UPDATE modules SET ${clause} WHERE id = ?`, values);

      const [rows] = await pool.query('SELECT * FROM modules WHERE id = ?', [id]);
  return res.status(200).json(createResponse(true, 'Module updated', rows?.length ? rows[0] : null));
    } catch (e) {
      console.error('[Modules] update error:', e);
      return res.status(500).json(createResponse(false, 'Failed to update module', null, process.env.NODE_ENV === 'development' ? { error: e.message } : null));
    }
  }
};

module.exports = modulesController;

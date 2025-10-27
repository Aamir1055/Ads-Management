// controllers/campaign.controller.js
const campaignController = (pool) => {
  const table = 'Campaign';

  // Safer JSON parsing across mysql2 modes (string, buffer, object)
  const parseJsonField = (value) => {
    if (value === null || value === undefined) return null;
    if (Buffer.isBuffer(value)) value = value.toString('utf8');
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return null; }
    }
    if (typeof value === 'object') return value;
    return null;
  };

  const serializeJson = (value) => {
    if (value === null || value === undefined) return null;
    // Enforce lower-case JSON literals per MySQL JSON rules
    // JSON.stringify already emits valid JSON (null/true/false lowercased)
    return JSON.stringify(value);
  };

  // Internal helper: decide SQL fragment for JSON columns to preserve NULLs
  const jsonSetFragment = (col, val, params) => {
    if (val === undefined) return null; // not updating
    if (val === null) {
      params.push(null);
      return `${col} = ?`;
    }
    params.push(serializeJson(val));
    return `${col} = CAST(? AS JSON)`;
  };

  // Validate numeric id
  const parseId = (idParam) => {
    const id = Number(idParam);
    if (!Number.isFinite(id) || id <= 0) return null;
    return id;
  };

  // POST /campaigns
  const create = async (req, res) => {
    try {
      const {
        Name,
        Persona = null,
        Gender = null,
        Age = null,
        Locations = null,
        Creatives = null,
        CampaignTypeId,
        Brand = null,
        is_active = true,
        StartDate = null,
      } = req.body;

      if (!Name || !CampaignTypeId) {
        return res.status(400).json({ message: 'Name and CampaignTypeId are required' });
      }
      if (Gender && Gender !== 'Male' && Gender !== 'Female') {
        return res.status(400).json({ message: 'Gender must be Male or Female when provided' });
      }
      if (Age !== null && (typeof Age !== 'number' || Age < 0)) {
        return res.status(400).json({ message: 'Age must be an unsigned integer' });
      }

      // Important: avoid CAST(NULL AS JSON) -> pass NULL directly
      const jsonLoc = Locations === null || Locations === undefined ? null : serializeJson(Locations);
      const jsonCr = Creatives === null || Creatives === undefined ? null : serializeJson(Creatives);

      const [result] = await pool.execute(
        `
        INSERT INTO ${table}
          (Name, Persona, Gender, Age, Locations, Creatives, CampaignTypeId, Brand, is_active, StartDate)
        VALUES
          (?, ?, ?, ?, ${jsonLoc === null ? 'NULL' : 'CAST(? AS JSON)'},
              ${jsonCr === null ? 'NULL' : 'CAST(? AS JSON)'}, ?, ?, ?, ?)
        `,
        [
          Name,
          Persona,
          Gender,
          Age,
          ...(jsonLoc === null ? [] : [jsonLoc]),
          ...(jsonCr === null ? [] : [jsonCr]),
          CampaignTypeId,
          Brand,
          !!is_active,
          StartDate,
        ]
      );

      const insertId = result && (result.insertId || result.lastID || null);
      if (!insertId) {
        return res.status(500).json({ message: 'Insert did not return an id' });
      }

      const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [insertId]);
      const row = Array.isArray(rows) && rows.length > 0 ? rows : null;
      if (!row) return res.status(201).json({ id: insertId });

      row.Locations = parseJsonField(row.Locations);
      row.Creatives = parseJsonField(row.Creatives);
      return res.status(201).json(row);
    } catch (err) {
      if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
        return res.status(409).json({ message: 'Invalid CampaignTypeId (foreign key constraint failed)' });
      }
      return res.status(500).json({ message: 'Failed to create campaign', error: err && err.message });
    }
  };

  // PUT /campaigns/:id
  const update = async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: 'Invalid id' });

      const {
        Name,
        Persona,
        Gender,
        Age,
        Locations,
        Creatives,
        CampaignTypeId,
        Brand,
        is_active,
        StartDate,
      } = req.body;

      const fields = [];
      const params = [];

      const push = (sql, val) => { fields.push(sql); params.push(val); };

      if (Name !== undefined) push('Name = ?', Name);
      if (Persona !== undefined) push('Persona = ?', Persona);
      if (Gender !== undefined) {
        if (Gender !== null && Gender !== 'Male' && Gender !== 'Female') {
          return res.status(400).json({ message: 'Gender must be Male or Female when provided' });
        }
        push('Gender = ?', Gender);
      }
      if (Age !== undefined) {
        if (Age !== null && (typeof Age !== 'number' || Age < 0)) {
          return res.status(400).json({ message: 'Age must be an unsigned integer' });
        }
        push('Age = ?', Age);
      }

      // JSON setters preserving NULL vs value
      const locSet = jsonSetFragment('Locations', Locations, params);
      const crSet = jsonSetFragment('Creatives', Creatives, params);
      if (locSet) fields.push(locSet);
      if (crSet) fields.push(crSet);

      if (CampaignTypeId !== undefined) push('CampaignTypeId = ?', CampaignTypeId);
      if (Brand !== undefined) push('Brand = ?', Brand);
      if (is_active !== undefined) push('is_active = ?', !!is_active);
      if (StartDate !== undefined) push('StartDate = ?', StartDate);

      if (fields.length === 0) {
        return res.status(400).json({ message: 'No fields provided to update' });
      }

      params.push(id);
      const [result] = await pool.execute(`UPDATE ${table} SET ${fields.join(', ')} WHERE id = ?`, params);

      const affected = result && (result.affectedRows ?? result.changes ?? 0);
      if (!affected) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [id]);
      const row = Array.isArray(rows) && rows.length > 0 ? rows : null;
      if (!row) return res.status(200).json({ id, message: 'Updated' });

      row.Locations = parseJsonField(row.Locations);
      row.Creatives = parseJsonField(row.Creatives);
      return res.status(200).json(row);
    } catch (err) {
      if (err && (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452)) {
        return res.status(409).json({ message: 'Invalid CampaignTypeId (foreign key constraint failed)' });
      }
      return res.status(500).json({ message: 'Failed to update campaign', error: err && err.message });
    }
  };

  // GET /campaigns/:id
  const getById = async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: 'Invalid id' });

      const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE id = ?`, [id]);
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      const row = rows;
      row.Locations = parseJsonField(row.Locations);
      row.Creatives = parseJsonField(row.Creatives);
      return res.status(200).json(row);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch campaign', error: err && err.message });
    }
  };

  // GET /campaigns
  const getAll = async (_req, res) => {
    try {
      const [rows] = await pool.execute(`SELECT * FROM ${table} ORDER BY id DESC`);
      const data = Array.isArray(rows)
        ? rows.map((r) => ({
            ...r,
            Locations: parseJsonField(r.Locations),
            Creatives: parseJsonField(r.Creatives),
          }))
        : [];
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to fetch campaigns', error: err && err.message });
    }
  };

  // DELETE /campaigns/:id
  const remove = async (req, res) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(400).json({ message: 'Invalid id' });

      const [result] = await pool.execute(`DELETE FROM ${table} WHERE id = ?`, [id]);

      const affected = result && (result.affectedRows ?? result.changes ?? 0);
      if (!affected) {
        return res.status(404).json({ message: 'Campaign not found' });
      }
      return res.status(204).send();
    } catch (err) {
      if (err && (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451)) {
        return res.status(409).json({ message: 'Cannot delete: campaign is referenced by other records' });
      }
      return res.status(500).json({ message: 'Failed to delete campaign', error: err && err.message });
    }
  };

  return { create, update, getById, getAll, remove };
};

module.exports = { campaignController };

// add_accounts_permissions.js - create Accounts module and permissions if missing
require('dotenv').config();
const { pool } = require('./config/database');

(async () => {
  try {
    console.log('🔧 Ensuring Accounts module and permissions exist...');

    // 1) Ensure permissions table uses legacy naming (category/name)
    const [modules] = await pool.query('SELECT id, module_name, name FROM modules');
    let moduleId;

    // Try to find by module_name or name columns
    const existing = modules.find(m => (m.module_name || m.name) === 'accounts');
    if (existing) {
      moduleId = existing.id;
      console.log(`✅ Module "accounts" exists (ID: ${moduleId})`);
    } else {
      const [res] = await pool.query(
        'INSERT INTO modules (module_name, description, is_active, created_at) VALUES (?, ?, 1, NOW())',
        ['accounts', 'Account management']
      );
      moduleId = res.insertId;
      console.log(`✅ Created module "accounts" (ID: ${moduleId})`);
    }

    // 2) Ensure permissions rows exist
    const needed = [
      { name: 'accounts_create', display_name: 'Create Accounts' },
      { name: 'accounts_read', display_name: 'Read Accounts' },
      { name: 'accounts_update', display_name: 'Update Accounts' },
      { name: 'accounts_delete', display_name: 'Delete Accounts' }
    ];

    const [existingPerms] = await pool.query(
      'SELECT id, name FROM permissions WHERE category = ? OR module_id = ?',
      ['accounts', moduleId]
    );

    let added = 0;
    for (const p of needed) {
      if (!existingPerms.find(ep => ep.name === p.name)) {
        await pool.query(
          'INSERT INTO permissions (module_id, name, display_name, category, is_active, created_at) VALUES (?, ?, ?, ?, 1, NOW())',
          [moduleId, p.name, p.display_name, 'accounts']
        );
        added++;
        console.log(`   ➕ Added permission ${p.name}`);
      }
    }

    console.log(`✨ Done. Added ${added} permission(s).`);
  } catch (e) {
    console.error('❌ Failed to add accounts permissions:', e);
  } finally {
    try { await pool.end(); } catch {}
    process.exit(0);
  }
})();

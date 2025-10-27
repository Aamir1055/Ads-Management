const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { pool } = require('../config/database');

/**
 * User Model - Complete rewrite based on exact table structure
 * Table fields: id, username, hashed_password, role_id, auth_token, twofa_enabled, 
 * twofa_secret, twofa_verified_at, is_active, last_login, created_at, updated_at,
 * is_2fa_enabled, two_factor_secret, two_factor_backup_codes
 */
class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.hashed_password = userData.hashed_password;
    this.role_id = userData.role_id;
    this.role_name = userData.role_name;
    this.role_description = userData.role_description;
    this.auth_token = userData.auth_token;
    this.twofa_enabled = userData.twofa_enabled;
    this.twofa_secret = userData.twofa_secret;
    this.twofa_verified_at = userData.twofa_verified_at;
    this.is_active = userData.is_active;
    this.last_login = userData.last_login;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
    this.is_2fa_enabled = userData.is_2fa_enabled;
    this.two_factor_secret = userData.two_factor_secret;
    this.two_factor_backup_codes = userData.two_factor_backup_codes;
  }

  /**
   * Create a new user
   */
  static async create({ username, password, role_id, enable_2fa = false }) {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Validate username doesn't exist
      const [existingUsers] = await connection.query(
        'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
        [username]
      );
      
      if (existingUsers.length > 0) {
        throw new Error('Username already exists');
      }
      
      // Validate role exists
      const [roles] = await connection.query(
        'SELECT id, name FROM roles WHERE id = ? AND is_active = 1',
        [role_id]
      );
      
      if (roles.length === 0) {
        throw new Error('Invalid role specified');
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Setup 2FA if enabled
      let twofa_secret = null;
      let qrCodeUrl = null;
      
      if (enable_2fa) {
        const secret = speakeasy.generateSecret({
          name: `AdsReporting - ${username}`,
          issuer: 'Ads Reporting System',
          length: 20
        });
        
        twofa_secret = secret.base32;
        qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
      }
      
      // Insert user
      const [result] = await connection.query(`
        INSERT INTO users (
          username, hashed_password, role_id, twofa_enabled, twofa_secret,
          is_2fa_enabled, two_factor_secret, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
      `, [
        username.trim(),
        hashedPassword,
        role_id,
        enable_2fa ? 1 : 0,
        twofa_secret,
        enable_2fa ? 1 : 0,
        twofa_secret // Store in both fields for compatibility
      ]);
      
      await connection.commit();
      
      // Get created user
      const user = await User.findById(result.insertId);
      
      return {
        user,
        qrCode: qrCodeUrl,
        secret: twofa_secret
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Find user by ID with role information
   */
  static async findById(id) {
    const [users] = await pool.query(`
      SELECT 
        u.id, u.username, u.hashed_password, u.role_id, u.auth_token,
        u.twofa_enabled, u.twofa_secret, u.twofa_verified_at,
        u.is_active, u.last_login, u.created_at, u.updated_at,
        u.is_2fa_enabled, u.two_factor_secret, u.two_factor_backup_codes,
        r.name as role_name, r.description as role_description
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.is_active = 1
    `, [id]);

    return users.length > 0 ? new User(users[0]) : null;
  }

  /**
   * Find user by username (for login)
   */
  static async findByUsername(username) {
    const [users] = await pool.query(`
      SELECT 
        u.id, u.username, u.hashed_password, u.role_id, u.auth_token,
        u.twofa_enabled, u.twofa_secret, u.twofa_verified_at,
        u.is_active, u.last_login, u.created_at, u.updated_at,
        u.is_2fa_enabled, u.two_factor_secret, u.two_factor_backup_codes,
        r.name as role_name, r.description as role_description
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE LOWER(u.username) = LOWER(?) AND u.is_active = 1
    `, [username]);

    return users.length > 0 ? new User(users[0]) : null;
  }

  /**
   * Get all users with pagination and filtering
   */
  static async findAll({ page = 1, limit = 10, search = '', role_id = null, is_active = true } = {}) {
    const offset = (page - 1) * limit;
    
    let whereConditions = [];
    const params = [];
    
    if (is_active !== null) {
      whereConditions.push('u.is_active = ?');
      params.push(is_active);
    }
    
    if (search) {
      whereConditions.push('u.username LIKE ?');
      params.push(`%${search}%`);
    }
    
    if (role_id) {
      whereConditions.push('u.role_id = ?');
      params.push(role_id);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Get total count
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      ${whereClause}
    `, params);
    
    // Get paginated results
    const [users] = await pool.query(`
      SELECT 
        u.id, u.username, u.role_id, u.twofa_enabled, u.is_2fa_enabled,
        u.is_active, u.last_login, u.created_at, u.updated_at,
        r.name as role_name, r.description as role_description
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);
    
    return {
      users: users.map(user => new User(user)),
      pagination: {
        page,
        limit,
        total: countResult[0].total,
        pages: Math.ceil(countResult[0].total / limit)
      }
    };
  }

  /**
   * Update user
   */
  static async updateById(id, updateData) {
    const connection = await pool.getConnection();
    
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      await connection.beginTransaction();
      
      const allowedFields = ['username', 'role_id', 'is_active', 'password'];
      const fieldsToUpdate = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === 'password') {
            fieldsToUpdate['hashed_password'] = await bcrypt.hash(updateData[field], 12);
          } else if (field === 'username') {
            // Check for username conflicts
            const [existing] = await connection.query(
              'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?',
              [updateData.username, id]
            );
            if (existing.length > 0) {
              throw new Error('Username already exists');
            }
            fieldsToUpdate[field] = updateData[field];
          } else {
            fieldsToUpdate[field] = updateData[field];
          }
        }
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error('No valid fields to update');
      }

      fieldsToUpdate.updated_at = new Date();

      const setClause = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
      const values = [...Object.values(fieldsToUpdate), id];

      await connection.query(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        values
      );

      await connection.commit();
      return await User.findById(id);

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteById(id) {
    const connection = await pool.getConnection();
    
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      await connection.beginTransaction();

      await connection.query(
        'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?',
        [id]
      );

      await connection.commit();
      return { success: true, message: `User '${user.username}' deleted successfully` };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Enable 2FA for user
   */
  static async enable2FA(id) {
    const connection = await pool.getConnection();
    
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.twofa_enabled || user.is_2fa_enabled) {
        throw new Error('2FA is already enabled for this user');
      }

      await connection.beginTransaction();

      // Generate new 2FA secret
      const secret = speakeasy.generateSecret({
        name: `AdsReporting - ${user.username}`,
        issuer: 'Ads Reporting System',
        length: 20
      });

      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      // Update user with 2FA enabled
      await connection.query(`
        UPDATE users SET 
          twofa_enabled = 1, 
          twofa_secret = ?, 
          is_2fa_enabled = 1, 
          two_factor_secret = ?, 
          updated_at = NOW() 
        WHERE id = ?
      `, [secret.base32, secret.base32, id]);

      await connection.commit();

      return {
        qrCode: qrCodeUrl,
        secret: secret.base32,
        message: '2FA enabled successfully'
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Disable 2FA for user
   */
  static async disable2FA(id) {
    const connection = await pool.getConnection();
    
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.twofa_enabled && !user.is_2fa_enabled) {
        throw new Error('2FA is not enabled for this user');
      }

      await connection.beginTransaction();

      await connection.query(`
        UPDATE users SET 
          twofa_enabled = 0, 
          twofa_secret = NULL, 
          is_2fa_enabled = 0, 
          two_factor_secret = NULL,
          twofa_verified_at = NULL,
          updated_at = NOW() 
        WHERE id = ?
      `, [id]);

      await connection.commit();
      return { message: '2FA disabled successfully' };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Verify 2FA token
   */
  static async verify2FA(id, token) {
    const [users] = await pool.query(`
      SELECT id, username, twofa_secret, two_factor_secret, twofa_enabled, is_2fa_enabled 
      FROM users 
      WHERE id = ? AND is_active = 1
    `, [id]);

    if (users.length === 0) {
      return false;
    }

    const user = users[0];
    
    // Check if 2FA is enabled
    if (!user.twofa_enabled && !user.is_2fa_enabled) {
      return false;
    }

    // Get the secret (try both fields for compatibility)
    const secret = user.twofa_secret || user.two_factor_secret;
    if (!secret) {
      return false;
    }

    // Verify the token
    const isValid = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps tolerance
    });

    // Update verification timestamp if valid
    if (isValid) {
      await pool.query(
        'UPDATE users SET twofa_verified_at = NOW() WHERE id = ?',
        [id]
      );
    }

    return isValid;
  }

  /**
   * Update last login
   */
  static async updateLastLogin(id) {
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [id]
    );
  }

  /**
   * Get all roles
   */
  static async getRoles() {
    const [roles] = await pool.query(`
      SELECT id, name, description, level, is_system_role, created_at 
      FROM roles 
      WHERE is_active = 1 
      ORDER BY level DESC, name
    `);
    return roles;
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username) {
    const [users] = await pool.query(
      'SELECT id FROM users WHERE LOWER(username) = LOWER(?)',
      [username]
    );
    return users.length === 0;
  }

  /**
   * Verify password
   */
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.hashed_password);
  }

  /**
   * Convert to JSON (exclude sensitive data)
   */
  toJSON() {
    const { 
      hashed_password, 
      twofa_secret, 
      two_factor_secret, 
      two_factor_backup_codes, 
      ...publicData 
    } = this;
    return publicData;
  }
}

module.exports = User;

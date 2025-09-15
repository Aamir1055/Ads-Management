const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const crypto = require('crypto');

/**
 * Enhanced User Model - Comprehensive user management with security features
 * Features: CRUD operations, 2FA, password reset, audit logging, account locking
 */
class User {
  constructor(data) {
  this.id = data.id;
  this.username = data.username;
  this.hashed_password = data.hashed_password;
  this.role_id = data.role_id;
  this.auth_token = data.auth_token;
  this.is_2fa_enabled = data.is_2fa_enabled;
  this.twofa_enabled = data.twofa_enabled;
  this.twofa_secret = data.twofa_secret;
  this.twofa_verified_at = data.twofa_verified_at;
  this.is_active = data.is_active;
  this.last_login = data.last_login;
  this.created_at = data.created_at;
  this.updated_at = data.updated_at;
  this.two_factor_secret = data.two_factor_secret;
  this.two_factor_backup_codes = data.two_factor_backup_codes;
  }

  /**
   * Create a new user with enhanced validation and optional fields
   */
  static async create(userData, performedBy = null) {
    const connection = await pool.getConnection();
    
    try {
      const { 
        username, 
        password, 
        confirm_password, 
        role_id, 
        enable_2fa = false,
        temp_2fa_key = null // For using pre-generated temporary 2FA setup
      } = userData;

      // Validate passwords match
      if (password !== confirm_password) {
        throw new Error('Passwords do not match');
      }

      // Check if username already exists (exclude current user for updates)
      let usernameCheckQuery = 'SELECT id FROM users WHERE LOWER(username) = LOWER(?)';
      let usernameCheckParams = [username];
      
      const [existingUsers] = await connection.query(
        usernameCheckQuery,
        usernameCheckParams
      );
      if (existingUsers.length > 0) {
        throw new Error('Username already exists');
      }

      // Validate role exists
      const [roles] = await connection.query(
        'SELECT id, name FROM roles WHERE id = ?',
        [role_id]
      );
      if (roles.length === 0) {
        throw new Error('Invalid role specified');
      }

      await connection.beginTransaction();

      // Hash password
      const saltRounds = 12;
      const hashed_password = await bcrypt.hash(password, saltRounds);

      // 2FA will be enabled but secret will be generated during first login
      let auth_token = null;
      
      // Do not generate 2FA secret during user creation
      // It will be generated during the user's first login attempt

      // Insert user
      const [result] = await connection.query(
        `INSERT INTO users (
          username, hashed_password, 
          role_id, auth_token, is_2fa_enabled, 
          is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          username.trim(),
          hashed_password, 
          role_id, 
          auth_token, 
          enable_2fa, 
          true
        ]
      );

      const userId = result.insertId;

      // Log the creation in audit trail
      await User._logAudit(connection, userId, 'USER_CREATED', null, {
        username: username.trim(),
        role_id: role_id,
        enable_2fa: enable_2fa
      }, null, null, performedBy);

      await connection.commit();

      // Get the created user with role information
      const user = await User.findById(userId);
      
      return {
        user
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  /**
   * Find user by ID with enhanced role information
   */
  static async findById(id) {
    const [users] = await pool.query(
      `SELECT 
        u.id, u.username,
        u.role_id, u.auth_token, u.is_2fa_enabled,
        u.is_active, u.last_login, u.created_at, u.updated_at,
        r.name as role_name, r.description as role_description
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = ? AND u.is_active = 1`,
      [id]
    );

    return users.length > 0 ? new User(users[0]) : null;
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const [users] = await pool.query(
      `SELECT 
        u.id,
        u.username,
        u.hashed_password,
        u.role_id,
        u.auth_token,
        u.is_2fa_enabled,
        u.is_active,
        u.last_login,
        u.created_at,
        u.updated_at,
        r.name as role_name,
        r.description as role_description
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE LOWER(u.username) = LOWER(?) AND u.is_active = 1`,
      [username]
    );

    return users.length > 0 ? users[0] : null;
  }

  /**
   * Get all users with pagination and filtering
   */
  static async findAll({ page = 1, limit = 10, search = '', role_id = null, is_active = true } = {}) {
    const offset = (page - 1) * limit;
    
    // Build where conditions
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
    
    // Build WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    try {
      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        ${whereClause}
      `;
      const [countResult] = await pool.query(countQuery, params);
      const total = countResult[0].total;
      
      // Get paginated results
      const dataQuery = `
        SELECT 
          u.id, u.username,
          u.role_id, u.is_2fa_enabled,
          u.is_active, u.last_login, u.created_at, u.updated_at,
          r.name as role_name, r.description as role_description
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT ? OFFSET ?
      `;
      
      const [users] = await pool.query(dataQuery, [...params, limit, offset]);
      
      return {
        users: users.map(user => new User(user)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user information
   */
  static async updateById(id, updateData) {
    const connection = await pool.getConnection();
    
    try {
      // Check if user exists
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      // Check for username conflicts if username is being updated
      if (updateData.username && updateData.username !== user.username) {
        const [existingUsers] = await connection.query(
          'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?',
          [updateData.username, id]
        );
        if (existingUsers.length > 0) {
          throw new Error('Username already exists');
        }
      }

      // Check if role exists if role is being updated
      if (updateData.role_id) {
        const [roles] = await connection.query(
          'SELECT id FROM roles WHERE id = ?',
          [updateData.role_id]
        );
        if (roles.length === 0) {
          throw new Error('Invalid role specified');
        }
      }

      await connection.beginTransaction();
      
      // Build update fields (only allow specific fields to be updated)
      const allowedFields = ['username', 'role_id', 'is_active', 'password'];
      const fieldsToUpdate = {};
      
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === 'password') {
            // Hash the new password if provided
            const saltRounds = 12;
            fieldsToUpdate['hashed_password'] = await bcrypt.hash(updateData[field], saltRounds);
          } else {
            fieldsToUpdate[field] = updateData[field];
          }
        }
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        throw new Error('No valid fields to update');
      }

      // Add updated_at timestamp
      fieldsToUpdate.updated_at = new Date();

      // Build update query
      const setClause = Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ');
      const values = [...Object.values(fieldsToUpdate), id];

      await connection.query(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        values
      );

      await connection.commit();

      // Return updated user
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

      // Check if user is admin (protection against accidental admin deletion)
      const [adminRoles] = await connection.query(
        'SELECT id FROM roles WHERE name IN (?, ?)',
        ['admin', 'super_admin']
      );
      
      const adminRoleIds = adminRoles.map(role => role.id);
      if (adminRoleIds.includes(user.role_id)) {
        throw new Error('Cannot delete admin users');
      }

      await connection.beginTransaction();

      // Soft delete
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
   * Toggle user active status
   */
  static async toggleStatus(id) {
    const connection = await pool.getConnection();
    
    try {
      const [users] = await connection.query(
        'SELECT id, username, is_active, role_id FROM users WHERE id = ?',
        [id]
      );

      if (users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];
      const newStatus = !user.is_active;

      await connection.beginTransaction();

      await connection.query(
        'UPDATE users SET is_active = ?, updated_at = NOW() WHERE id = ?',
        [newStatus, id]
      );

      await connection.commit();

      return {
        id,
        username: user.username,
        is_active: newStatus,
        message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update last login timestamp
   */
  static async updateLastLogin(id) {
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [id]
    );
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

      if (user.is_2fa_enabled) {
        throw new Error('2FA is already enabled for this user');
      }

      // Generate new 2FA secret
      const secret = speakeasy.generateSecret({
        name: `AdsReporting - ${user.username}`,
        issuer: 'Ads Reporting System',
        length: 20
      });

      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      await connection.beginTransaction();

      // Update user with 2FA secret
      await connection.query(
        'UPDATE users SET auth_token = ?, is_2fa_enabled = 1, updated_at = NOW() WHERE id = ?',
        [secret.base32, id]
      );

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

      if (!user.is_2fa_enabled) {
        throw new Error('2FA is not enabled for this user');
      }

      await connection.beginTransaction();

      await connection.query(
        'UPDATE users SET auth_token = NULL, is_2fa_enabled = 0, updated_at = NOW() WHERE id = ?',
        [id]
      );

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
   * Generate 2FA secret for first-time setup during login
   */
  static async generate2FASetup(id) {
    const connection = await pool.getConnection();
    
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      if (!user.is_2fa_enabled) {
        throw new Error('2FA is not enabled for this user');
      }

      if (user.auth_token) {
        throw new Error('2FA is already set up for this user');
      }

      // Generate new 2FA secret
      const secret = speakeasy.generateSecret({
        name: `AdsReporting - ${user.username}`,
        issuer: 'Ads Reporting System',
        length: 20
      });

      const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

      await connection.beginTransaction();

      // Store the secret in the database
      await connection.query(
        'UPDATE users SET auth_token = ?, updated_at = NOW() WHERE id = ?',
        [secret.base32, id]
      );

      await connection.commit();

      return {
        qrCode: qrCodeUrl,
        secret: secret.base32,
        message: '2FA setup generated successfully'
      };

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if user needs 2FA setup (has 2FA enabled but no secret)
   */
  static async needs2FASetup(id) {
    const user = await User.findByIdWithSecret(id);
    return user && user.is_2fa_enabled && !user.auth_token;
  }

  /**
   * Verify 2FA token
   */
  static async verify2FA(id, token) {
    console.log('🔍 User.verify2FA called with:', { id, token: token ? `${token.substring(0, 2)}****` : 'undefined' });
    
    const user = await User.findByIdWithSecret(id);
    console.log('👤 findByIdWithSecret result:', user ? {
      id: user.id,
      username: user.username,
      is_2fa_enabled: user.is_2fa_enabled,
      has_auth_token: !!user.auth_token
    } : 'null');
    
    if (!user || !user.is_2fa_enabled || !user.auth_token) {
      console.log('❌ 2FA verification failed - user/token issue:', {
        user_exists: !!user,
        is_2fa_enabled: user?.is_2fa_enabled,
        has_auth_token: !!user?.auth_token
      });
      return false; // Changed from throwing error to returning false
    }

    console.log('🔍 Attempting TOTP verification...');
    const isValid = speakeasy.totp.verify({
      secret: user.auth_token,
      encoding: 'base32',
      token: token,
      window: 2 // Allow 2 time steps tolerance
    });
    
    console.log('🔍 TOTP verification result:', isValid);
    return isValid;
  }

  /**
   * Find user by ID including secret (for internal use only)
   */
  static async findByIdWithSecret(id) {
    const [users] = await pool.query(
      'SELECT id, username, auth_token, is_2fa_enabled FROM users WHERE id = ? AND is_active = 1',
      [id]
    );

    return users.length > 0 ? users[0] : null;
  }

  /**
   * Verify password
   */
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.hashed_password);
  }

  /**
   * Get all available roles (updated to use role_name)
   */
  static async getRoles() {
    const [roles] = await pool.query(
      'SELECT id, name as role_name, description, created_at FROM roles ORDER BY name'
    );
    return roles;
  }


  // Note: Account locking functionality removed since login_attempts and locked_until columns don't exist

  /**
   * Get user statistics for admin dashboard
   */
  static async getStats() {
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_users,
        SUM(CASE WHEN is_2fa_enabled = 1 THEN 1 ELSE 0 END) as users_with_2fa,
        SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent_logins
      FROM users
    `);

    const [roleStats] = await pool.query(`
      SELECT 
        r.name as role_name,
        r.description,
        COUNT(u.id) as user_count
      FROM roles r
      LEFT JOIN users u ON r.id = u.role_id AND u.is_active = 1
      GROUP BY r.id, r.name, r.description
      ORDER BY user_count DESC
    `);

    return {
      overview: stats[0],
      roleDistribution: roleStats
    };
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
   * Convert to JSON (exclude sensitive data)
   */
  toJSON() {
    const { 
      hashed_password, 
      auth_token, 
      twofa_secret, 
      two_factor_secret, 
      two_factor_backup_codes, 
      ...publicData 
    } = this;
    return publicData;
  }

  /**
   * Internal audit logging method (placeholder)
   */
  static async _logAudit(connection, userId, action, oldData, newData, ipAddress, userAgent, performedBy) {
    // This is a placeholder for audit logging functionality
    // You can implement this to log user actions to an audit table
    console.log(`Audit log: ${action} for user ${userId} by ${performedBy || 'system'}`);
    return true;
  }
}

module.exports = User;

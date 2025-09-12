const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

/**
 * Two-Factor Authentication Utility
 * Handles TOTP (Time-based One-time Password) generation and verification
 */
class TwoFactorAuth {
  
  /**
   * Generate a new secret for 2FA setup
   * @param {string} username - User's username
   * @param {string} appName - Application name (default: "Ads Reporting Software")
   * @returns {Object} - Contains secret, otpauth_url, and manual_entry_key
   */
  static generateSecret(username, appName = "Ads Reporting Software") {
    try {
      const secret = speakeasy.generateSecret({
        name: username,
        issuer: appName,
        length: 32 // 32 characters = 160 bits of entropy
      });

      return {
        secret: secret.base32,
        otpauth_url: secret.otpauth_url,
        manual_entry_key: secret.base32,
        qr_code_setup_required: true
      };
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Generate QR code data URL for the secret
   * @param {string} otpauth_url - OTP Auth URL from generateSecret
   * @returns {Promise<{ success: boolean, qrCode?: string, message?: string }>} - Data URL for QR code image or error
   */
  static async generateQRCode(otpauth_url) {
    try {
      if (typeof otpauth_url !== 'string' || !otpauth_url.startsWith('otpauth://')) {
        return { success: false, message: 'Invalid OTP Auth URL' };
      }
      const qrCodeDataURL = await qrcode.toDataURL(otpauth_url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return { success: true, qrCode: qrCodeDataURL };
    } catch (error) {
      console.error('Error generating QR code:', error);
      return { success: false, message: 'Failed to generate QR code' };
    }
  }

  /**
   * Verify a TOTP token against a secret
   * @param {string} token - 6-digit TOTP token from user's authenticator app
   * @param {string} secret - Base32 encoded secret
   * @param {number} window - Time window tolerance (default: 2 = ±60 seconds)
   * @returns {boolean} - True if token is valid
   */
  static verifyToken(token, secret, window = 2) {
    try {
      // Remove any spaces or formatting from token
      const cleanToken = token.toString().replace(/\s/g, '');
      
      // Validate token format (should be 6 digits)
      if (!/^\d{6}$/.test(cleanToken)) {
        return false;
      }

      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: window // Allows for clock drift
      });

      return verified;
    } catch (error) {
      console.error('Error verifying 2FA token:', error);
      return false;
    }
  }

  /**
   * Generate a backup code for emergency access
   * @returns {string} - 8-character backup code
   */
  static generateBackupCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  /**
   * Generate multiple backup codes
   * @param {number} count - Number of backup codes to generate (default: 10)
   * @returns {Array<string>} - Array of backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = new Set();
    while (codes.size < count) {
      codes.add(this.generateBackupCode());
    }
    return Array.from(codes);
  }

  /**
   * Validate 2FA setup by verifying a token during initial setup
   * @param {string} token - TOTP token from user
   * @param {string} secret - Secret generated during setup
   * @returns {Object} - Verification result with success status and message
   */
  static validateSetup(token, secret) {
    try {
      const isValid = this.verifyToken(token, secret, 1); // Stricter window for setup
      
      return {
        success: isValid,
        message: isValid 
          ? '2FA setup completed successfully' 
          : 'Invalid verification code. Please try again.',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error validating 2FA setup:', error);
      return {
        success: false,
        message: 'Failed to validate 2FA setup',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get current TOTP token (for testing purposes only)
   * @param {string} secret - Base32 encoded secret
   * @returns {string} - Current 6-digit TOTP token
   */
  static getCurrentToken(secret) {
    try {
      return speakeasy.totp({
        secret: secret,
        encoding: 'base32'
      });
    } catch (error) {
      console.error('Error generating current token:', error);
      throw new Error('Failed to generate current token');
    }
  }

  /**
   * Check if 2FA token is within acceptable time window
   * @param {string} secret - Base32 encoded secret
   * @param {number} windowMinutes - Time window in minutes to check
   * @returns {Object} - Token validity info
   */
  static getTokenValidity(secret, windowMinutes = 2) {
    try {
      const currentToken = this.getCurrentToken(secret);
      const timeRemaining = 30 - (Math.floor(Date.now() / 1000) % 30);
      
      return {
        current_token: currentToken,
        time_remaining_seconds: timeRemaining,
        window_minutes: windowMinutes,
        is_near_expiry: timeRemaining <= 5
      };
    } catch (error) {
      console.error('Error checking token validity:', error);
      return null;
    }
  }
}

module.exports = TwoFactorAuth;

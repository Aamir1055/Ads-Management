const express = require('express');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Simulate the login process
async function testLoginFlow() {
  try {
    console.log('🔐 Testing login flow for admin user...\n');
    
    // Step 1: Find user
    const user = await User.findByUsername('admin');
    console.log('1. User found:', {
      id: user.id,
      username: user.username,
      is_2fa_enabled: user.is_2fa_enabled
    });
    
    // Step 2: Check password (assuming correct password)
    const isMatch = await bcrypt.compare('password', user.hashed_password);
    console.log('2. Password match:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return;
    }
    
    // Step 3: Check 2FA status
    if (user.is_2fa_enabled) {
      console.log('3. 2FA is enabled, checking setup status...');
      
      const needs2FASetup = await User.needs2FASetup(user.id);
      console.log('4. Needs 2FA setup:', needs2FASetup);
      
      if (needs2FASetup) {
        console.log('5. Generating 2FA setup...');
        const setupData = await User.generate2FASetup(user.id);
        
        console.log('✅ 2FA Setup Response would be:');
        console.log({
          success: true,
          message: 'Password verified. Please set up 2FA by scanning the QR code.',
          data: {
            user: {
              id: user.id,
              username: user.username,
              is_2fa_enabled: true,
              role_id: user.role_id
            },
            requires_2fa_setup: true,
            qr_code: setupData.qrCode ? 'QR Code Generated ✅' : 'No QR Code ❌',
            next_step: 'Scan the QR code with your authenticator app and enter the 6-digit code to complete setup'
          }
        });
      } else {
        console.log('5. User needs to provide 2FA token (already set up)');
        console.log('✅ Regular 2FA Response would be:');
        console.log({
          success: true,
          message: 'Password verified. 2FA token required.',
          data: {
            requires_2fa: true
          }
        });
      }
    } else {
      console.log('3. 2FA not enabled, normal login');
      console.log('✅ Normal Login Response would be:');
      console.log({
        success: true,
        message: 'Login successful',
        data: {
          requires_2fa: false,
          access_token: 'token_would_be_here',
          user: { id: user.id, username: user.username }
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testLoginFlow().then(() => {
  console.log('\n🎯 Test completed');
  process.exit(0);
});

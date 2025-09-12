<?php
session_start();

// Include database configuration
require_once 'config/database.php';

/**
 * Authentication Handler with 2FA Support
 * 
 * This script handles user authentication including Two-Factor Authentication
 * using Time-based One-Time Password (TOTP) algorithm
 */

class AuthHandler {
    private $db;
    
    public function __construct() {
        $this->db = getDB();
    }
    
    /**
     * Handle incoming authentication requests
     */
    public function handleRequest() {
        // Set JSON response headers
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: POST');
        header('Access-Control-Allow-Headers: Content-Type');
        
        try {
            // Only allow POST requests
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                throw new Exception('Only POST requests are allowed');
            }
            
            // Get JSON input
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input || !isset($input['action'])) {
                throw new Exception('Invalid request format');
            }
            
            $action = $input['action'];
            
            switch ($action) {
                case 'check_credentials':
                    $this->checkCredentials($input);
                    break;
                    
                case 'verify_2fa':
                    $this->verify2FA($input);
                    break;
                    
                default:
                    throw new Exception('Invalid action');
            }
            
        } catch (Exception $e) {
            $this->sendErrorResponse($e->getMessage());
        }
    }
    
    /**
     * Check username and password credentials
     */
    private function checkCredentials($input) {
        if (!isset($input['username']) || !isset($input['password'])) {
            throw new Exception('Username and password are required');
        }
        
        $username = trim($input['username']);
        $password = $input['password'];
        
        if (empty($username) || empty($password)) {
            throw new Exception('Username and password cannot be empty');
        }
        
        // Get user from database
        $user = $this->getUserByUsername($username);
        
        if (!$user) {
            // Add a small delay to prevent timing attacks
            usleep(100000); // 0.1 seconds
            throw new Exception('Invalid username or password');
        }
        
        // Check if account is active
        if (!$user['is_active']) {
            throw new Exception('Your account has been deactivated. Please contact your administrator.');
        }
        
        // Verify password
        if (!password_verify($password, $user['hashed_password'])) {
            // Log failed login attempt
            $this->logFailedLogin($user['id'], $_SERVER['REMOTE_ADDR'] ?? 'unknown');
            throw new Exception('Invalid username or password');
        }
        
        // Check if 2FA is enabled for this user
        $requires2FA = $this->userRequires2FA($user);
        
        if ($requires2FA) {
            // Store user data in session for 2FA verification step
            $_SESSION['pending_user_id'] = $user['id'];
            $_SESSION['pending_login_time'] = time();
            
            $this->sendSuccessResponse([
                'requires_2fa' => true,
                'message' => 'Please enter your 2FA code'
            ]);
        } else {
            // Complete login without 2FA
            $this->completeLogin($user);
        }
    }
    
    /**
     * Verify 2FA code
     */
    private function verify2FA($input) {
        if (!isset($input['username']) || !isset($input['password']) || !isset($input['twofa_code'])) {
            throw new Exception('Username, password, and 2FA code are required');
        }
        
        // Check if we have a pending login session
        if (!isset($_SESSION['pending_user_id']) || !isset($_SESSION['pending_login_time'])) {
            throw new Exception('No pending 2FA verification found. Please start the login process again.');
        }
        
        // Check if the session hasn't expired (5 minutes)
        if (time() - $_SESSION['pending_login_time'] > 300) {
            unset($_SESSION['pending_user_id'], $_SESSION['pending_login_time']);
            throw new Exception('2FA verification session expired. Please start the login process again.');
        }
        
        $user_id = $_SESSION['pending_user_id'];
        $twofa_code = trim($input['twofa_code']);
        
        // Get user data
        $user = $this->getUserById($user_id);
        if (!$user) {
            throw new Exception('User not found');
        }
        
        // Re-verify password for security
        if (!password_verify($input['password'], $user['hashed_password'])) {
            throw new Exception('Invalid credentials');
        }
        
        // Verify 2FA code
        if (!$this->verify2FACode($user, $twofa_code)) {
            // Log failed 2FA attempt
            $this->logFailed2FA($user['id'], $_SERVER['REMOTE_ADDR'] ?? 'unknown');
            throw new Exception('Invalid 2FA code. Please try again.');
        }
        
        // Clean up pending session data
        unset($_SESSION['pending_user_id'], $_SESSION['pending_login_time']);
        
        // Complete login
        $this->completeLogin($user);
    }
    
    /**
     * Get user by username
     */
    private function getUserByUsername($username) {
        $stmt = $this->db->prepare("
            SELECT id, username, hashed_password, role_id, is_active, 
                   twofa_enabled, is_2fa_enabled, two_factor_secret, twofa_secret
            FROM users 
            WHERE username = :username
            LIMIT 1
        ");
        
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Get user by ID
     */
    private function getUserById($user_id) {
        $stmt = $this->db->prepare("
            SELECT id, username, hashed_password, role_id, is_active, 
                   twofa_enabled, is_2fa_enabled, two_factor_secret, twofa_secret
            FROM users 
            WHERE id = :user_id
            LIMIT 1
        ");
        
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch();
    }
    
    /**
     * Check if user requires 2FA
     */
    private function userRequires2FA($user) {
        // Check both possible 2FA enabled columns from your schema
        $is2FAEnabled = $user['twofa_enabled'] || $user['is_2fa_enabled'];
        
        // Also check if they have a 2FA secret configured
        $has2FASecret = !empty($user['two_factor_secret']) || !empty($user['twofa_secret']);
        
        return $is2FAEnabled && $has2FASecret;
    }
    
    /**
     * Verify 2FA code using TOTP algorithm
     */
    private function verify2FACode($user, $code) {
        // Get the user's 2FA secret
        $secret = $user['two_factor_secret'] ?: $user['twofa_secret'];
        
        if (empty($secret)) {
            return false;
        }
        
        // Verify the TOTP code
        return $this->verifyTOTP($secret, $code);
    }
    
    /**
     * Simple TOTP verification
     * This is a basic implementation - you might want to use a library like RobThree/TwoFactorAuth for production
     */
    private function verifyTOTP($secret, $code, $window = 1) {
        $timeSlice = floor(time() / 30);
        
        // Check current time slice and adjacent ones (to account for clock drift)
        for ($i = -$window; $i <= $window; $i++) {
            $calculatedCode = $this->getTOTPCode($secret, $timeSlice + $i);
            if (hash_equals($calculatedCode, str_pad($code, 6, '0', STR_PAD_LEFT))) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Generate TOTP code
     */
    private function getTOTPCode($secret, $timeSlice) {
        // Decode base32 secret
        $secretKey = $this->base32Decode($secret);
        
        // Pack time slice as 8-byte big-endian
        $timeBytes = pack('N*', 0) . pack('N*', $timeSlice);
        
        // Generate HMAC hash
        $hash = hash_hmac('sha1', $timeBytes, $secretKey, true);
        
        // Extract dynamic binary code
        $offset = ord($hash[19]) & 0xf;
        $code = (
            ((ord($hash[$offset + 0]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
        ) % pow(10, 6);
        
        return str_pad($code, 6, '0', STR_PAD_LEFT);
    }
    
    /**
     * Simple base32 decode
     */
    private function base32Decode($data) {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $output = '';
        $v = 0;
        $vbits = 0;
        
        for ($i = 0; $i < strlen($data); $i++) {
            $value = strpos($alphabet, $data[$i]);
            if ($value === false) continue;
            
            $v = ($v << 5) | $value;
            $vbits += 5;
            
            if ($vbits >= 8) {
                $output .= chr(($v >> ($vbits - 8)) & 255);
                $vbits -= 8;
            }
        }
        
        return $output;
    }
    
    /**
     * Complete the login process
     */
    private function completeLogin($user) {
        // Update last login timestamp
        $this->updateLastLogin($user['id']);
        
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['role_id'] = $user['role_id'];
        $_SESSION['login_time'] = time();
        $_SESSION['logged_in'] = true;
        
        // Log successful login
        $this->logSuccessfulLogin($user['id'], $_SERVER['REMOTE_ADDR'] ?? 'unknown');
        
        $this->sendSuccessResponse([
            'requires_2fa' => false,
            'message' => 'Login successful',
            'redirect_url' => 'dashboard.php',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'role_id' => $user['role_id']
            ]
        ]);
    }
    
    /**
     * Update user's last login timestamp
     */
    private function updateLastLogin($user_id) {
        $stmt = $this->db->prepare("UPDATE users SET last_login = NOW() WHERE id = :user_id");
        $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
        $stmt->execute();
    }
    
    /**
     * Log successful login
     */
    private function logSuccessfulLogin($user_id, $ip_address) {
        // You can implement login logging here if you have a logs table
        error_log("Successful login for user ID: $user_id from IP: $ip_address");
    }
    
    /**
     * Log failed login attempt
     */
    private function logFailedLogin($user_id, $ip_address) {
        error_log("Failed login attempt for user ID: $user_id from IP: $ip_address");
    }
    
    /**
     * Log failed 2FA attempt
     */
    private function logFailed2FA($user_id, $ip_address) {
        error_log("Failed 2FA verification for user ID: $user_id from IP: $ip_address");
    }
    
    /**
     * Send success response
     */
    private function sendSuccessResponse($data) {
        echo json_encode(array_merge(['success' => true], $data));
        exit;
    }
    
    /**
     * Send error response
     */
    private function sendErrorResponse($message) {
        echo json_encode([
            'success' => false,
            'message' => $message
        ]);
        exit;
    }
}

// Handle the request
$authHandler = new AuthHandler();
$authHandler->handleRequest();
?>

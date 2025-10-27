<?php
session_start();

// Log the logout action (optional)
if (isset($_SESSION['user_id']) && isset($_SESSION['username'])) {
    error_log("User logout: " . $_SESSION['username'] . " (ID: " . $_SESSION['user_id'] . ") from IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
}

// Destroy the session
session_unset();
session_destroy();

// Clear session cookie
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Redirect to login page
header('Location: login.html');
exit;
?>

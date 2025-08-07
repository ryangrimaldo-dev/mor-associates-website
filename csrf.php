<?php
/**
 * CSRF Protection Helper Functions
 */

/**
 * Generate a new CSRF token and store it in the session
 * @return string The generated CSRF token
 */
function generateCsrfToken() {
    if (!isset($_SESSION)) {
        session_start();
    }
    
    // Generate a random token
    $token = bin2hex(random_bytes(32));
    
    // Store it in the session
    $_SESSION['csrf_token'] = $token;
    
    return $token;
}

/**
 * Get the current CSRF token or generate a new one if none exists
 * @return string The CSRF token
 */
function getCsrfToken() {
    if (!isset($_SESSION)) {
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        return generateCsrfToken();
    }
    
    return $_SESSION['csrf_token'];
}

/**
 * Validate a CSRF token against the stored session token
 * @param string $token The token to validate
 * @return bool True if the token is valid, false otherwise
 */
function validateCsrfToken($token) {
    if (!isset($_SESSION)) {
        session_start();
    }
    
    if (!isset($_SESSION['csrf_token'])) {
        return false;
    }
    
    return hash_equals($_SESSION['csrf_token'], $token);
}
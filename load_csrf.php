<?php
session_start();
require_once __DIR__ . '/csrf.php';

// Generate a new CSRF token
$token = getCsrfToken();

// Return as JSON
header('Content-Type: application/json');
echo json_encode(['csrf_token' => $token]);
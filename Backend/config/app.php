<?php

$env = parse_ini_file(__DIR__ . '/../.env');

// JWT
define('JWT_SECRET', $env['JWT_SECRET'] ?? 'fallback_secret');
define('JWT_EXPIRY', 604800); // 1 semana

// Upload
define('UPLOAD_PATH', __DIR__ . '/../public/uploads/profiles/');
define('UPLOAD_MAX_SIZE', 2 * 1024 * 1024); // 2MB
define('UPLOAD_ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp']);

// Google Books API
define('GOOGLE_BOOKS_API_KEY', $env['GOOGLE_BOOKS_API_KEY'] ?? '');
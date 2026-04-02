<?php

define('JWT_SECRET', 'mybookshelf_secret_2025');
define('JWT_EXPIRY', 604800); // 1 semana em segundos

define('UPLOAD_PATH', __DIR__ . '/../public/uploads/profiles/');
define('UPLOAD_MAX_SIZE', 2 * 1024 * 1024); // 2MB
define('UPLOAD_ALLOWED_TYPES', ['image/jpeg', 'image/png', 'image/webp']);

define('GOOGLE_BOOKS_API_KEY', 'AIzaSyDeRlUkyIsWmLEk49SB6X25Pkpi7PJAoio'); //API Google Books
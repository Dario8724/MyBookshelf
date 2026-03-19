<?php

ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../app/core/Database.php';
require_once __DIR__ .'/../app/core/Controller.php';
require_once __DIR__ .'/../app/core/Router.php';
require_once __DIR__ .'/../app/core/JWT.php';

$router = new Router();
require_once __DIR__ . '/../routes/api.php';

error_log("URI: " . $_SERVER['REQUEST_URI']);
error_log("METHOD: " . $_SERVER['REQUEST_METHOD']);

$router->dispatch();
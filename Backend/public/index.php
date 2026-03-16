<?php

header('Acess-Control-Allow-Origin: *');
header('Acess-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Acess-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: applications/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../app/core/Database.php';

//Teste de ligação
try {
    Database::getInstance()->getConnection();
    echo json_encode(['success' => true, 'message' => 'Ligação à base de dados OK!']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
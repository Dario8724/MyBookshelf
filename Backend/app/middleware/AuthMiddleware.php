<?php

require_once __DIR__ . '/../core/JWT.php';
require_once __DIR__ . '/../core/Controller.php';

class AuthMiddleware
{
    public static function requireAuth(): array
    {
        $helper = new Controller();
        $token = $helper->getBearerToken();

        if (!$token) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Token de autenticação em falta.']);
            exit;
        }

        $payload = JWT::verify($token);

        if (!$payload) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Token inválido ou expirado.']);
            exit;
        }
        
        return $payload;
    }
}
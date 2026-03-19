<?php

require_once __DIR__ . '/../core/JWT.php';
require_once __DIR__ . '/../core/Controller.php';

class AuthMiddleware
{
    public static function requireAuth(): array
    {

        $token = null;

        $headers = getallheaders();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization'){
                if (str_starts_with($value,'Bearer')) {
                    $token = substr($value, 7);
                }
            }
        }

        IF (!$token && isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['HTTP_AUTHORIZATION'];
            if (str_starts_with($auth, 'Bearer')){
                $token = substr($auth, 7);
            }
        }

        if (!$token && isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
            if (str_starts_with($auth, 'Bearer')){
                $token = substr($auth, 7);
            }
        }

        if (!$token) {
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Token de autenticação em falta']);
            exit;
        }

        $payload = JWT::verify($token);

        if(!$payload){
            http_response_code(401);
            header('Content-Type: application/json; charset=utf-8');
            echo json_encode(['success' => false, 'error' => 'Token inválido ou expirado']);
            exit;
        }

        return $payload;
    }
}
<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../core/JWT.php';
require_once __DIR__ . '/../models/UserModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../../config/app.php';

class UserController extends Controller
{
    private UserModel $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    public function register(): void
    {
        $name       = trim($_POST['name']       ?? '');
        $email      = trim($_POST['email']      ?? '');
        $password   = trim($_POST['password']   ?? '');

        $errors = [];

        if (empty($name)) {
            $errors[] = 'O nome é obrigatório';
        }

        if (empty($email)) {
            $errors[] = 'O email é obrigatório';
        } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Formato de email é inválido';
        }

        if (empty($password)) {
            $errors[] = 'A palavra-passe é obrigatória';
        } elseif (strlen($password) < 6) {
            $errors[] = 'A palavra-passe deve ter no mínimo 6 caracteres';
        }

        if (!empty($errors)) {
            $this->error(implode(' ', $errors), 422);
        }

        if ($this->userModel->findByEmail($email)) {
            $this->error('Este email já está registrado', 409);
        }

        $profileImage = null;

        if (isset($_FILES['profile_image']) && $_FILES['profile_image']['error'] === UPLOAD_ERR_NO_FILE) {
            $result = $this->handleProfileImageUpload($_FILES['profile_image']);

            if (isset($result['error'])) {
                $this->error($result['error'], 422);
            }

            $profileImagePath = $result['path'];
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $userID = $this->userModel->create($name, $email, $hashedPassword, $profileImagePath);

        $token = JWT::generate([
            'user_id' => $userID,
            'email'   => $email,
            'name'    => $name,
        ]);

        $this->success([
            'token'=> $token,
            'user' => [
                'user_id'       => $userID,
                'name'          => $name,
                'email'         => $email,
                'profile_image' => $profileImagePath,
            ],
        ], 'Utilizador registado com sucesso', 201);
    }

    public function login(): void
    {
        $body     = $this->getBody();
        $email    = trim($body['email']    ?? '');
        $password = trim($body['password'] ?? '');

        if (empty($email) || empty($password)) {
            $this->error('Email e palavra-passe são obrigatórios', 422);
        }

        $user = $this->userModel->findByEmail($email);

        if (empty($user)) {
            $this->error('Credenciais inválidas', 401);
        }

        if (!password_verify($password, $user['password'])) {
            $this->error('Credenciais inválidas', 401);
        }

        $token = JWT::generate([
            'user_id' => $user['user_id'],
            'email'   => $user['email'],
            'name'    => $user['name'],
        ]);

        unset($user['password']);

        $this->success([
            'token'=> $token,
            'user' => $user,
        ], 'Login efectuado com sucesso');
    }

    public function me(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $user = $this->userModel->findByEmail($payload['user_id']);

        if (!$user) {
            $this->error('Utilizador não encontrado', 404);
        }

        $this->success(['user' => $user]);
    }

    private function handleProfileImageUpload(array $file): array
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return ['error' => 'Erro no upload da imagem'];
        }

        if ($file['size'] > UPLOAD_MAX_SIZE) {
            return ['error'=> 'A imamgem não pode exceder 2MB'];
        }

        $finfo    = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (!in_array($mimeType, UPLOAD_ALLOWED_TYPES)) {
            return ['error' => 'Formato não suportado. Use JPEG, PNG ou WebP.'];
        }
        
        $extension = match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        };

        $filename = uniqid('profile_', true) . '.' . $extension;
        $destination = UPLOAD_PATH . $filename;

        if (!move_uploaded_file($file['tmp_name'], $destination)) {
            return ['error' => 'Não foi possível salvar a imagem'];
        }

        return ['path' => 'uploads/profiles/' . $filename];
    }
}
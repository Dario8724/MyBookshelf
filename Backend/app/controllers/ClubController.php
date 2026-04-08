<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ClubModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClubController extends Controller
{
    private ClubModel $clubModel;

    public function __construct()
    {
        $this->clubModel = new ClubModel();
    }

    public function create(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId  = $payload['user_id'];

        $body        = $this->getBody();
        $name        = trim($body['name']        ?? '');
        $description = trim($body['description'] ?? '');
        $latitude    = isset($body['latitude'])  ? (float) $body['latitude']  : null;
        $longitude   = isset($body['longitude']) ? (float) $body['longitude'] : null;

        if (empty($name)) {
            $this->error('O nome do clube é obrigatório.', 422);
        }

        if (empty($description)) {
            $this->error('A descrição do clube é obrigatória.', 422);
        }

        $clubId = $this->clubModel->create($name, $description, $userId, $latitude, $longitude);
        $club   = $this->clubModel->findById($clubId);

        $this->success(['club' => $club], 'Clube criado com sucesso.', 201);
    }
    public function join(int $clubId): void
{
    $payload = AuthMiddleware::requireAuth();
    $userId  = $payload['user_id'];

    $club = $this->clubModel->findById($clubId);

    if (!$club) {
        $this->error('Clube não encontrado.', 404);
    }

    if ($this->clubModel->isMember($clubId, $userId)) {
        $this->error('Já és membro deste clube.', 409);
    }

    $this->clubModel->join($clubId, $userId);

    $this->success(null, 'Entraste no clube com sucesso.', 201);
}

public function leave(int $clubId): void
{
    $payload = AuthMiddleware::requireAuth();
    $userId  = $payload['user_id'];

    $club = $this->clubModel->findById($clubId);

    if (!$club) {
        $this->error('Clube não encontrado.', 404);
    }

    $left = $this->clubModel->leave($clubId, $userId);

    if (!$left) {
        $this->error('Não és membro deste clube ou és o admin.', 403);
    }

    $this->success(null, 'Saíste do clube com sucesso.');
}
public function show(int $clubId): void
{
    $payload = AuthMiddleware::requireAuth();

    $club = $this->clubModel->findById($clubId);

    if (!$club) {
        $this->error('Clube não encontrado.', 404);
    }

    $this->success(['club' => $club]);
}

public function index(): void{
    $payload = AuthMiddleware::requireAuth();

    $clubs = $this->clubModel->findAll();

    $this->success([
        'total' => count($clubs),
        'clubs' => $clubs,
    ]);
}
}
<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ClubReadingSessionModel.php';
require_once __DIR__ . '/../models/ClubModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClubReadingSessionController extends Controller
{
    private ClubReadingSessionModel $sessionModel;
    private ClubModel $clubModel;

    public function __construct()
    {
        $this->sessionModel = new ClubReadingSessionModel();
        $this->clubModel    = new ClubModel();
    }

    public function create(int $clubId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId  = $payload['user_id'];

        $club = $this->clubModel->findById($clubId);
        if (!$club) {
            $this->error('Clube não encontrado.', 404);
        }

        if (!$this->clubModel->isMember($clubId, $userId)) {
            $this->error('Tens de ser membro do clube.', 403);
        }

        $body      = $this->getBody();
        $bookId    = (int) ($body['book_id']    ?? 0);
        $startDate = trim($body['start_date'] ?? '');
        $endDate   = trim($body['end_date']   ?? '');

        if (empty($bookId)) {
            $this->error('O book_id é obrigatório.', 422);
        }

        if (empty($startDate) || empty($endDate)) {
            $this->error('As datas de início e fim são obrigatórias.', 422);
        }

        $sessionId = $this->sessionModel->create($clubId, $bookId, $startDate, $endDate);

        $this->success(['session_id' => $sessionId], 'Sessão de leitura criada com sucesso.', 201);
    }

    public function index(int $clubId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId  = $payload['user_id'];

        $club = $this->clubModel->findById($clubId);
        if (!$club) {
            $this->error('Clube não encontrado.', 404);
        }

        if (!$this->clubModel->isMember($clubId, $userId)) {
            $this->error('Tens de ser membro do clube.', 403);
        }

        $sessions = $this->sessionModel->getByClub($clubId);

        $this->success([
            'total'    => count($sessions),
            'sessions' => $sessions,
        ]);
    }

    public function complete(int $sessionId): void
    {
        $payload = AuthMiddleware::requireAuth();

        $completed = $this->sessionModel->complete($sessionId);

        if (!$completed) {
            $this->error('Sessão não encontrada.', 404);
        }

        $this->success(null, 'Sessão marcada como concluída.');
    }
}
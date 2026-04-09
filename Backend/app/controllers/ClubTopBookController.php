<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ClubTopBookModel.php';
require_once __DIR__ . '/../models/ClubModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClubTopBookController extends Controller
{
    private ClubTopBookModel $topBookModel;
    private ClubModel $clubModel;

    public function __construct()
    {
        $this->topBookModel = new ClubTopBookModel();
        $this->clubModel    = new ClubModel();
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

        $books = $this->topBookModel->getByClub($clubId);

        $this->success([
            'total' => count($books),
            'books' => $books,
        ]);
    }

    public function add(int $clubId): void
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

        $body     = $this->getBody();
        $bookId   = (int) ($body['book_id']  ?? 0);
        $position = (int) ($body['position'] ?? 0);

        if (empty($bookId) || empty($position)) {
            $this->error('O book_id e position são obrigatórios.', 422);
        }

        $this->topBookModel->add($clubId, $bookId, $position);

        $this->success(null, 'Livro adicionado ao top com sucesso.', 201);
    }
}
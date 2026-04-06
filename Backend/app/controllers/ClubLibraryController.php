<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ClubLibraryModel.php';
require_once __DIR__ . '/../models/ClubModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClubLibraryController extends Controller
{
    private ClubLibraryModel $libraryModel;
    private ClubModel $clubModel;

    public function __construct()
    {
        $this->libraryModel = new ClubLibraryModel();
        $this->clubModel    = new ClubModel();
    }

    public function addBook(int $clubId): void
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

        $body   = $this->getBody();
        $bookId = (int) ($body['book_id'] ?? 0);

        if (empty($bookId)) {
            $this->error('O book_id é obrigatório.', 422);
        }

        if ($this->libraryModel->exists($clubId, $bookId)) {
            $this->error('Este livro já existe na biblioteca do clube.', 409);
        }

        $id = $this->libraryModel->addBook($clubId, $bookId, $userId);

        $this->success(['club_library_id' => $id], 'Livro adicionado à biblioteca do clube.', 201);
    }

    public function removeBook(int $clubLibraryId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId  = $payload['user_id'];

        $body   = $this->getBody();
        $clubId = (int) ($body['club_id'] ?? 0);

        if (empty($clubId)) {
            $this->error('O club_id é obrigatório.', 422);
        }

        if (!$this->clubModel->isMember($clubId, $userId)) {
            $this->error('Tens de ser membro do clube.', 403);
        }

        $removed = $this->libraryModel->removeBook($clubLibraryId, $clubId);

        if (!$removed) {
            $this->error('Livro não encontrado na biblioteca do clube.', 404);
        }

        $this->success(null, 'Livro removido da biblioteca do clube.');
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

        $books = $this->libraryModel->getByClub($clubId);

        $this->success([
            'total' => count($books),
            'books' => $books,
        ], 'Biblioteca do clube carregada com sucesso.');
    }
}
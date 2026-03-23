<?php

require_once __DIR__ ."/../core/Controller.php";
require_once __DIR__ ."/../models/UserBookModel.php";
require_once __DIR__ ."/../middleware/AuthMiddleware.php";

class UserBookController extends Controller
{
    private UserBookModel $userBookModel;

    public function __construct()
    {
        $this->userBookModel = new UserBookModel();
    }

    public function addBook(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userid = $payload['user_id'];

        $body = $this->getBody();
        $bookId = (int) ($body['book_id'] ?? 0);
        $status = trim($body['status'] ?? '');

        $validStatuses = ['reading', 'completed', 'want_to_read'];

        if (empty($bookId)) {
            $this->error('O book_id é obrigatório.', 422);
        }

        if (!in_array($status, $validStatuses)) {
            $this->error('Status inválido. Use "reading", "completed" ou "want to read".', 422);
        }

        $this->userBookModel->addBook($userid, $bookId, $status);

        $this->success(null, 'Livro adicionado à biblioteca com sucesso.', 201);
    }

    public function removeBook(int $bookId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userid = $payload['user_id'];

        $removed = $this->userBookModel->removeBook($userid, $bookId);

        if ($removed) {
            $this->error('Livro não encontrado na tua biblioteca.', 404);
        }

        $this->success(null, 'Livro removido da biblioteca com sucesso.');
    }

    public function getStatus(int $bookID): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userid = $payload['user_id'];

        $status = $this->userBookModel->getStatus($userid, $bookID);

        $this->success(['status'=> $status]);
    }

    public function getLibrary(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userid = $payload['user_id'];

        $books = $this->userBookModel->getLibrary($userid);

        if (empty($books)) {
            $this->success([], 'A tua biblioteca está vazia.');
        }

        $this->success([
            'total' => count($books),
            'books' => $books,
        ], 'Biblioteca carregada com sucesso.');
    }

}
<?php

require_once __DIR__ .'/../core/Controller.php';
require_once __DIR__ .'/../models/BookModel.php';

class BookController extends Controller
{
    private BookModel $bookModel;

    public function __construct()
    {
        $this->bookModel = new BookModel();
    }

    public function search(): void
    {
        $query = trim($_GET['q'] ?? '');

        if (empty($query)) {
            $this->error('Introduz um termo de pesquisa.', 422);
        }

        if (strlen($query) < 2) {
            $this->error('A pesquisa deve ter no mínimo 2 caracteres.', 422);
        }

        $books = $this->bookModel->search($query);

        if (empty($books)) {
            $this->success([], 'Nenhum livro encontrado.');
        }

        $this->success([
            'total' => count($books),
            'books' => $books,
        ], 'Livros encontrados.');
    }

    public function show(int $bookID): void
    {
        $book = $this->bookModel->findById($bookID);

        if (!$book) {
            $this->error('Livro não encontrado.', 404);
        }

        $this->success(['book' => $book], 'Livro encontrado.');
    }
}

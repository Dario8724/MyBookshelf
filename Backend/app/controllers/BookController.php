<?php

require_once __DIR__ .'/../core/Controller.php';
require_once __DIR__ .'/../core/GoogleBooksService.php';
require_once __DIR__ .'/../models/BookModel.php';

class BookController extends Controller
{
    private GoogleBooksService $googleBooks;
    private BookModel $bookModel;

    public function __construct()
    {
        $this->googleBooks = new GoogleBooksService();
        $this->bookModel = new BookModel();
    }

    //Pesquisa o livro primeiro na API
    public function search(): void
    {
        $query = trim($_GET['q'] ?? '');

        if (empty($query)) {
            $this->error('Introduz um termo de pesquisa.', 422);
        }

        if (strlen($query) < 2) {
            $this->error('A pesquisa deve ter no mínimo 2 caracteres.', 422);
        }

        $books = $this->googleBooks->search($query);

        if (empty($books)) {
            $this->success([], 'Nenhum livro encontrado.');
            return;
        }

        $this->success([
            'total' => count($books),
            'books' => $books,
        ], 'Livros encontrados.');
    }

    //Ver detalhes de um livro pelo id da google
    public function showByGoogleId(string $googleId): void
    {
        $book = $this->googleBooks->getById($googleId);

        if (!$book) {
            $this->error('Livro não encontrado', 404);
        }

        $this->success(['book' => $book], 'Livro encontrado,');

    }

    //Ver livro pelo id da nossa bd
    public function show(int $bookID): void
    {
        $book = $this->bookModel->findById($bookID);

        if (!$book) {
            $this->error('Livro não encontrado.', 404);
        }

        $this->success(['book' => $book], 'Livro encontrado.');
    }

    //Guarda um livro do Google na nossa BD
    public function saveFromGoogle(): void
    {
        $body       = $this->getBody();
        $googleId   = trim($body['google_id'] ?? '');

        if (empty($googleId)) {
            $this->error('O google_id é obrgatório', 422);
        }

        //Verifica se ja tem na BD
        $existing = $this->bookModel->findByGoogleId($googleId);

        if ($existing) {
            $this->success(['book_id' => $existing['book_id']], 'Livro já existe na biblioteca.');
            return;
        }

        //Busca os dados na google
        $bookData = $this->googleBooks->getById($googleId);

        if (!$bookData) {
            $this->error('Não foi possível obter os dados do livro.', 404);
        }

        $bookId = $this->bookModel->createFromGoogle($bookData);

        $this->success(['book_id' => $bookId],'Livro guardado com sucesso.', 201);
    }
}

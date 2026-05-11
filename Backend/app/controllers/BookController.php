<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../core/GoogleBooksService.php';
require_once __DIR__ . '/../models/BookModel.php';

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

        $authorThreshold = 3;

        // Fazer ambas as queries
        $byAuthor = $this->googleBooks->search('inauthor:"' . $query . '"');
        $byTitle = $this->googleBooks->search('intitle:"' . $query . '"');

        // Se a query for um autor reconhecido (>= 3 livros), prioriza autor
        if (count($byAuthor) >= $authorThreshold) {
            $this->success([
                'total' => count($byAuthor),
                'books' => $byAuthor,
                'search_mode' => 'author',
            ], 'Livros encontrados.');
            return;
        }

        // Senão, usa busca por título
        if (count($byTitle) > 0) {
            $this->success([
                'total' => count($byTitle),
                'books' => $byTitle,
                'search_mode' => 'title',
            ], 'Livros encontrados.');
            return;
        }

        // Fallback — busca geral
        $general = $this->googleBooks->search($query);

        if (empty($general)) {
            $this->success([
                'total' => 0,
                'books' => [],
                'search_mode' => 'general',
            ], 'Nenhum livro encontrado.');
            return;
        }

        $this->success([
            'total' => count($general),
            'books' => $general,
            'search_mode' => 'general',
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
        $body = $this->getBody();
        $googleId = trim($body['google_id'] ?? '');

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

        $this->success(['book_id' => $bookId], 'Livro guardado com sucesso.', 201);
    }

    public function searchByAuthor(): void
    {
        $author = trim($_GET['name'] ?? '');
        $excludeId = trim($_GET['exclude'] ?? '');
        $limit = (int) ($_GET['limit'] ?? 3);

        if (empty($author)) {
            $this->error('O nome do autor é obrigatório.', 422);
        }

        if ($limit < 1 || $limit > 20) {
            $limit = 3;
        }

        // Usa a sintaxe inauthor: da API do Google Books
        $query = 'inauthor:"' . $author . '"';
        $books = $this->googleBooks->search('inauthor:"' . $author . '"');

        if (empty($books)) {
            $this->success([
                'total' => 0,
                'books' => [],
            ], 'Nenhum livro encontrado.');
            return;
        }

        // Excluir o livro atual e limitar resultados
        if (!empty($excludeId)) {
            $books = array_values(array_filter($books, function ($b) use ($excludeId) {
                return $b['google_id'] !== $excludeId;
            }));
        }

        $books = array_slice($books, 0, $limit);

        $this->success([
            'total' => count($books),
            'books' => $books,
        ], 'Livros encontrados.');
    }
}

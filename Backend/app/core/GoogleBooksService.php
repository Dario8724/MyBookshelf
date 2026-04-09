<?php

require_once __DIR__ .'/../../config/app.php';

class GoogleBooksService
{
    private string $apiKey;
    private string $baseUrl = 'https://www.googleapis.com/books/v1/volumes';

    public function __construct()
    {
        $this->apiKey = GOOGLE_BOOKS_API_KEY;
    }

    //Pesquisa de livros na api
    public function search(string $query, int $maxResults = 20) : array
    {
        $url = $this->baseUrl . '?' . http_build_query([
            'q'             => 'intitle:' . $query . '"',
            'maxResults'    => $maxResults,
            'printType'     => 'books',
            'orderBy'       => 'relevance',
            'key'           => $this->apiKey,
        ]);

        $response = $this->request($url);

        if (!$response || !isset($response['items'])) {
            return [];
        }

        $books = array_map([$this, 'formatBook'], $response['items']);

        $books = array_filter($books, fn($b) => !empty($b['cover']));

        return array_values($books);
    }

    //Busca um livro pelo ID da google
    public function getById(string $googleId): ?array
    {
        $url = $this->baseUrl . '/' . $googleId . '?key=' . $this->apiKey;

        $response = $this->request($url);

        if (!$response) {
            return null;
        }

        return $this->formatBook($response);
    }

    //Converte o formato do livro da google para o nosso formato
    private function formatBook(array $item) : array
    {
        $info = $item['volumeInfo'] ?? [];

        return [
            'google_id'         => $item['id'] ?? null,
            'title'             => $info['title'] ?? 'Título desconhecido',
            'author'            => isset($info['authors']) ? implode(', ', $info['authors']) : 'Autor desconhecido',
            'isbn'              => $this->extractIsbn($info),
            'description'       => $info['description'] ?? null,
            'cover'             => $info['imageLinks']['thumbnail'] ?? null,
            'language'          => $info['language'] ?? null,
            'publication_year'  => isset($info['publishedDate']) ? substr($info['publishedDate'], 0, 4) : null,
            'publisher'         => $info['publisher'] ?? null,
            'genres'            => $info['categories'] ?? [],
        ];
    }

    //Extrai o ISBN do livro
    private function extractIsbn(array $info) : ?string
    {
        if (!isset($info['industryIdentifiers'])) {
            return null;
        }

        foreach ($info['industryIdentifiers'] as $identifier) {
            if ($identifier['type'] === 'ISBN_13') {
                return $identifier['identifier'];
            }
        }

        foreach ($info['industryIdentifiers'] as $identifier) {
            if ($identifier['type'] === 'ISBN_10') {
                return $identifier['identifier'];
            }
        }

        return null;
    }

    // Faz o pedido http à api
    private function request(string $url): ?array
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout'   => 10,
            ],
        ]);

        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            return null;
        }

        return json_decode($response, true);
    }
}
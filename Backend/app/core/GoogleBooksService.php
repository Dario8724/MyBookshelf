<?php

require_once __DIR__ . '/../../config/app.php';

class GoogleBooksService
{
    private string $apiKey;
    private string $baseUrl = 'https://www.googleapis.com/books/v1/volumes';

    public function __construct()
    {
        $this->apiKey = GOOGLE_BOOKS_API_KEY;
    }

    public function search(string $query, int $maxResults = 20, array $options = []): array
    {
        $params = [
            'q' => $query,
            'maxResults' => max(1, min(40, $maxResults)),
            'printType' => 'books',
            'orderBy' => $options['orderBy'] ?? 'relevance',
            'key' => $this->apiKey,
        ];

        if (!empty($options['langRestrict'])) {
            $params['langRestrict'] = $options['langRestrict'];
        }

        $url = $this->baseUrl . '?' . http_build_query($params);

        $response = $this->request($url);

        if (!$response || !isset($response['items'])) {
            return [];
        }

        $books = array_map([$this, 'formatBook'], $response['items']);

        // Filtra apenas livros com capa
        $books = array_filter($books, fn($b) => !empty($b['cover']));

        return array_values($books);
    }

    /** Busca um livro pelo Google ID. */
    public function getById(string $googleId): ?array
    {
        $url = $this->baseUrl . '/' . $googleId . '?key=' . $this->apiKey;

        $response = $this->request($url);

        if (!$response) {
            return null;
        }

        return $this->formatBook($response);
    }

    /** Converte o formato do livro da Google para o formato interno.*/
    private function formatBook(array $item): array
    {
        $info = $item['volumeInfo'] ?? [];

        return [
            'google_id' => $item['id'] ?? null,
            'title' => $info['title'] ?? 'Título desconhecido',
            'author' => isset($info['authors']) ? implode(', ', $info['authors']) : 'Autor desconhecido',
            'isbn' => $this->extractIsbn($info),
            'description' => $info['description'] ?? null,
            'cover' => $this->getBestCover($info['imageLinks'] ?? []),
            'language' => $info['language'] ?? null,
            'publication_year' => isset($info['publishedDate']) ? substr($info['publishedDate'], 0, 4) : null,
            'publisher' => $info['publisher'] ?? null,
            'genres' => $info['categories'] ?? [],
        ];
    }

    /** Devolve a melhor capa disponível*/
    private function getBestCover(array $imageLinks): ?string
    {
        // Ordem de preferência: maior resolução primeiro
        $sizes = ['extraLarge', 'large', 'medium', 'small', 'thumbnail', 'smallThumbnail'];

        foreach ($sizes as $size) {
            if (!empty($imageLinks[$size])) {
                // Garante HTTPS para evitar warnings de mixed content
                return str_replace('http://', 'https://', $imageLinks[$size]);
            }
        }

        return null;
    }

    /** Extrai o ISBN preferindo ISBN-13.*/
    private function extractIsbn(array $info): ?string
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

    /*** Faz o pedido HTTP à API com timeout e tratamento de erros.*/
    private function request(string $url): ?array
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'timeout' => 10,
                'header' => "Accept: application/json\r\n",
            ],
        ]);

        $response = @file_get_contents($url, false, $context);

        if ($response === false) {
            return null;
        }

        return json_decode($response, true);
    }
}
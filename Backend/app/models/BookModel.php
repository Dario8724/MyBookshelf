<?php

require_once __DIR__ .'/../core/Database.php';

class BookModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function search(string $query): array
    {
        $stmt = $this->db->prepare("
            SELECT book_id, title, author, cover, publication_year, publisher, isbn
            FROM book
            WHERE title LIKE :query1
            OR author LIKE :query2
            OR isbn LIKE :query3
            OR publisher LIKE :query4
            ORDER BY title ASC
            LIMIT 20
        ");

        $term = "%". $query ."%";

        $stmt->execute([
            'query1' => $term,
            'query2' => $term,
            'query3' => $term,
            'query4' => $term
        ]);

        return $stmt->fetchAll();
    }

    public function findById(int $bookId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT b.book_id, b.title, b.author, b.isbn, b.description,
                   b.cover, b.language, b.publication_year, b.publisher,
                   GROUP_CONCAT(g.name SEPARATOR ', ') AS genres
            FROM book b
            LEFT JOIN book_genre bg ON b.book_id = bg.book_id
            LEFT JOIN genre g ON bg.genre_id = g.genre_id
            WHERE b.book_id = :bookId
            GROUP BY b.book_id
        ");

        $stmt->execute([':bookId' => $bookId]);
        $book = $stmt->fetch();

        return $book ?: null;          
    }

    public function findByGoogleId(string $googleId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT book_id, title, author, cover, publication_year, publisher, isbn
            FROM book
            WHERE google_id = :google_id
            LIMIT 1
        ");

        $stmt->execute([':google_id' => $googleId]);
        $book = $stmt->fetch();

        return $book ?: null;
    }

    public function createFromGoogle(array $data): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO book (title, author, isbn, description, cover, language, publication_year, publisher, google_id)
            VALUES (:title, :author, :isbn, :description, :cover, :language, :publication_year, :publisher, :google_id)
            ON DUPLICATE KEY UPDATE
                title            = VALUES(title),
                author           = VALUES(author),
                cover            = VALUES(cover),
                description      = VALUES(description),
                publication_year = VALUES(publication_year),
                publisher        = VALUES(publisher)
            ");

            $stmt->execute([
                ':title'            => $data['title'],
                ':author'           => $data['author'],
                ':isbn'             => $data['isbn'],
                ':description'      => $data['description'],
                ':cover'            => $data['cover'],
                ':language'         => $data['language'],
                ':publication_year' => $data['publication_year'],
                ':publisher'        => $data['publisher'],
                ':google_id'        => $data['google_id'],
            ]);

            return (int) $this->db->lastInsertId();
    }
}
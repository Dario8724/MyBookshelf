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
            SELECT book_id, title, author, cover, publication_year, publisher, isnb
            FROM book
            WHERE title LIKE :query
            OR author LIKE :query
            OR isbn LIKE :query
            OR publisher LIKE :query
            ORDER BY title ASC
            LIMIT 20
        ");

        $stmt->execute(['query' => '%' . $query . '%']);

        return $stmt->fetchAll();
    }
}
<?php

require_once __DIR__ .'/../core/Database.php';

class UserBookModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function addBook(int $userId, int $bookId, string $status): bool
    {
        $stmt = $this->db->prepare("
            INSERT INTO user_book (user_id, book_id, status)
            VALUES (:user_id, :book_id, :status)
            ON DUPLICATE KEY UPDATE status = :status2
        ");

        return $stmt->execute([
            ':user_id' => $userId,
            ':book_id' => $bookId,
            ':status' => $status,
            ':status2' => $status
        ]);
    }

    public function removeBook(int $userId, int $bookId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM user_book
            WHERE user_id = :user_id 
            AND book_id = :book_id
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':book_id' => $bookId
        ]);

        return $stmt->rowCount() > 0;
    }

    public function getStatus(int $userId, int $bookId): ?string
    {
        $stmt = $this->db->prepare("
            SELECT status FROM user_book 
            WHERE user_id = :user_id 
            AND book_id = :book_id"
        );

        $stmt->execute([
            ':user_id' => $userId,
            ':book_id' => $bookId
        ]);

        $result = $stmt->fetch();
        return $result ? $result['status'] : null;
    }

    public function getLibrary(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT b.book_id, b.title, b.author, b.cover,
                   b.publication_year, b.publisher,
                   ub.status, ub.favorite,
                   GROUP_CONCAT(g.name SEPARATOR ', ') AS genres
                FROM user_book ub
                JOIN book b ON ub.book_id = b.book_id
                LEFT JOIN book_genre bg ON b.book_id = bg.book_id
                LEFT JOIN genre g ON bg.genre_id = g.genre_id
                WHERE ub.user_id = :user_id
                GROUP BY b.book_id, ub.status, ub.favorite
                ORDER BY ub.status ASC
            ");

            $stmt->execute([':user_id' => $userId]);

            return $stmt->fetchAll();
    }

    public function toggleFavorite(int $userId, int $bookId): ?bool
    {
        $stmt = $this->db->prepare("
            SELECT favorite FROM user_book
            WHERE user_id = :user_id
            AND book_id = :book_id
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':book_id'=> $bookId
        ]);

        $result = $stmt->fetch();

        if (!$result) {
            return null;
        }

        $newValue = $result['favorite'] ? 0 : 1;

        $stmt = $this->db->prepare("
            UPDATE user_book
            SET favorite = :favorite
            WHERE user_id = :user_id
            AND book_id = :book_id
        ");

        $stmt->execute([
            ':favorite' => $newValue,
            ':user_id'  => $userId,
            ':book_id' => $bookId,
        ]);

        return (bool) $newValue;
    }
}
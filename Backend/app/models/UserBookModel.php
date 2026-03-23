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
}
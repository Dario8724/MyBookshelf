<?php

require_once __DIR__ .'/../core/Database.php';

class RatingModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function rate(int $userId, int $bookId, float $score): bool
    {
        $stmt = $this->db->prepare("
            INSERT INTO rating (user_id, book_id, score)
            VALUES (:user_id, :book_id, :score)
            ON DUPLICATE KEY UPDATE score = :score2
        ");

        return $stmt->execute([
            ':user_id'  => $userId,
            ':book_id'  => $bookId,
            ':score'    => $score,
            ':score2'   => $score,
        ]);
    }

    public function getAverageScore(int $bookId): ?float
    {
        $stmt = $this->db->prepare("
            SELECT ROUND(AVG(score), 1) AS average
            FROM rating
            WHERE book_id = :book_id
        ");

        $stmt->execute([':book_id' => $bookId]);
        $result = $stmt->fetch();

        return $result['average'] ? (float)$result['average'] : null;
    }

    public function getUserScore(int $userId, int $bookId): ?float
    {
        $stmt = $this->db->prepare("
            SELECT score FROM rating
            WHERE user_id = :user_id
            AND book_id = :book_id
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':book_id' => $bookId
        ]);

        $result = $stmt->fetch();
        return $result ? (float) $result['score'] : null;
    }
}
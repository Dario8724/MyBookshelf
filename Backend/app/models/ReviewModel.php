<?php

require_once __DIR__ .'/../core/Database.php';

class ReviewModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(int $userId, int $bookId, string $reviewText, bool $hasSpoiler = false): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO review (user_id, book_id, review_text, has_spoiler)
            VALUES (:user_id, :book_id, :review_text, :has_spoiler)
        ");

        $stmt->execute([
            ':user_id'      => $userId,
            ':book_id'      =>$bookId,
            ':review_text'  =>$reviewText,
            ':has_spoiler'  =>(int) $hasSpoiler,
        ]);

        return (int) $this->db->lastInsertId();
    } 

    public function getByBook(int $bookId): array
    {
        $stmt = $this->db->prepare("
            SELECT r.review_id, r.review_text, r.has_spoiler, r.created_at,
                   u.user_id, u.name, u.profile_image,
                   ra.score
            FROM review r
            JOIN user u ON r.user_id = u.user_id
            LEFT JOIN rating ra ON ra.user_id = r.user_id
                AND ra.book_id = r.book_Id
            WHERE r.book_id = :book_id
            ORDER BY r.created_at DESC
        ");

        $stmt->execute([':book_id' => $bookId]);
        return $stmt->fetchAll();
    }

    public function delete(int $reviewId, int $userId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM review
            WHERE review_id = :review_id
            AND user_id = :user_id
        ");

        $stmt->execute([
            ':review_id' => $reviewId,
            ':user_id'   => $userId,
        ]);

        return $stmt->rowCount() > 0;
    }
}
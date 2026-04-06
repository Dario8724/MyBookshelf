<?php

require_once __DIR__ . '/../core/Database.php';

class ClubTopBookModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getByClub(int $clubId): array
    {
        $stmt = $this->db->prepare("
            SELECT tb.position, b.book_id, b.title, b.author, b.cover
            FROM club_top_book tb
            JOIN book b ON tb.book_id = b.book_id
            WHERE tb.club_id = :club_id
            ORDER BY tb.position ASC
        ");

        $stmt->execute([':club_id' => $clubId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function add(int $clubId, int $bookId, int $position): void
    {
        $stmt = $this->db->prepare("
            INSERT INTO club_top_book (club_id, book_id, position)
            VALUES (:club_id, :book_id, :position)
            ON DUPLICATE KEY UPDATE position = :position2
        ");

        $stmt->execute([
            ':club_id'   => $clubId,
            ':book_id'   => $bookId,
            ':position'  => $position,
            ':position2' => $position,
        ]);
    }
}
<?php

require_once __DIR__ . '/../core/Database.php';

class ClubReadingSessionModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(int $clubId, int $bookId, string $startDate, string $endDate): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO club_reading_session (club_id, book_id, start_date, end_date, status)
            VALUES (:club_id, :book_id, :start_date, :end_date, 'active')
        ");

        $stmt->execute([
            ':club_id'    => $clubId,
            ':book_id'    => $bookId,
            ':start_date' => $startDate,
            ':end_date'   => $endDate,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function getByClub(int $clubId): array
    {
        $stmt = $this->db->prepare("
            SELECT rs.*, b.title, b.author, b.cover
            FROM club_reading_session rs
            JOIN book b ON rs.book_id = b.book_id
            WHERE rs.club_id = :club_id
            ORDER BY rs.start_date DESC
        ");

        $stmt->execute([':club_id' => $clubId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $sessionId) : ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM club_reading_session
            WHERE session_id = :session_id
        ");
        $stmt->execute([':session_id' => $sessionId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        return $result ?: null;
    }

    public function complete(int $sessionId): bool
    {
        $stmt = $this->db->prepare("
            UPDATE club_reading_session
            SET status = 'completed'
            WHERE session_id = :session_id
        ");

        $stmt->execute([':session_id' => $sessionId]);
        return $stmt->rowCount() > 0;
    }
}
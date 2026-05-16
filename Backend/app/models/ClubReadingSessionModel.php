<?php

require_once __DIR__ . '/../core/Database.php';

class ClubReadingSessionModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(int $clubId, string $title, string $bookName, string $startDate, string $endDate): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO club_reading_session (club_id, title, book_name, start_date, end_date, status)
            VALUES (:club_id, :title, :book_name, :start_date, :end_date, 'active')
        ");

        $stmt->execute([
            ':club_id'   => $clubId,
            ':title'     => $title,
            ':book_name' => $bookName,
            ':start_date' => $startDate,
            ':end_date'   => $endDate,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function getByClub(int $clubId, int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT 
                rs.*,
                COUNT(a.attendance_id) AS attendee_count,
                MAX(CASE WHEN a.user_id = :user_id THEN 1 ELSE 0 END) AS user_attending
            FROM club_reading_session rs
            LEFT JOIN club_session_attendance a ON a.session_id = rs.session_id
            WHERE rs.club_id = :club_id
            GROUP BY rs.session_id
            ORDER BY rs.start_date DESC
        ");

        $stmt->execute([':club_id' => $clubId, ':user_id' => $userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $sessionId): ?array
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

    public function getLastThreeCompleted(int $clubId): array
    {
        $stmt = $this->db->prepare("
            SELECT status FROM club_reading_session
            WHERE club_id = :club_id
            ORDER BY session_id DESC
            LIMIT 3
        ");
        $stmt->execute([':club_id' => $clubId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function toggleAttendance(int $sessionId, int $userId): bool
    {
        // verifica se já existe
        $stmt = $this->db->prepare("
            SELECT attendance_id FROM club_session_attendance
            WHERE session_id = :session_id AND user_id = :user_id
        ");
        $stmt->execute([':session_id' => $sessionId, ':user_id' => $userId]);
        $exists = $stmt->fetch();

        if ($exists) {
            $stmt = $this->db->prepare("
                DELETE FROM club_session_attendance
                WHERE session_id = :session_id AND user_id = :user_id
            ");
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO club_session_attendance (session_id, user_id)
                VALUES (:session_id, :user_id)
            ");
        }

        $stmt->execute([':session_id' => $sessionId, ':user_id' => $userId]);
        return !$exists;
    }

    public function getAttendees(int $sessionId): array
    {
        $stmt = $this->db->prepare("
            SELECT u.user_id, u.name, u.profile_image
            FROM club_session_attendance a
            JOIN user u ON u.user_id = a.user_id
            WHERE a.session_id = :session_id
        ");
        $stmt->execute([':session_id' => $sessionId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } 
}
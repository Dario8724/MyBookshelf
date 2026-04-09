<?php

require_once __DIR__ . '/../core/Database.php';

class ClubMessageModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function send(int $clubId, int $userId, string $message): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO club_message (club_id, user_id, message)
            VALUES (:club_id, :user_id, :message)
        ");

        $stmt->execute([
            ':club_id' => $clubId,
            ':user_id' => $userId,
            ':message' => $message,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function getByClub(int $clubId): array
    {
        $stmt = $this->db->prepare("
            SELECT cm.club_message_id, cm.message, cm.user_id,
                   u.name AS user_name, u.profile_image
            FROM club_message cm
            JOIN user u ON cm.user_id = u.user_id
            WHERE cm.club_id = :club_id
            ORDER BY cm.club_message_id ASC
        ");

        $stmt->execute([':club_id' => $clubId]);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
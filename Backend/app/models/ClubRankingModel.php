<?php

require_once __DIR__ . '/../core/Database.php';

class ClubRankingModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getByClub(int $clubId): array
    {
        $stmt = $this->db->prepare("
            SELECT r.ranking_id, r.points, r.season_id,
                   s.start_date AS season_start, s.end_date AS season_end
            FROM club_ranking r
            JOIN club_season s ON r.season_id = s.season_id
            WHERE r.club_id = :club_id
            ORDER BY r.points DESC
        ");

        $stmt->execute([':club_id' => $clubId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function addPoints(int $seasonId, int $clubId, int $points): void
    {
        $stmt = $this->db->prepare("
            INSERT INTO club_ranking (season_id, club_id, points)
            VALUES (:season_id, :club_id, :points)
            ON DUPLICATE KEY UPDATE points = points + :points2
        ");

        $stmt->execute([
            ':season_id' => $seasonId,
            ':club_id'   => $clubId,
            ':points'    => $points,
            ':points2'   => $points,
        ]);
    }
}
<?php

require_once __DIR__ . '/../core/Database.php';

class ClubSeasonModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(string $startDate, string $endDate): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO club_season (start_date, end_date)
            VALUES (:start_date, :end_date)
        ");

        $stmt->execute([
            ':start_date' => $startDate,
            ':end_date'   => $endDate,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function getCurrent(): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM club_season
            WHERE start_date <= CURDATE() AND end_date >= CURDATE()
            LIMIT 1
        ");

        $stmt->execute();
        $season = $stmt->fetch();

        return $season ?: null;
    }

    public function getAll(): array
    {
        $stmt = $this->db->prepare("
            SELECT s.*,
                   COUNT(r.ranking_id) AS total_clubs
            FROM club_season s
            LEFT JOIN club_ranking r ON s.season_id = r.season_id
            GROUP BY s.season_id
            ORDER BY s.start_date DESC
        ");

        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getRanking(int $seasonId): array
    {
        $stmt = $this->db->prepare("
            SELECT r.ranking_id, r.points,
                   c.club_id, c.name AS club_name, c.description,
                   RANK() OVER (ORDER BY r.points DESC) AS position
            FROM club_ranking r
            JOIN club c ON r.club_id = c.club_id
            WHERE r.season_id = :season_id
            ORDER BY r.points DESC
        ");

        $stmt->execute([':season_id' => $seasonId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
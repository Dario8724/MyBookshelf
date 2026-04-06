<?php

require_once __DIR__ . '/../core/Database.php';

class ClubModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(string $name, string $description, int $createdBy, ?float $latitude, ?float $longitude): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO club (name, description, created_by, latitude, longitude)
            VALUES (:name, :description, :created_by, :latitude, :longitude)
        ");

        $stmt->execute([
            ':name'        => $name,
            ':description' => $description,
            ':created_by'  => $createdBy,
            ':latitude'    => $latitude,
            ':longitude'   => $longitude,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function findById(int $clubId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT * FROM club WHERE club_id = :club_id
        ");

        $stmt->execute([':club_id' => $clubId]);
        $club = $stmt->fetch();

        return $club ?: null;
    }
}
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
    // join clubs
    public function join(int $clubId, int $userId): void{
    $stmt = $this->db->prepare("
        INSERT INTO club_member (club_id, user_id, role)
        VALUES (:club_id, :user_id, 'member')
    ");

    $stmt->execute([
        ':club_id' => $clubId,
        ':user_id' => $userId,
    ]);
}

public function isMember(int $clubId, int $userId): bool
{
    $stmt = $this->db->prepare("
        SELECT COUNT(*) FROM club_member
        WHERE club_id = :club_id AND user_id = :user_id
    ");

    $stmt->execute([
        ':club_id' => $clubId,
        ':user_id' => $userId,
    ]);

    return (bool) $stmt->fetchColumn();
}
// leave clubs 
public function leave(int $clubId, int $userId): bool
{
    $stmt = $this->db->prepare("
        DELETE FROM club_member
        WHERE club_id = :club_id AND user_id = :user_id AND role != 'admin'
    ");

    $stmt->execute([
        ':club_id' => $clubId,
        ':user_id' => $userId,
    ]);

    return $stmt->rowCount() > 0;
}
public function findAll(): array
{
    $stmt = $this->db->prepare("
        SELECT c.*, u.name AS created_by_name,
               COUNT(cm.club_member_id) AS total_members
        FROM club c
        JOIN user u ON c.created_by = u.user_id
        LEFT JOIN club_member cm ON c.club_id = cm.club_id
        GROUP BY c.club_id
        ORDER BY c.club_id DESC
    ");

    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
}
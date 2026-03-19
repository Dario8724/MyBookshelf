<?php

require_once __DIR__ . '/../core/Database.php';

class UserModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(string $name, string $email, string $hashedPassword, ?string $profileImage): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO user (name, email, password, profile_image)
            VALUES (:name, :email, :password, :profile_image)
        ");

        $stmt->execute([
            ':name'          => $name,
            ':email'         => $email,
            ':password'      => $hashedPassword,
            ':profile_image' => $profileImage,
        ]);

        return $this->db->lastInsertId();
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare("
            SELECT user_id, name, email, password, profile_image
            FROM user
            WHERE email = :email
            LIMIT 1
        ");

        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    public function findById(int $userId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT user_id, name, email, profile_image
            FROM user
            WHERE user_id = :user_id
            LIMIT 1
        ");

        $stmt->execute([':user_id' => $userId]);
        $user = $stmt->fetch();

        return $user ?: null;
    }

    public function emailExists(string $email): bool
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM user WHERE email = :email
        ");

        $stmt->execute([':email' => $email]);
        return (int) $stmt->fetchColumn() > 0;
    }
}
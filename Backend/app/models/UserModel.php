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
            SELECT user_id, name, email, bio, profile_image
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

    public function updateProfile(int $userId, array $data): bool
    {
        $fields = [];
        $params = [':user_id' => $userId];

        if (isset($data['name'])) {
            $fields[] = 'name = :name';
            $params[':name'] = $data['name'];
        }

        if (isset($data['bio'])) {
            $fields[] = 'bio = :bio';
            $params[':bio'] = $data['bio'];
        }
        
        if (isset($data['profile_image'])) {
            $fields[] = 'profile_image = :profile_image';
            $params[':profile_image'] = $data['profile_image'];
        }

        if (empty($fields)) {
            return false; 
        }

        $stmt = $this->db->prepare("
            UPDATE user
            SET " . implode(', ', $fields) . "
            WHERE user_id = :user_id
        ");

        return $stmt->execute($params);
    }

    public function findAll(int $excludeUserId): array
    {
        $stmt = $this->db->prepare("
            SELECT user_id, name, email, profile_image, bio
            FROM user
            WHERE user_id != :user_id
            ORDER BY name ASC
        ");
        $stmt->execute([':user_id' => $excludeUserId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
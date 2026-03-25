<?php

require_once __DIR__ .'/../core/Database.php';

class FollowModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function follow(int $followerId, int $followingId): bool
    {
        $stmt = $this->db->prepare("
            INSERT IGNORE INTO follow (follower_id, following_id)
            VALUES (:follower_id, :following_id)
        ");

        return $stmt->execute([
            ':follower_id' => $followerId,
            ':following_id'=> $followingId
        ]);
    }

    public function unfollow(int $followerId, int $followingId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM follow
            WHERE follower_id = :follower_id
            AND following_id = :following_id
        ");

        $stmt->execute([
            ':follower_id' => $followerId,
            ':following_id'=> $followingId,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function isFollowing(int $followerId, int $followingId): bool
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM follow
            WHERE follower_id = :follower_id
            AND following_id = :following_id
        ");

        $stmt->execute([
            ':follower_id' => $followerId,
            ':following_id'=> $followingId
        ]);

        return (int) $stmt->fetchColumn() > 0;
    }

    public function getFollowers(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT u.user_id, u.name, u.profile_image
            FROM follow f
            JOIN user u ON f.follower_id = u.user_id
            WHERE f.following_id = :user_id
        ");

        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetchAll();
    }

    public function getFollowing(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT u.user_id, u.name, u.profile_image
            FROM follow f
            JOIN user u ON f.following_id = u.user_id
            WHERE f.follower_id = :user_id
        ");

        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetchAll();
    }
}
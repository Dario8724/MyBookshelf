<?php

require_once __DIR__ . '/../core/Database.php';

class PostModel
{
    public PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(int $userId, string $content, ?int $reviewId = null): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO post (user_id, content, review_id)
            VALUES (:user_id, :content, :review_id)
        ");

        $stmt->execute([
            ':user_id'  => $userId,
            ':content'  => $content,
            ':review_id'=> $reviewId
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function getFeed(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT p.post_id, p.content, p.created_at,
                   u.user_id, u.name, u.profile_image,
                   r.review_text, r.has_spoiler,
                   COUNT(DISTINCT pl.user_id) AS total_likes,
                   COUNT(DISTINCT pc.comment_id) AS total_comments
            FROM post p
            JOIN user u ON p.user_id = u.user_id
            LEFT JOIN review r ON p.review_id = r.review_id
            LEFT JOIN post_like pl ON p.post_id = pl.post_id
            LEFT JOIN post_comment pc ON p.post_id = pc.post_id
            WHERE p.user_id IN(
                SELECT following_id FROM follow WHERE follower_id = :user_id
            )
            OR p.user_id = :user_id2
            GROUP BY p.post_id
            ORDER BY p.created_at DESC
            LIMIT 35
        ");

        $stmt->execute([
            ':user_id'  => $userId,
            ':user_id2' => $userId,
        ]);

        return $stmt->fetchAll();
    }

    public function delete(int $postId, int $userId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM post
            WHERE post_id = :post_id
            AND user_id = :user_id
        ");

        $stmt->execute([
            ':post_id' => $postId,
            ':user_id'=> $userId,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function toggleLike(int $postId, int $userId): bool
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM post_like
            WHERE post_id = :post_id
            AND user_id = :user_id
        ");

        $stmt->execute([
            ':post_id' => $postId,
            ':user_id' => $userId,
        ]);

        $exists = (int) $stmt->fetchColumn() > 0;

        if ($exists) {
            $stmt = $this->db->prepare("
                DELETE FROM post_like
                WHERE post_id = :post_id
                AND user_id = :user_id
            ");
            $stmt->execute([
                ':post_id' => $postId,
                ':user_id' => $userId,
            ]);
            return false;
        }else{
            $stmt = $this->db->prepare("
                INSERT INTO post_like (post_id, user_id)
                VALUES (:post_id, :user_id) 
            ");
            $stmt->execute([
                ':post_id' => $postId,
                ':user_id'=> $userId,
            ]);
            return true;
        }
    }

    public function addComment(int $postId, int $userId, string $comment): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO post_comment (post_id, user_id, comment)
            VALUES (:post_id, :user_id, :comment) 
        ");

        $stmt->execute([
            ':post_id' => $postId,
            ':user_id' => $userId,
            'comment'  => $comment,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function getComments(int $postId): array
    {
        $stmt = $this->db->prepare("
            SELECT pc.comment_id, pc.comment, pc.created_at,
                   u.user_id, u.name, u.profile_image
            FROM post_comment pc
            JOIN user u ON pc.user_id = u.user_id
            WHERE pc.post_id = :post_id
            ORDER BY pc.created_at ASC
        ");

        $stmt->execute([':post_id' => $postId]);
        return $stmt->fetchAll();
    }
}
<?php

require_once __DIR__ . '/../core/Database.php';

class AchievementModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getByUser(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT
                a.achivement_id,
                a.name,
                a.description,
                a.icon,
                a.condition_type,
                a.condition_value,
                ua.user_id IS NOT NULL AS earned
            FROM achievement a
            LEFT JOIN user_achievement ua
                ON ua.achievement_id = a.achievement_id
                AND ua.user_id = :user_id
            ORDER BY earned DESC, a.condition_value ASC
        ");

        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetchAll();
    }

    public function award(int $userId, int $achievementId): bool
    {
        $stmt = $this->db->prepare("
            INSERT IGNORE INTO user_achievement (user_id, achievement_id)
            VALUES (:user_id, :achievement_id)
        ");

        return $stmt->execute([
            ':user_id'          => $userId,
            ':achievement_id'   => $achievementId
        ]);
    }

    public function checkAndAward(int $userId): array
    {
        $awarded = [];

        $stats = $this->getUserStats($userId);

        $stmt = $this->db->prepare("
            SELECT a.* FROM achievement a
            WHERE a.achievement_id NOT IN(
                SELECT achievement_id FROM user_achievement WHERE user_id = :user_id
            )
         ");

         $stmt->execute([':user_id' => $userId]);
         $pending = $stmt->fetchAll();

         foreach ($pending as $achievement) {
            $value = $stats[$achievement['condition_type']] ?? 0;

            if ($value >= $achievement['condition_type']) {
                $this->award($userId, $achievement['achievement_id']);
                $awarded[] = $achievement;
            }
         }


         return $awarded;
    }

    private function getUserStats(int $userId): array
    {
        $stats = [];

        //Livros adicionados
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM user_book WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $stats['books_added'] = (int) $stmt->fetchColumn();

        //Livros completados
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM user_book WHERE user_id = :user_id AND status = 'completed'");
        $stmt->execute([':user_id' => $userId]);
        $stats['books_completed'] = (int) $stmt->fetchColumn();

        //Reviews escritas
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM follow WHERE follower_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $stats['following'] = (int) $stmt->fetchColumn();

        //A seguir
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM follow WHERE follower_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $stats['following'] = (int) $stmt->fetchColumn();

        //Seguidores
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM follow WHERE following_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $stats['followers'] = (int) $stmt->fetchColumn();

        //Metas criadas
        $stmt = $this->db->prepare("SELECT COUNT(*) FROM reading_goal WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $userId]);
        $stats['goals_created'] = (int) $stmt->fetchColumn();

        //Metas concluídas
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM reading_goal rg
            WHERE rg.user_id = :user:id
            AND (
                SELECT COUNT(*) FROM user_book ub
                WHERE ub.user_id = rg.user_id
                AND ub.status = 'completed'
                AND ub.updated_at BETWEEN rg.start_date AND rg.end_date
            ) >= rg.target_value
        ");
        $stmt->execute([':user_id' => $userId]);
        $stats['goals_completed'] = (int) $stmt->fetchColumn();

        return $stats;
    }
}
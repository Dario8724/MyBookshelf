<?php

require_once __DIR__ . '/../core/Database.php';

class ReadingGoalModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(int $userId, string $goalType, int $targetValue, string $startDate, string $endDate) : int
    {
        $stmt = $this->db->prepare("
            INSERT INTO reading_goals (user_id, goal_type, target_value, start_date, end_date)
            VALUES (:user_id, :goal_type, :target_value, :start_date, :end_date)
        ");

        $stmt->execute([
            ':user_id'      => $userId,
            ':goal_type'    => $goalType,
            ':target_value' => $targetValue,
            ':start_date'   => $startDate,
            ':end_date'     => $endDate
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function getByUser(int $userId) : array
    {
        $stmt = $this->db->prepare("
            SELECT 
                rg.reading_goal_id,
                rg.goal_type,
                rg.target_value,
                rg.start_date,
                rg.end_date,
                COUNT(ub.user_book_id) AS current_value
            FROM reading_goals rg
            LEFT JOIN user_book ub
                ON ub.user_id = rg.user_id
                AND ub.status = 'completed'
                AND ub.updated_date BETWEEN rg.start_date AND rg.end_date
            WHERE rg.user_id = :user_id
            GROUP BY rg.reading_goal_id
            ORDER BY rg.start_date DESC
        ");

        $stmt->execute([':user_id' => $userId]);

        return $stmt->fetchAll();
    }

    public function delete(int $goalId, int $userId) : bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM reading_goals 
            WHERE reading_goal_id = :goal_id 
            AND user_id = :user_id
        ");

        $stmt->execute([
            ':goal_id' => $goalId,
            ':user_id' => $userId
        ]);

        return $stmt->rowCount() > 0;
    }
}
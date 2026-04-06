<?php

require_once __DIR__ . '/../core/Database.php';

class ClubVoteModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function create(int $clubId, string $title, string $startDate, string $endDate): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO club_reading_vote (club_id, title, start_date, end_date, status)
            VALUES (:club_id, :title, :start_date, :end_date, 'open')
        ");

        $stmt->execute([
            ':club_id'    => $clubId,
            ':title'      => $title,
            ':start_date' => $startDate,
            ':end_date'   => $endDate,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function addOption(int $voteId, int $bookId, int $suggestedBy): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO club_reading_vote_option (vote_id, book_id, suggested_by)
            VALUES (:vote_id, :book_id, :suggested_by)
        ");

        $stmt->execute([
            ':vote_id'      => $voteId,
            ':book_id'      => $bookId,
            ':suggested_by' => $suggestedBy,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function castVote(int $voteId, int $optionId, int $userId): void
    {
        // Verifica se já votou
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM club_reading_vote_user
            WHERE vote_id = :vote_id AND user_id = :user_id
        ");

        $stmt->execute([':vote_id' => $voteId, ':user_id' => $userId]);

        if ($stmt->fetchColumn() > 0) {
            throw new Exception('Já votaste nesta votação.');
        }

        $stmt = $this->db->prepare("
            INSERT INTO club_reading_vote_user (vote_id, option_id, user_id)
            VALUES (:vote_id, :option_id, :user_id)
        ");

        $stmt->execute([
            ':vote_id'   => $voteId,
            ':option_id' => $optionId,
            ':user_id'   => $userId,
        ]);
    }

    public function getByClub(int $clubId): array
    {
        $stmt = $this->db->prepare("
            SELECT v.*, 
                   COUNT(vu.user_id) AS total_votes
            FROM club_reading_vote v
            LEFT JOIN club_reading_vote_user vu ON v.vote_id = vu.vote_id
            WHERE v.club_id = :club_id
            GROUP BY v.vote_id
            ORDER BY v.start_date DESC
        ");

        $stmt->execute([':club_id' => $clubId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
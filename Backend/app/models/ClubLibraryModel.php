<?php

require_once __DIR__ . '/../core/Database.php';

class ClubLibraryModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function addBook(int $clubId, int $bookId, int $addedBy): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO club_library (club_id, book_id, added_by, added_date)
            VALUES (:club_id, :book_id, :added_by, CURDATE())
        ");

        $stmt->execute([
            ':club_id'  => $clubId,
            ':book_id'  => $bookId,
            ':added_by' => $addedBy,
        ]);

        return (int) $this->db->lastInsertId();
    }

    public function removeBook(int $clubLibraryId, int $clubId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM club_library
            WHERE club_library_id = :club_library_id AND club_id = :club_id
        ");

        $stmt->execute([
            ':club_library_id' => $clubLibraryId,
            ':club_id'         => $clubId,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function getByClub(int $clubId): array
    {
        $stmt = $this->db->prepare("
            SELECT cl.club_library_id, cl.added_date,
                   b.book_id, b.title, b.author, b.cover,
                   u.name AS added_by_name
            FROM club_library cl
            JOIN book b ON cl.book_id = b.book_id
            JOIN user u ON cl.added_by = u.user_id
            WHERE cl.club_id = :club_id
            ORDER BY cl.added_date DESC
        ");

        $stmt->execute([':club_id' => $clubId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function exists(int $clubId, int $bookId): bool
    {
        $stmt = $this->db->prepare("
            SELECT COUNT(*) FROM club_library
            WHERE club_id = :club_id AND book_id = :book_id
        ");

        $stmt->execute([
            ':club_id' => $clubId,
            ':book_id' => $bookId,
        ]);

        return (bool) $stmt->fetchColumn();
    }
}   
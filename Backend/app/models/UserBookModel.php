<?php

require_once __DIR__ . '/../core/Database.php';

class UserBookModel
{
    private PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    public function addBook(int $userId, int $bookId, string $status): bool
    {
        // Se status = completed e já existe um total_pages, marca current_page = total_pages
        if ($status === 'completed') {
            $stmt = $this->db->prepare("
                INSERT INTO user_book (user_id, book_id, status, current_page, total_pages)
                VALUES (:user_id, :book_id, :status, 0, NULL)
                ON DUPLICATE KEY UPDATE
                    status = :status2,
                    current_page = COALESCE(total_pages, current_page)
            ");
        } else {
            $stmt = $this->db->prepare("
                INSERT INTO user_book (user_id, book_id, status)
                VALUES (:user_id, :book_id, :status)
                ON DUPLICATE KEY UPDATE status = :status2
            ");
        }

        return $stmt->execute([
            ':user_id' => $userId,
            ':book_id' => $bookId,
            ':status'  => $status,
            ':status2' => $status,
        ]);
    }

    public function removeBook(int $userId, int $bookId): bool
    {
        $stmt = $this->db->prepare("
            DELETE FROM user_book
            WHERE user_id = :user_id
            AND book_id = :book_id
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':book_id' => $bookId,
        ]);

        return $stmt->rowCount() > 0;
    }

    public function getStatus(int $userId, int $bookId): ?array
    {
        $stmt = $this->db->prepare("
            SELECT status, favorite, current_page, total_pages
            FROM user_book
            WHERE user_id = :user_id
            AND book_id = :book_id
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':book_id' => $bookId,
        ]);

        $result = $stmt->fetch();
        return $result ?: null;
    }

    public function updateProgress(int $userId, int $bookId, int $currentPage, ?int $totalPages = null): array
    {
        // Buscar registo atual
        $existing = $this->getStatus($userId, $bookId);

        if (!$existing) {
            // Se não existe, cria com status 'reading'
            $stmt = $this->db->prepare("
                INSERT INTO user_book (user_id, book_id, status, current_page, total_pages)
                VALUES (:user_id, :book_id, 'reading', :current_page, :total_pages)
            ");
            $stmt->execute([
                ':user_id'      => $userId,
                ':book_id'      => $bookId,
                ':current_page' => $currentPage,
                ':total_pages'  => $totalPages,
            ]);
            $existing = ['status' => 'reading', 'total_pages' => $totalPages];
        }

        // Se total_pages não foi passado, mantém o existente
        $finalTotal = $totalPages ?? $existing['total_pages'] ?? null;

        // Se atingiu 100% e existe total, marca como completed automaticamente
        $newStatus = $existing['status'];
        $autoCompleted = false;

        if ($finalTotal !== null && $currentPage >= $finalTotal) {
            $currentPage = $finalTotal; // não passa de 100%
            if ($newStatus !== 'completed') {
                $newStatus = 'completed';
                $autoCompleted = true;
            }
        }

        $stmt = $this->db->prepare("
            UPDATE user_book
            SET current_page = :current_page,
                total_pages = :total_pages,
                status = :status
            WHERE user_id = :user_id
            AND book_id = :book_id
        ");

        $stmt->execute([
            ':current_page' => $currentPage,
            ':total_pages'  => $finalTotal,
            ':status'       => $newStatus,
            ':user_id'      => $userId,
            ':book_id'      => $bookId,
        ]);

        return [
            'current_page'   => $currentPage,
            'total_pages'    => $finalTotal,
            'status'         => $newStatus,
            'auto_completed' => $autoCompleted,
        ];
    }

    public function getLibrary(int $userId): array
    {
        $stmt = $this->db->prepare("
            SELECT b.book_id, b.title, b.author, b.cover,
                   b.publication_year, b.publisher,
                   ub.status, ub.favorite, ub.current_page, ub.total_pages,
                   GROUP_CONCAT(g.name SEPARATOR ', ') AS genres
            FROM user_book ub
            JOIN book b ON ub.book_id = b.book_id
            LEFT JOIN book_genre bg ON b.book_id = bg.book_id
            LEFT JOIN genre g ON bg.genre_id = g.genre_id
            WHERE ub.user_id = :user_id
            GROUP BY b.book_id, ub.status, ub.favorite, ub.current_page, ub.total_pages
            ORDER BY ub.status ASC
        ");

        $stmt->execute([':user_id' => $userId]);
        return $stmt->fetchAll();
    }

    public function toggleFavorite(int $userId, int $bookId): ?bool
    {
        $stmt = $this->db->prepare("
            SELECT favorite FROM user_book
            WHERE user_id = :user_id
            AND book_id = :book_id
        ");

        $stmt->execute([
            ':user_id' => $userId,
            ':book_id' => $bookId,
        ]);

        $result = $stmt->fetch();

        if (!$result) {
            return null;
        }

        $newValue = $result['favorite'] ? 0 : 1;

        $stmt = $this->db->prepare("
            UPDATE user_book
            SET favorite = :favorite
            WHERE user_id = :user_id
            AND book_id = :book_id
        ");

        $stmt->execute([
            ':favorite' => $newValue,
            ':user_id'  => $userId,
            ':book_id'  => $bookId,
        ]);

        return (bool) $newValue;
    }
}
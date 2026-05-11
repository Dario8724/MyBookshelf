<?php

require_once __DIR__ . "/../core/Controller.php";
require_once __DIR__ . "/../models/UserBookModel.php";
require_once __DIR__ . "/../middleware/AuthMiddleware.php";

class UserBookController extends Controller
{
    private UserBookModel $userBookModel;

    public function __construct()
    {
        $this->userBookModel = new UserBookModel();
    }

    public function addBook(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userid = $payload['user_id'];

        $body = $this->getBody();
        $bookId = (int) ($body['book_id'] ?? 0);
        $status = trim($body['status'] ?? '');

        $validStatuses = ['reading', 'completed', 'want_to_read'];

        if (empty($bookId)) {
            $this->error('O book_id é obrigatório.', 422);
        }

        if (!in_array($status, $validStatuses)) {
            $this->error('Status inválido. Use "reading", "completed" ou "want to read".', 422);
        }

        $this->userBookModel->addBook($userid, $bookId, $status);

        // Verifica se completou alguma meta ao marcar livro como lido
        if ($status === 'completed') {
            require_once __DIR__ . '/../models/ReadingGoalModel.php';
            require_once __DIR__ . '/../models/ClubRankingModel.php';
            require_once __DIR__ . '/../models/ClubSeasonModel.php';
            require_once __DIR__ . '/../models/ClubModel.php';

            $goalModel = new ReadingGoalModel();
            $seasonModel = new ClubSeasonModel();
            $rankingModel = new ClubRankingModel();
            $clubModel = new ClubModel();

            $goals = $goalModel->getByUser($userid);
            foreach ($goals as $goal) {
                $progress = (int) $goal['current_value'];
                $target = (int) $goal['target_value'];

                // Se acabou de atingir o objetivo (progresse == target)
                if ($progress >= $target && !$goal['rewarded']) {
                    $season = $seasonModel->getCurrent();
                    if ($season) {
                        $clubs = $clubModel->getByUser($userid);
                        foreach ($clubs as $club) {
                            $rankingModel->addPoints($season['season_id'], $club['club_id'], 15);
                        }
                        // Marca a meta como recompensada
                        $goalModel->markAsRewarded($goal['reading_goal_id']);
                    }
                    break;
                }
            }
        }

        $this->success(null, 'Livro adicionado à biblioteca com sucesso.', 201);
    }

    public function removeBook(int $bookId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userid = $payload['user_id'];

        $removed = $this->userBookModel->removeBook($userid, $bookId);

        if (!$removed) {
            $this->error('Livro não encontrado na tua biblioteca.', 404);
        }

        $this->success(null, 'Livro removido da biblioteca com sucesso.');
    }

    public function getStatus(int $bookID): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userid = $payload['user_id'];

        $data = $this->userBookModel->getStatus($userid, $bookID);

        if (!$data) {
            $this->success(['status' => null]);
            return;
        }

        $this->success([
            'status' => $data['status'],
            'favorite' => (bool) $data['favorite'],
            'current_page' => (int) $data['current_page'],
            'total_pages' => $data['total_pages'] !== null ? (int) $data['total_pages'] : null,
        ]);
    }

    public function getLibrary(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userid = $payload['user_id'];

        $books = $this->userBookModel->getLibrary($userid);

        if (empty($books)) {
            $this->success([], 'A tua biblioteca está vazia.');
        }

        $this->success([
            'total' => count($books),
            'books' => $books,
        ], 'Biblioteca carregada com sucesso.');
    }

    public function toggleFavorite(int $bookId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userid = $payload['user_id'];

        $result = $this->userBookModel->toggleFavorite($userid, $bookId);

        if ($result === null) {
            $this->error('Livro não encontrado na tua biblioteca', 404);
        }

        $message = $result ? 'Livro adicionado aos favoritos.' : 'Livro removido dos favoritos.';

        $this->success(['favorite' => $result], $message);
    }

    public function updateProgress(int $bookId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $body = $this->getBody();
        $currentPage = (int) ($body['current_page'] ?? 0);
        $totalPages = isset($body['total_pages']) ? (int) $body['total_pages'] : null;

        if ($currentPage < 0) {
            $this->error('A página atual não pode ser negativa.', 422);
        }

        if ($totalPages !== null && $totalPages < 1) {
            $this->error('O total de páginas deve ser pelo menos 1.', 422);
        }

        if ($totalPages !== null && $currentPage > $totalPages) {
            $this->error('A página atual não pode ser maior que o total.', 422);
        }

        $result = $this->userBookModel->updateProgress($userId, $bookId, $currentPage, $totalPages);

        $this->success($result, 'Progresso atualizado com sucesso.');
    }

    public function getFriendsReading(int $bookId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $friends = $this->userBookModel->getFriendsReading($userId, $bookId);

        $this->success([
            'total' => count($friends),
            'friends' => $friends,
        ], 'Amigos a ler carregados com sucesso.');
    }

}
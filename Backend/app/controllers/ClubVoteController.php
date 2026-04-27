<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ClubVoteModel.php';
require_once __DIR__ . '/../models/ClubModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClubVoteController extends Controller
{
    private ClubVoteModel $voteModel;
    private ClubModel $clubModel;
    private \PDO $db;

    public function __construct()
    {
        $this->voteModel = new ClubVoteModel();
        $this->clubModel = new ClubModel();
        $this->db = \Database::getInstance()->getConnection();
    }

    public function create(int $clubId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $club = $this->clubModel->findById($clubId);
        if (!$club) {
            $this->error('Clube não encontrado.', 404);
        }

        if (!$this->clubModel->isMember($clubId, $userId)) {
            $this->error('Tens de ser membro do clube.', 403);
        }

        $body = $this->getBody();
        $title = trim($body['title'] ?? '');
        $startDate = trim($body['start_date'] ?? '');
        $endDate = trim($body['end_date'] ?? '');

        if (empty($title) || empty($startDate) || empty($endDate)) {
            $this->error('O título e as datas são obrigatórios.', 422);
        }

        $voteId = $this->voteModel->create($clubId, $title, $startDate, $endDate);

        $this->success(['vote_id' => $voteId], 'Votação criada com sucesso.', 201);
    }

    public function addOption(int $voteId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $body = $this->getBody();
        $bookId = (int) ($body['book_id'] ?? 0);

        if (empty($bookId)) {
            $this->error('O book_id é obrigatório.', 422);
        }

        $optionId = $this->voteModel->addOption($voteId, $bookId, $userId);

        $this->success(['option_id' => $optionId], 'Opção adicionada com sucesso.', 201);
    }

    public function castVote(int $voteId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $body = $this->getBody();
        $optionId = (int) ($body['option_id'] ?? 0);

        if (empty($optionId)) {
            $this->error('O option_id é obrigatório.', 422);
        }

        try {
            $this->voteModel->castVote($voteId, $optionId, $userId);

            // +3 pontos por participar na votação
            require_once __DIR__ . '/../models/ClubRankingModel.php';
            require_once __DIR__ . '/../models/ClubSeasonModel.php';

            $vote = $this->voteModel->findById($voteId);
            if ($vote) {
                $seasonModel = new ClubSeasonModel();
                $rankingModel = new ClubRankingModel();
                $season = $seasonModel->getCurrent();
                if ($season) {
                    $rankingModel->addPoints($season['season_id'], $vote['club_id'], 3);
                }
            }

            $this->success(null, 'Voto registado com sucesso.', 201);
        } catch (Exception $e) {
            $this->error($e->getMessage(), 409);
        }
    }

    public function index(int $clubId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $club = $this->clubModel->findById($clubId);
        if (!$club) {
            $this->error('Clube não encontrado.', 404);
        }

        $votes = $this->voteModel->getByClub($clubId);

        // Busca as opções com títulos dos livros para cada votação
        foreach ($votes as &$vote) {
            $stmt = $this->db->prepare("
            SELECT o.option_id, o.book_id, b.title, b.cover, b.author,
                   COUNT(vu.user_id) AS total_votes,
                   MAX(CASE WHEN vu.user_id = :user_id THEN 1 ELSE 0 END) AS user_voted
            FROM club_reading_vote_option o
            JOIN book b ON o.book_id = b.book_id
            LEFT JOIN club_reading_vote_user vu ON vu.vote_id = o.vote_id AND vu.option_id = o.option_id
            WHERE o.vote_id = :vote_id
            GROUP BY o.option_id
        ");
            $stmt->execute([':vote_id' => $vote['vote_id'], ':user_id' => $userId]);
            $vote['options'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Verifica se o utilizador já votou
            $stmtVoted = $this->db->prepare("
            SELECT option_id FROM club_reading_vote_user 
            WHERE vote_id = :vote_id AND user_id = :user_id
        ");
            $stmtVoted->execute([':vote_id' => $vote['vote_id'], ':user_id' => $userId]);
            $voted = $stmtVoted->fetch(PDO::FETCH_ASSOC);
            $vote['user_voted_option'] = $voted ? (int) $voted['option_id'] : null;
        }

        $this->success([
            'total' => count($votes),
            'votes' => $votes,
        ]);
    }
}
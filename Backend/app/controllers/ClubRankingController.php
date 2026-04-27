<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ClubRankingModel.php';
require_once __DIR__ . '/../models/ClubModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClubRankingController extends Controller
{
    private ClubRankingModel $rankingModel;
    private ClubModel $clubModel;

    public function __construct()
    {
        $this->rankingModel = new ClubRankingModel();
        $this->clubModel = new ClubModel();
    }

    public function index(int $clubId): void
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

        $ranking = $this->rankingModel->getByClub($clubId);

        $this->success([
            'total' => count($ranking),
            'ranking' => $ranking,
        ]);
    }

    public function globalRanking(): void
    {
        $payload = AuthMiddleware::requireAuth();

        require_once __DIR__ . '/../models/ClubSeasonModel.php';
        $seasonModel = new ClubSeasonModel();
        $season = $seasonModel->getCurrent();

        if (!$season) {
            $this->error('Nenhuma season activa.', 404);
        }

        $ranking = $this->rankingModel->getGlobalRanking($season['season_id']);

        $this->success([
            'season' => $season,
            'total' => count($ranking),
            'ranking' => $ranking,
        ]);
    }
}
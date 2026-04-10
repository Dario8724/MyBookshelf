<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ClubSeasonModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClubSeasonController extends Controller
{
    private ClubSeasonModel $seasonModel;

    public function __construct()
    {
        $this->seasonModel = new ClubSeasonModel();
    }

    public function create(): void
    {
        $payload = AuthMiddleware::requireAuth();

        $body      = $this->getBody();
        $startDate = trim($body['start_date'] ?? '');
        $endDate   = trim($body['end_date']   ?? '');

        if (empty($startDate) || empty($endDate)) {
            $this->error('As datas de início e fim são obrigatórias.', 422);
        }

        $seasonId = $this->seasonModel->create($startDate, $endDate);

        $this->success(['season_id' => $seasonId], 'Temporada criada com sucesso.', 201);
    }

    public function index(): void
    {
        $payload = AuthMiddleware::requireAuth();

        $seasons = $this->seasonModel->getAll();

        $this->success([
            'total'   => count($seasons),
            'seasons' => $seasons,
        ]);
    }

    public function current(): void
    {
        $payload = AuthMiddleware::requireAuth();

        $season = $this->seasonModel->getCurrent();

        if (!$season) {
            $this->error('Nenhuma temporada activa no momento.', 404);
        }

        $ranking = $this->seasonModel->getRanking($season['season_id']);

        $this->success([
            'season'  => $season,
            'ranking' => $ranking,
        ]);
    }

    public function ranking(int $seasonId): void
    {
        $payload = AuthMiddleware::requireAuth();

        $ranking = $this->seasonModel->getRanking($seasonId);

        if (empty($ranking)) {
            $this->error('Nenhum ranking encontrado para esta temporada.', 404);
        }

        $this->success([
            'total'   => count($ranking),
            'ranking' => $ranking,
        ]);
    }
}
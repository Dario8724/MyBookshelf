<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/AchievementModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class AchievementController extends Controller
{
    private AchievementModel $achievementModel;

    public function __construct()
    {
        $this->achievementModel = new AchievementModel();
    }

    public function index(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $achievements = $this->achievementModel->getByUser($userId);

        $earned = array_filter($achievements, fn($a)   => (int)$a['earned'] === 1);
        $pending = array_filter($achievements, fn($a)  => (int)$a['earned'] === 0);

        $this->success([
            'total_earned'  => count($earned),
            'total_pending' => count($pending),
            'achievements'  => array_values($achievements),
        ], 'Conquistas carregadas com sucesso.');
    }

    public function check(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $awarded = $this->achievementModel->checkAndAward($userId);

        if (empty($awarded)) {
            $this->success([
                'new_achievements' => [],
            ], 'Nenhuma conquista nova.');
            return;
        }

        $this->success([
            'new_achievements' => $awarded,
        ], count($awarded) . ' nova(s) conquista(s) desbloqueada(s)!');
    }
}
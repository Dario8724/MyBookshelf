<?php

require_once __DIR__ .'/../core/Controller.php';
require_once __DIR__ .'/../models/ReadingGoalModel.php';
require_once __DIR__ .'/../middleware/AuthMiddleware.php';

class ReadingGoalController extends Controller 
{
    private ReadingGoalModel $goalModel;

    public function __construct()
    {
        $this->goalModel = new ReadingGoalModel();
    }

    public function create(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $body        = $this->getBody();
        $goalType    = trim($body['goal_type'] ?? '');
        $targetvalue = (int) ($body['target_value'] ?? 0);
        $year        = (int) ($body['year'] ?? date('Y'));
        $semester    = (int) ($body['semester'] ?? 0);

        $validTypes = ['annual', 'semester'];

        if (!in_array($goalType, $validTypes)) {
            $this->error('Tipo de meta inválida. Use annual ou semester.', 422);
        }

        if ($targetvalue < 1) {
            $this->error('O objetivo deve ser de pelo menos 1 livro.', 422);
        }

        if ($goalType === 'annual') {
            $startDate = "$year-01-01";
            $endDate   = "$year-12-31";
        } else {
            if (!in_array($semester, [1, 2])) {
                $this->error('O semestre deve ser 1 ou 2.', 422);
            }
            if ($semester === 1) {
                $startDate = "$year-01-01";
                $endDate   = "$year-06-30";
            } else {
                $startDate = "$year-07-01";
                $endDate   = "$year-12-31";
            }
        }

        $goalId = $this->goalModel->create($userId, $goalType, $targetvalue, $startDate, $endDate);

        $this->success([
            'reading_goal_id'   => $goalId,
            'goal_type'         => $goalType,
            'target_value'      => $targetvalue,
            'start_date'        => $startDate,
            'end_date'          => $endDate,
        ], 'Meta criada com sucesso.', 201);
    }

    public function index(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $goals = $this->goalModel->getByUser($userId);

        $goals = array_map(function($goal) {
            $goal['progress']   = (int) $goal['current_value'];
            $goal['percentage'] = $goal['target_value'] > 0
                ? min(100, round(($goal['current_value'] / $goal['target_value']) * 100))
                : 0;
            $goal['completed']  = $goal['current_value'] >= $goal['target_value'];
            $goal['label']      = $goal['goal_type'] === 'annual' ? 'Anual' : 'Semestral';
            return $goal;
        }, $goals);

        $this->success([
            'total' => count($goals),
            'goals' => $goals,
        ], 'Metas carregadas com sucesso.');
    }

    public function delete(int $goalId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId  = $payload['user_id'];

        $deleted = $this->goalModel->delete($userId, $goalId);

        if (!$deleted) {
            $this->success('Meta não encontrada ou sem permissão para apagar.', 404);
        } 
        
        $this->success(null, 'Meta apagada com sucesso.');
    }
}
<?php

require_once __DIR__ .'/../core/Controller.php';
require_once __DIR__ .'/../models/FollowModel.php';
require_once __DIR__ .'/../middleware/AuthMiddleware.php';

class FollowController extends Controller
{
    private FollowModel $followModel;

    public function __construct()
    {
        $this->followModel = new FollowModel();
    }

    public function follow(int $userId): void
    {
        $payload    = AuthMiddleware::requireAuth();
        $followerId = $payload['user_id'];

        if ($followerId === $userId) {
            $this->error('Não podes seguir-te a ti próprio', 422);
        }

        if ($this->followModel->isFollowing($followerId, $userId)) {
            $this->error('Já estás a seguir este utilizador',409);
        }

        $this->followModel->follow($followerId, $userId);

        $this->success(null, 'Utilizador seguido com sucesso.');
    }
    
    public function unfollow(int $userId): void
    {
        $payload    = AuthMiddleware::requireAuth();
        $followerId = $payload['user_id'];

        $result = $this->followModel->unfollow($followerId, $userId);

        if (!$result){
            $this->error('Não estás a seguir este utilizador.', 404);
        }

        $this->success(null,'Deixaste de seguir o utilizador.');
    }

    public function followers(int $userId): void
    {
        $followers = $this->followModel->getFollowers($userId);

        $this->success([
            'total'     => count($followers),
            'followers' => $followers,
        ], 'Seguidores carregados com sucesso.');
    }

    public function following(int $userId): void
    {
        $following = $this->followModel->getFollowing($userId);

        $this->success([
            'total' => count($following),
            'following'=> $following,
        ],'A seguir carregados com sucesso.');
    }
}
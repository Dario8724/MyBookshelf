<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/PostModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class PostController extends Controller
{
    private PostModel $postModel;

    public function __construct()
    {
        $this->postModel = new PostModel();
    }

    public function create(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId  = $payload['user_id'];

        $body     = $this->getBody();
        $content  = trim($body['content'] ?? '');
        $reviewId = isset($body['review_id']) ? (int) $body['review_id'] : null;

        if (empty($content)) {
            $this->error('O conteúdo do post é obrigatório.', 422);
        }

        if (strlen($content) > 500){
            $this->error('O posto não pode ter mais de 500 caracteres.', 422);
        }

        $postId = $this->postModel->create($userId, $content, $reviewId);

        $this->success(['post_id' => $postId], 'Post criado com sucesso.', 201);
    }

    public function getFeed(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $posts = $this->postModel->getFeed($userId);

        $this->success([
            'total' => count($posts),
            'posts' => $posts,
        ], 'Feed carregado com sucesso.');
    }

    public function delete(int $postId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $deleted = $this->postModel->delete($postId, $userId);

        if (!$deleted) {
            $this->error('Post não encontrado ou sem permissão para apagar', 404);
        }

        $this->success(null, 'Post apagado com sucesso.');
    }

    public function toggleLike(int $postId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $liked = $this->postModel->toggleLike($postId, $userId);

        $message = $liked ? 'Like adicionado.' : 'Like removido.';

        $this->success(['liked' => $liked], $message);
    }

    public function addComment(int $postId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $body    = $this->getBody();
        $comment = trim($body['comment'] ?? '');

        if (empty($comment)) {
            $this->error('O comentário não pode estar vazio.',422);
        }

        if (strlen($comment) > 300) {
            $this->error('O comentário não pode ter mais de 300 caracteres',422);
        }

        $commentId = $this->postModel->addComment($postId, $userId, $comment);

        $this->success(['comment_id' => $commentId], 'Comentário adicionado com sucesso.', 201);
    }

    public function getComments(int $postId): void
    {
        $comments = $this->postModel->getComments($postId);

        $this->success([
            'total'    => count($comments),
            'comments' => $comments,
        ], 'Commentários carregados com sucesso.');
    }
}
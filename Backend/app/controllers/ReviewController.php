<?php

require_once __DIR__ .'/../core/Controller.php';
require_once __DIR__ .'/../models/ReviewModel.php';
require_once __DIR__ .'/../models/RatingModel.php';
require_once __DIR__ .'/../middleware/AuthMiddleware.php';

class ReviewController extends Controller
{
    private ReviewModel $reviewModel;
    private RatingModel $ratingModel;

    public function __construct()
    {
        $this->reviewModel = new ReviewModel();
        $this->ratingModel = new RatingModel();
    }

    public function create(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId  = $payload['user_id'];

        $body       = $this->getBody();
        $bookId     = (int)  ($body['book_id'] ?? 0);
        $reviewText = trim( $body['review_text'] ?? '');
        $score      = isset($body['score']) ? (float) $body['score'] :null;

        if (empty($bookId)) {
            $this->error('O book_id é obrigatório', 422);
        }

        if (empty($reviewText)) {
            $this->error('O texto da review é obrigatório',422);
        }

        if ($score !== null && ($score <1 || $score > 5)) {
            $this->error('A nota deve ser entre 1 e 5',422);
        }

        $reviewId = $this->reviewModel->create($userId, $bookId, $reviewText);

        if ($score !== null) {
            $this->ratingModel->rate($userId, $bookId, $score);
        }

        $this->success([
            'review_id'=> $reviewId,
        ], 'Review criada com sucesso', 201);
    }

    public function getByBook(int $bookId): void
    {
        $reviews = $this->reviewModel->getByBook($bookId);
        $average = $this->ratingModel->getAverageScore($bookId);

        $this->success([
            'average_score' => $average,
            'total_reviews' => count($reviews),
            'reviews'       => $reviews,
        ], 'Reviews carregadas com sucesso.');
    }

    public function delete(int $reviewId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $deleted = $this->reviewModel->delete($reviewId, $userId);

        if (!$deleted){
            $this->error('Review não encontrada ou sem permissão para apagar.', 404);
        }

        $this->success(null, 'Review apagada com sucesso.');
    }

    public function rate(): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId = $payload['user_id'];

        $body   = $this->getBody();
        $bookId = (int) ($body['book_id'] ?? 0);
        $score  = (float) ($body['score'] ?? 0);

        if (empty($bookId)) {
            $this->error('O book_id é obrigatório', 422);
        }

        if ($score < 1 || $score > 5) {
            $this->error('A nota deve ser entre 1 e 5', 422);
        }

        $this->ratingModel->rate($userId, $bookId, $score);

        $average = $this->ratingModel->getAverageScore($bookId);

        $this->success([
            'your_score'    => $score,
            'average_score' => $average,
        ], 'Avaliação registrada com sucesso.');
    }
}
<?php

require_once __DIR__ . '/../core/Controller.php';
require_once __DIR__ . '/../models/ClubMessageModel.php';
require_once __DIR__ . '/../models/ClubModel.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class ClubMessageController extends Controller
{
    private ClubMessageModel $clubMessageModel;
    private ClubModel $clubModel;

    public function __construct()
    {
        $this->clubMessageModel = new ClubMessageModel();
        $this->clubModel        = new ClubModel();
    }

    public function send(int $clubId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId  = $payload['user_id'];

        $club = $this->clubModel->findById($clubId);

        if (!$club) {
            $this->error('Clube não encontrado.', 404);
        }

        if (!$this->clubModel->isMember($clubId, $userId)) {
            $this->error('Tens de ser membro do clube para enviar mensagens.', 403);
        }

        $body    = $this->getBody();
        $message = trim($body['message'] ?? '');

        if (empty($message)) {
            $this->error('A mensagem não pode estar vazia.', 422);
        }

        $messageId = $this->clubMessageModel->send($clubId, $userId, $message);

        $this->success(['message_id' => $messageId], 'Mensagem enviada com sucesso.', 201);
    }

    public function index(int $clubId): void
    {
        $payload = AuthMiddleware::requireAuth();
        $userId  = $payload['user_id'];

        $club = $this->clubModel->findById($clubId);

        if (!$club) {
            $this->error('Clube não encontrado.', 404);
        }

        if (!$this->clubModel->isMember($clubId, $userId)) {
            $this->error('Tens de ser membro do clube para ver as mensagens.', 403);
        }

        $messages = $this->clubMessageModel->getByClub($clubId);

        $this->success([
            'total'    => count($messages),
            'messages' => $messages,
        ], 'Mensagens carregadas com sucesso.');
    }
}
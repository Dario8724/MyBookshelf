-- =========================
-- SEED: ACHIEVEMENTS
-- =========================

INSERT IGNORE INTO achievement (name, description, icon, condition_type, condition_value) VALUES
('Primeiro Livro',      'Adicionaste o teu primeiro livro à biblioteca.',   '📖', 'books_added',      1),
('Leitor Iniciante',    'Marcaste 3 livros como lidos.',                    '📗', 'books_completed',   3),
('Leitor Dedicado',     'Marcaste 5 livros como lidos.',                    '📚', 'books_completed',   5),
('Leitor Voraz',        'Marcaste 10 livros como lidos.',                   '🔥', 'books_completed',  10),
('Leitor do Ano',       'Marcaste 20 livros como lidos.',                   '🏆', 'books_completed',  20),
('Maratonista',         'Marcaste 50 livros como lidos.',                   '🚀', 'books_completed',  50),

('Primeira Review',     'Escreveste a tua primeira review.',                '✍️', 'reviews_written',   1),
('Crítico Literário',   'Escreveste 5 reviews.',                            '🎭', 'reviews_written',   5),
('Voz da Comunidade',   'Escreveste 10 reviews.',                           '📣', 'reviews_written',  10),

('Primeiro Seguidor',   'Começaste a seguir outro utilizador.',             '👥', 'following',         1),
('Bem Conectado',       'Estás a seguir 10 utilizadores.',                  '🌐', 'following',        10),

('Popular',             'Tens 5 seguidores.',                               '⭐', 'followers',         5),
('Influenciador',       'Tens 20 seguidores.',                              '💫', 'followers',        20),

('Primeira Meta',       'Criaste a tua primeira meta de leitura.',          '🎯', 'goals_created',     1),
('Meta Concluída',      'Concluíste uma meta de leitura.',                  '🥇', 'goals_completed',   1);
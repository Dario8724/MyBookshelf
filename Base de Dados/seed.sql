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


// =========================
// livros provisórios para teste

INSERT INTO book (title, author, isbn, publisher, publication_year, language, description, cover) VALUES
('Harry Potter e a Pedra Filosofal', 'J.K. Rowling', '9788532511010', 'Rocco', 1997, 'Português', 'O primeiro livro da série Harry Potter.', NULL),
('Harry Potter e a Câmara Secreta', 'J.K. Rowling', '9788532512123', 'Rocco', 1998, 'Português', 'O segundo livro da série Harry Potter.', NULL),
('O Senhor dos Anéis', 'J.R.R. Tolkien', '9788533613379', 'Martins Fontes', 1954, 'Português', 'A épica aventura da Terra Média.', NULL),
('1984', 'George Orwell', '9788535914849', 'Companhia das Letras', 1949, 'Português', 'Uma distopia sobre um estado totalitário.', NULL),
('O Hobbit', 'J.R.R. Tolkien', '9788533613286', 'Martins Fontes', 1937, 'Português', 'A aventura de Bilbo Bolseiro.', NULL);



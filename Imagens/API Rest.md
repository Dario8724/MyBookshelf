# MyBookshelf — Documentação da API REST

## Informações Gerais

- **Base URL:** `http://localhost:8888`
- **Formato:** JSON
- **Autenticação:** JWT Bearer Token

### Headers obrigatórios para rotas autenticadas
```
Authorization: Bearer {token}
Content-Type: application/json
```

---

## Índice
- [Autenticação](#autenticação)
- [Utilizadores](#utilizadores)
- [Livros](#livros)
- [Biblioteca Pessoal](#biblioteca-pessoal)
- [Reviews e Ratings](#reviews-e-ratings)
- [Posts e Feed](#posts-e-feed)
- [Follows](#follows)
- [Conquistas](#conquistas)
- [Metas de Leitura](#metas-de-leitura)
- [Clubes](#clubes)
- [Seasons e Ranking](#seasons-e-ranking)

---

## Autenticação

### Registar utilizador
```
POST /api/users/register
```

**Body:** `multipart/form-data`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| name | string | Sim | Nome do utilizador |
| email | string | Sim | Email único |
| password | string | Sim | Mínimo 6 caracteres |
| profile_image | file | Não | JPEG, PNG ou WebP, máx 2MB |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Utilizador registado com sucesso.",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "user_id": 1,
            "name": "Gabriel Rezende",
            "email": "gabriel@email.com",
            "profile_image": null
        }
    }
}
```

---

### Login
```
POST /api/users/login
```

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| email | string | Sim | Email do utilizador |
| password | string | Sim | Password |

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "message": "Login efectuado com sucesso.",
    "data": {
        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "user_id": 1,
            "name": "Gabriel Rezende",
            "email": "gabriel@email.com",
            "profile_image": null
        }
    }
}
```

---

## Utilizadores

### Ver perfil autenticado
```
GET /api/users/me
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "message": "OK",
    "data": {
        "user": {
            "user_id": 1,
            "name": "Gabriel Rezende",
            "email": "gabriel@email.com",
            "bio": "Amante de livros e tecnologia!",
            "profile_image": "uploads/profiles/profile_abc123.jpg"
        }
    }
}
```

---

### Editar perfil
```
POST /api/users/profile
```
🔒 Autenticação obrigatória

**Body:** `multipart/form-data`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| name | string | Sim | Nome do utilizador |
| bio | string | Não | Biografia |
| profile_image | file | Não | JPEG, PNG ou WebP, máx 2MB |

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "message": "Perfil actualizado com sucesso.",
    "data": {
        "user": {
            "user_id": 1,
            "name": "Gabriel Rezende",
            "bio": "Amante de livros e tecnologia!",
            "profile_image": "uploads/profiles/profile_abc123.jpg"
        }
    }
}
```

---

## Livros

### Pesquisar livros
```
GET /api/books/search?q={query}
```

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| q | string | Sim | Termo de pesquisa (mínimo 2 caracteres) |

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "message": "Livros encontrados.",
    "data": {
        "total": 20,
        "books": [
            {
                "google_id": "DqvrPgAACAAJ",
                "title": "Harry Potter e a Pedra Filosofal",
                "author": "J. K. Rowling",
                "isbn": "9788532511010",
                "description": "...",
                "cover": "http://books.google.com/books/content?id=...",
                "language": "pt-BR",
                "publication_year": "2000",
                "publisher": "Rocco",
                "genres": ["Juvenile Fiction"]
            }
        ]
    }
}
```

---

### Ver detalhes de um livro
```
GET /api/books/{id}
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "message": "Livro encontrado.",
    "data": {
        "book": {
            "book_id": 1,
            "title": "Harry Potter e a Pedra Filosofal",
            "author": "J. K. Rowling",
            "isbn": "9788532511010",
            "cover": "http://...",
            "description": "...",
            "publication_year": "2000",
            "publisher": "Rocco"
        }
    }
}
```

---

### Ver detalhes por Google ID
```
GET /api/books/google/{google_id}
```
🔒 Autenticação obrigatória

---

### Guardar livro na base de dados
```
POST /api/books/save
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| google_id | string | Sim | ID do livro na Google Books ou Open Library |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Livro guardado com sucesso.",
    "data": {
        "book_id": 1
    }
}
```

---

## Biblioteca Pessoal

### Adicionar livro à biblioteca
```
POST /api/library
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| book_id | integer | Sim | ID do livro |
| status | string | Sim | `reading`, `completed` ou `want_to_read` |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Livro adicionado à biblioteca com sucesso."
}
```

---

### Listar biblioteca
```
GET /api/library
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "message": "OK",
    "data": {
        "total": 3,
        "books": [
            {
                "book_id": 1,
                "title": "Harry Potter e a Pedra Filosofal",
                "author": "J. K. Rowling",
                "cover": "http://...",
                "status": "completed",
                "favorite": 0
            }
        ]
    }
}
```

---

### Ver status de um livro
```
GET /api/library/{book_id}/status
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "status": "completed",
        "favorite": 0
    }
}
```

---

### Remover livro da biblioteca
```
DELETE /api/library/{book_id}
```
🔒 Autenticação obrigatória

---

### Marcar/desmarcar como favorito
```
POST /api/library/{book_id}/favorite
```
🔒 Autenticação obrigatória

---

## Reviews e Ratings

### Criar review
```
POST /api/reviews
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| book_id | integer | Sim | ID do livro |
| review_text | string | Sim | Texto da review |
| has_spoiler | integer | Não | `0` ou `1` |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Review publicada com sucesso.",
    "data": {
        "review_id": 1
    }
}
```

---

### Ver reviews de um livro
```
GET /api/reviews/book/{book_id}
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "total": 2,
        "reviews": [
            {
                "review_id": 1,
                "name": "Gabriel Rezende",
                "review_text": "Excelente livro!",
                "has_spoiler": 0,
                "score": 5,
                "created_at": "2026-04-14 10:00:00"
            }
        ]
    }
}
```

---

### Apagar review
```
DELETE /api/reviews/{review_id}
```
🔒 Autenticação obrigatória

---

### Avaliar livro
```
POST /api/ratings
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| book_id | integer | Sim | ID do livro |
| score | integer | Sim | Avaliação de 1 a 5 |

---

## Posts e Feed

### Criar post
```
POST /api/posts
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| content | string | Sim | Conteúdo do post (máx 500 caracteres) |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Post criado com sucesso.",
    "data": {
        "post_id": 1
    }
}
```

---

### Ver feed
```
GET /api/posts/feed
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "total": 5,
        "posts": [
            {
                "post_id": 1,
                "name": "Gabriel Rezende",
                "profile_image": "uploads/profiles/...",
                "content": "Acabei de terminar Duna!",
                "total_likes": 3,
                "total_comments": 1,
                "liked": false,
                "created_at": "2026-04-14 10:00:00"
            }
        ]
    }
}
```

---

### Apagar post
```
DELETE /api/posts/{post_id}
```
🔒 Autenticação obrigatória

---

### Dar/retirar like
```
POST /api/posts/{post_id}/like
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "liked": true
    }
}
```

---

### Adicionar comentário
```
POST /api/posts/{post_id}/comments
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| comment | string | Sim | Texto do comentário |

---

### Ver comentários
```
GET /api/posts/{post_id}/comments
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "total": 2,
        "comments": [
            {
                "comment_id": 1,
                "name": "Gabriel Rezende",
                "profile_image": "uploads/profiles/...",
                "comment": "Que livro incrível!",
                "created_at": "2026-04-14 10:00:00"
            }
        ]
    }
}
```

---

## Follows

### Seguir utilizador
```
POST /api/users/{user_id}/follow
```
🔒 Autenticação obrigatória

---

### Deixar de seguir
```
DELETE /api/users/{user_id}/follow
```
🔒 Autenticação obrigatória

---

### Ver seguidores
```
GET /api/users/{user_id}/followers
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "total": 5,
        "followers": [
            {
                "user_id": 2,
                "name": "Maria Silva",
                "profile_image": "uploads/profiles/..."
            }
        ]
    }
}
```

---

### Ver quem segue
```
GET /api/users/{user_id}/following
```
🔒 Autenticação obrigatória

---

## Conquistas

### Ver conquistas do utilizador
```
GET /api/achievements
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "total": 15,
        "achievements": [
            {
                "achievement_id": 1,
                "name": "Primeiro Livro",
                "description": "Adicionou o primeiro livro à biblioteca.",
                "icon": "📚",
                "earned": 1
            }
        ]
    }
}
```

---

### Verificar e atribuir conquistas
```
POST /api/achievements/check
```
🔒 Autenticação obrigatória

---

## Metas de Leitura

### Criar meta
```
POST /api/goals
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| goal_type | string | Sim | `annual` ou `semester` |
| target_value | integer | Sim | Número de livros (mínimo 1) |
| year | integer | Sim | Ano da meta |
| semester | integer | Não | `1` ou `2` (obrigatório se `semester`) |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Meta criada com sucesso.",
    "data": {
        "reading_goal_id": 1,
        "goal_type": "annual",
        "target_value": 12,
        "start_date": "2026-01-01",
        "end_date": "2026-12-31"
    }
}
```

---

### Listar metas
```
GET /api/goals
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "goals": [
            {
                "reading_goal_id": 1,
                "goal_type": "annual",
                "target_value": 12,
                "start_date": "2026-01-01",
                "end_date": "2026-12-31",
                "progress": 3,
                "percentage": 25,
                "completed": false,
                "label": "Anual"
            }
        ]
    }
}
```

---

### Apagar meta
```
DELETE /api/goals/{goal_id}
```
🔒 Autenticação obrigatória

---

## Clubes

### Criar clube
```
POST /api/clubs
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| name | string | Sim | Nome do clube |
| description | string | Não | Descrição |
| latitude | float | Não | Localização geográfica |
| longitude | float | Não | Localização geográfica |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Clube criado com sucesso.",
    "data": {
        "club": {
            "club_id": 1,
            "name": "Clube dos Clássicos",
            "description": "Um clube para amantes da literatura clássica.",
            "created_by": 1,
            "latitude": "38.7169000",
            "longitude": "-9.1399000"
        }
    }
}
```

---

### Listar clubes
```
GET /api/clubs
```
🔒 Autenticação obrigatória

---

### Ver detalhes de um clube
```
GET /api/clubs/{club_id}
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "club": {
            "club_id": 1,
            "name": "Clube dos Clássicos",
            "description": "Um clube para amantes da literatura clássica.",
            "is_member": true,
            "member_count": 5
        }
    }
}
```

---

### Entrar num clube
```
POST /api/clubs/{club_id}/join
```
🔒 Autenticação obrigatória

---

### Sair de um clube
```
DELETE /api/clubs/{club_id}/leave
```
🔒 Autenticação obrigatória

---

### Enviar mensagem
```
POST /api/clubs/{club_id}/messages
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| message | string | Sim | Conteúdo da mensagem |

---

### Ver mensagens
```
GET /api/clubs/{club_id}/messages
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "total": 2,
        "messages": [
            {
                "club_message_id": 1,
                "message": "Olá a todos!",
                "user_id": 1,
                "user_name": "Gabriel",
                "profile_image": "uploads/profiles/..."
            }
        ]
    }
}
```

---

### Criar sessão de leitura
```
POST /api/clubs/{club_id}/sessions
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| book_id | integer | Sim | ID do livro |
| start_date | string | Sim | Data de início (YYYY-MM-DD) |
| end_date | string | Sim | Data de fim (YYYY-MM-DD) |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Sessão de leitura criada com sucesso.",
    "data": {
        "session_id": 1
    }
}
```

---

### Listar sessões
```
GET /api/clubs/{club_id}/sessions
```
🔒 Autenticação obrigatória

---

### Completar sessão
```
POST /api/clubs/sessions/{session_id}/complete
```
🔒 Autenticação obrigatória

> Atribui automaticamente **+10 pontos** ao clube na season actual.
> Se forem 3 sessões consecutivas, atribui adicionalmente **+30 pontos**.

---

### Ver ranking do clube
```
GET /api/clubs/{club_id}/ranking
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "total": 1,
        "ranking": [
            {
                "ranking_id": 1,
                "points": 183,
                "season_id": 1,
                "season_start": "2026-01-01",
                "season_end": "2026-06-30"
            }
        ]
    }
}
```

---

### Adicionar top book
```
POST /api/clubs/{club_id}/topbook
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| book_id | integer | Sim | ID do livro |
| position | integer | Sim | Posição no top |

---

### Ver top books
```
GET /api/clubs/{club_id}/topbook
```
🔒 Autenticação obrigatória

---

### Criar votação
```
POST /api/clubs/{club_id}/votes
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| title | string | Sim | Título da votação |
| start_date | string | Sim | Data de início (YYYY-MM-DD) |
| end_date | string | Sim | Data de fim (YYYY-MM-DD) |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Votação criada com sucesso.",
    "data": {
        "vote_id": 1
    }
}
```

---

### Listar votações
```
GET /api/clubs/{club_id}/votes
```
🔒 Autenticação obrigatória

---

### Adicionar opção à votação
```
POST /api/clubs/votes/{vote_id}/options
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| book_id | integer | Sim | ID do livro como opção |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Opção adicionada com sucesso.",
    "data": {
        "option_id": 1
    }
}
```

---

### Votar
```
POST /api/clubs/votes/{vote_id}/cast
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| option_id | integer | Sim | ID da opção escolhida |

> Atribui automaticamente **+3 pontos** ao clube na season actual.

---

### Adicionar livro à biblioteca do clube
```
POST /api/clubs/{club_id}/library
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| book_id | integer | Sim | ID do livro |

> Atribui automaticamente **+5 pontos** ao clube na season actual.

---

### Ver biblioteca do clube
```
GET /api/clubs/{club_id}/library
```
🔒 Autenticação obrigatória

---

### Remover livro da biblioteca do clube
```
DELETE /api/clubs/library/{club_library_id}
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| club_id | integer | Sim | ID do clube |

---

## Seasons e Ranking

### Criar season
```
POST /api/seasons
```
🔒 Autenticação obrigatória

**Body:** `application/json`

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| start_date | string | Sim | Data de início (YYYY-MM-DD) |
| end_date | string | Sim | Data de fim (YYYY-MM-DD) |

**Resposta de sucesso (201):**
```json
{
    "success": true,
    "message": "Temporada criada com sucesso.",
    "data": {
        "season_id": 1
    }
}
```

---

### Listar seasons
```
GET /api/seasons
```
🔒 Autenticação obrigatória

---

### Ver season actual
```
GET /api/seasons/current
```
🔒 Autenticação obrigatória

**Resposta de sucesso (200):**
```json
{
    "success": true,
    "data": {
        "season": {
            "season_id": 1,
            "start_date": "2026-01-01",
            "end_date": "2026-06-30"
        },
        "ranking": []
    }
}
```

---

### Ver ranking de uma season
```
GET /api/seasons/{season_id}/ranking
```
🔒 Autenticação obrigatória

---

## Sistema de Pontos

Os pontos são atribuídos automaticamente ao clube na season activa quando:

| Actividade | Pontos |
|---|---|
| Completar sessão de leitura | +10 pts |
| Completar 3 sessões consecutivas | +30 pts (bónus) |
| Adicionar livro à biblioteca do clube | +5 pts |
| Participar numa votação | +3 pts |
| Completar meta de leitura pessoal | +15 pts |
| Clube atingir 10 membros | +50 pts |

---

## Códigos de Resposta

| Código | Descrição |
|---|---|
| 200 | Sucesso |
| 201 | Criado com sucesso |
| 400 | Pedido inválido |
| 401 | Não autenticado |
| 403 | Sem permissão |
| 404 | Não encontrado |
| 409 | Conflito (ex: email já existe) |
| 422 | Dados inválidos |
| 500 | Erro interno do servidor |

---

## Formato de Erro

```json
{
    "success": false,
    "error": "Mensagem de erro descritiva."
}
```

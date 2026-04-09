<?php

$router->post('/api/users/register',        'UserController@register');
$router->post('/api/users/login',           'UserController@login');
$router->get('/api/users/me',               'UserController@me');
$router->post('/api/users/profile',         'UserController@updateProfile');
$router->get('/api/books/search',           'BookController@search');
$router->get('/api/books/{id}',             'BookController@show');
$router->post('/api/library',               'UserBookController@addBook');
$router->delete('/api/library/{id}',        'UserBookController@removeBook');
$router->get('/api/library/{id}/status',    'UserBookController@getStatus');
$router->get('/api/library',                'UserBookController@getLibrary');
$router->post('/api/library/{id}/favorite', 'UserBookController@toggleFavorite');
$router->post('/api/reviews',               'ReviewController@create');
$router->get('/api/reviews/book/{id}',      'ReviewController@getByBook');
$router->delete('/api/reviews/{id}',        'ReviewController@delete');
$router->post('/api/ratings',               'ReviewController@rate');
$router->post('/api/users/{id}/follow',     'FollowController@follow');
$router->delete('/api/users/{id}/follow',   'FollowController@unfollow');
$router->get('/api/users/{id}/followers',   'FollowController@followers');
$router->get('/api/users/{id}/following',   'FollowController@following');
$router->post('/api/posts',                 'PostController@create');
$router->get('/api/posts/feed',             'PostController@getFeed');
$router->delete('/api/posts/{id}',          'PostController@delete');
$router->post('/api/posts/{id}/like',       'PostController@toggleLike');
$router->post('/api/posts/{id}/comments',   'PostController@addComment');
$router->get('/api/posts/{id}/comments',    'PostController@getComments');
$router->post('/api/goals',        'ReadingGoalController@create');
$router->get('/api/goals',         'ReadingGoalController@index');
$router->delete('/api/goals/{id}', 'ReadingGoalController@delete');
// new router for clubs 
// Clubes
$router->post('/api/clubs', 'ClubController@create');
$router->get('/api/clubs',       'ClubController@index');
$router->get('/api/clubs/{id}',  'ClubController@show');
// Join a club
$router->post('/api/clubs/{id}/join',    'ClubController@join');
$router->delete('/api/clubs/{id}/leave', 'ClubController@leave');
// club messages
$router->post('/api/clubs/{id}/messages', 'ClubMessageController@send');
$router->get('/api/clubs/{id}/messages',  'ClubMessageController@index');
// reading sessions 
$router->post('/api/clubs/{id}/sessions',          'ClubReadingSessionController@create');
$router->get('/api/clubs/{id}/sessions',           'ClubReadingSessionController@index');
$router->post('/api/clubs/sessions/{id}/complete', 'ClubReadingSessionController@complete');
// Ranking
$router->get('/api/clubs/{id}/ranking', 'ClubRankingController@index');

// Top Book
$router->get('/api/clubs/{id}/topbook',  'ClubTopBookController@index');
$router->post('/api/clubs/{id}/topbook', 'ClubTopBookController@add');

// Votações
$router->get('/api/clubs/{id}/votes',           'ClubVoteController@index');
$router->post('/api/clubs/{id}/votes',          'ClubVoteController@create');
$router->post('/api/clubs/votes/{id}/options',  'ClubVoteController@addOption');
$router->post('/api/clubs/votes/{id}/cast',     'ClubVoteController@castVote');
// Biblioteca do clube
$router->get('/api/clubs/{id}/library',    'ClubLibraryController@index');
$router->post('/api/clubs/{id}/library',   'ClubLibraryController@addBook');
$router->delete('/api/clubs/library/{id}', 'ClubLibraryController@removeBook');
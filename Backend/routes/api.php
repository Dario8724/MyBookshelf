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
$router->delete('/api/reviews/{id}',         'ReviewController@delete');
$router->post('/api/ratings',               'ReviewController@rate');
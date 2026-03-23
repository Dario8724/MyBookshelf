<?php

$router->post('/api/users/register',    'UserController@register');
$router->post('/api/users/login',       'UserController@login');
$router->get('/api/users/me',           'UserController@me');
$router->post('/api/users/profile',     'UserController@updateProfile');
$router->get('/api/books/search',       'BookController@search');
$router->get('/api/books/{id}',         'BookController@show');
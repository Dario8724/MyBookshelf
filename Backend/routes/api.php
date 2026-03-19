<?php

$router->post('/api/users/register',    'UserController@register');
$router->post('/api/users/login',       'UserController@login');
$router->get('/api/users/me',           'UserController@me');
$router->put('/api/users/profile',      'UserController@updateProfile');
<?php

class Router
{
    private array $routes = [];

    public function get(string $path, string $handler): void
    {
        $this->addRoute('GET', $path, $handler);
    }

    public function post(string $path, string $handler): void
    {
        $this->addRoute('POST', $path, $handler);
    }

    public function put(string $path, string $handler): void
    {
        $this->addRoute('PUT', $path, $handler);
    }

    public function delete(string $path, string $handler): void
    {
        $this->addRoute('DELETE', $path, $handler);
    }

    private function addRoute(string $method, string $path, string $handler): void
    {
        $this->routes[] = [
            'method' => $method,
            'path' => $path,
            'handler' => $handler
        ];
    }

    public function dispatch(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $uri = rtrim($uri, '/') ?: '/';

        foreach ($this->routes as $route) {
            $pattern = preg_replace('/\{([a-z_]+)\}/', '([^/]+)', $route['path']);
            $pattern = "#^" . $pattern . "$#";

            if ($route["method"] === $method && preg_match($pattern, $uri, $matches)) {
                array_shift($matches);

                [$controllerName, $action] = explode(('@'), $route['handler']);

                require_once __DIR__ . '/../controllers/' . $controllerName . '.php';

                $controller = new $controllerName();
                call_user_func_array([$controller, $action], $matches);
                return;
            }
        }

        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Rota não encontrada']);
    }
}
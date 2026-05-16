<?php

require_once __DIR__ . '/../core/Controller.php';

class ConfigController extends Controller
{
    public function mapsKey(): void
    {
        $this->success(['key' => GOOGLE_MAPS_API_KEY]);
    }
}
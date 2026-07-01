<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Check what route matches /api/v1/budget-plans/1/items
$request = Illuminate\Http\Request::create('/api/v1/budget-plans/1/items', 'POST');
$route = app(\Illuminate\Routing\Router::class)->getRoutes()->match($request);
echo "Matched route: " . $route->getName() ?? 'unnamed' . "\n";
echo "Controller: " . ($route->getAction('controller') ?? 'none') . "\n";
echo "Parameters: " . json_encode($route->parameters()) . "\n\n";

// List all budget-plan routes
$router = app(\Illuminate\Routing\Router::class);
$allRoutes = $router->getRoutes();
foreach ($allRoutes as $r) {
    $uri = $r->uri();
    if (str_contains($uri, 'budget-plan')) {
        echo "$uri -> {$r->getAction('controller')}\n";
    }
}

<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Direct model check
$plan1 = \App\Models\BudgetPlan::find(1);
echo "Direct find(1):\n";
echo "  id={$plan1->id}, user_id={$plan1->user_id}, name={$plan1->name}\n";
echo "  attributes: " . json_encode($plan1->getAttributes()) . "\n\n";

// Check all plans
echo "All plans:\n";
foreach (\App\Models\BudgetPlan::all() as $p) {
    echo "  id={$p->id}, user_id={$p->user_id}, name={$p->name}\n";
}
echo "\n";

// Now test via route
$router = app(\Illuminate\Routing\Router::class);
foreach ($router->getRoutes() as $route) {
    $uri = $route->uri();
    if (str_contains($uri, 'budget-plan')) {
        echo "{$route->methods()[0]} $uri -> " . ($route->getAction('controller') ?? 'Closure') . "\n";
    }
}

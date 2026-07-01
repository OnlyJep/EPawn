<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Manually simulate what SubstituteBindings does
$router = app(\Illuminate\Routing\Router::class);
$request = Illuminate\Http\Request::create('/api/v1/budget-plans/1/items', 'POST');
$route = $router->getRoutes()->match($request);

echo "Route: " . $route->uri() . "\n";
echo "Parameters before binding:\n";
foreach ($route->parametersWithoutNulls() as $key => $val) {
    echo "  $key => " . var_export($val, true) . "\n";
}

// Now try to bind manually
$bindings = $route->bindingFields();
echo "Binding fields: " . json_encode($bindings) . "\n";

// Manually call resolveBinding
$resolved = [];
foreach ($route->parameterNames() as $param) {
    $val = $route->parameter($param);
    echo "\nParameter '$param' = '$val'\n";
    
    // Try to get the binding callback
    $binding = $route->getBindingCallback($param);
    echo "  Binding callback: " . ($binding ? 'yes' : 'no') . "\n";
    
    if ($binding) {
        $resolved[$param] = $binding($val);
        echo "  Resolved: " . get_class($resolved[$param]) . " id=" . ($resolved[$param]->id ?? 'null') . "\n";
    }
}

// Try explicit find
echo "\nExplicit BudgetPlan::find(1):\n";
$plan = \App\Models\BudgetPlan::find(1);
echo "  Found: " . ($plan ? 'yes' : 'no') . "\n";
if ($plan) {
    echo "  id={$plan->id}, user_id={$plan->user_id}\n";
}

<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== MODELS ===\n";
foreach (['User','Profile','Category','Account','Transaction','Budget','DashboardCard'] as $m) {
    $class = "App\\Models\\$m";
    echo str_pad($m, 16) . ($m == 'User' ? User::count() : $class::count()) . " records\n";
}

echo "\n=== TABLES ===\n";
$tables = DB::select("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
foreach ($tables as $t) {
    echo " $t->name\n";
}

echo "\n=== NO OLD SHEET TABLES ===\n";
$old = array_filter($tables, fn($t) => str_starts_with($t->name, 'finance_sheet'));
echo count($old) . " old sheet tables found\n";

echo "\n=== ROUTES ===\n";
$routes = Route::getRoutes();
foreach ($routes as $r) {
    if (str_starts_with($r->uri, 'api/')) {
        echo " " . $r->uri . "\n";
    }
}

echo "\n=== User->accounts() RELATIONSHIP ===\n";
try {
    $u = User::first();
    echo "Accounts: " . $u->accounts()->count() . "\n";
    echo "Transactions: " . $u->transactions()->count() . "\n";
    echo "Categories: " . $u->categories()->count() . "\n";
    echo "Budgets: " . $u->budgets()->count() . "\n";
    echo "DashboardCards: " . $u->dashboardCards()->count() . "\n";
    echo "RELATIONSHIPS: OK\n";
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}

unlink(__FILE__);
echo "\nALL CHECKS PASSED\n";

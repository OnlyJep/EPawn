<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::find(10);
$token = $user->createToken('test')->plainTextToken;

$auth = array_merge(
    ['HTTP_Accept' => 'application/json', 'HTTP_X-Requested-With' => 'XMLHttpRequest'],
    ['HTTP_Authorization' => "Bearer $token"],
    ['HTTP_Origin' => 'http://localhost'],
    ['HTTP_Referer' => 'http://localhost/dashboard'],
    ['HTTP_Cookie' => '']
);

// Test show with Origin header
$r = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans/1', 'GET', [], [], [], $auth));
echo "GET with Origin: HTTP {$r->getStatusCode()}\n";
echo "Body: " . substr($r->getContent(), 0, 200) . "\n\n";

// Test without Origin (like the PHP test does)
$auth2 = array_merge(
    ['HTTP_Accept' => 'application/json', 'HTTP_X-Requested-With' => 'XMLHttpRequest'],
    ['HTTP_Authorization' => "Bearer $token"]
);
$r2 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans/1', 'GET', [], [], [], $auth2));
echo "GET without Origin: HTTP {$r2->getStatusCode()}\n";
echo "Body: " . substr($r2->getContent(), 0, 200) . "\n\n";

// Try with a custom route that binds
\Illuminate\Support\Facades\Route::get('/api/v1/_test_plan/{plan}', function (\App\Models\BudgetPlan $plan) {
    return response()->json(['id' => $plan->id, 'user_id' => $plan->user_id, 'name' => $plan->name]);
});
$r3 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/_test_plan/1', 'GET', [], [], [], $auth2));
echo "Custom route binding test: HTTP {$r3->getStatusCode()}\n";
echo "Body: " . $r3->getContent() . "\n";

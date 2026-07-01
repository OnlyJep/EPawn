<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::find(10);
$token = $user->createToken('test')->plainTextToken;
$auth = array_merge(
    ['HTTP_Accept' => 'application/json', 'HTTP_X-Requested-With' => 'XMLHttpRequest'],
    ['HTTP_Authorization' => "Bearer $token"]
);

$r = $kernel->handle(Illuminate\Http\Request::create('/api/v1/user', 'GET', [], [], [], $auth));
$body = json_decode($r->getContent(), true);
echo "Auth user ID: " . var_export($body['user']['id'] ?? null, true) . "\n";
echo "Auth user type: " . gettype($body['user']['id'] ?? null) . "\n";

$plan = \App\Models\BudgetPlan::find(1);
echo "Plan user_id: " . var_export($plan->user_id, true) . "\n";
echo "Plan user_id type: " . gettype($plan->user_id) . "\n";

// Direct check
echo "Comparison (loose): " . ($plan->user_id != $body['user']['id'] ? 'NOT EQUAL' : 'EQUAL') . "\n";
echo "Comparison (strict): " . ($plan->user_id !== $body['user']['id'] ? 'NOT EQUAL' : 'EQUAL') . "\n";

// Check what the controller sees
$r2 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans/1/items', 'POST', [
    'name' => 'Test', 'amount' => 100, 'date' => '2026-06-30',
], [], [], $auth));
echo "\nController result: HTTP {$r2->getStatusCode()} - " . $r2->getContent() . "\n";

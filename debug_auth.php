<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::find(10);
$token = $user->createToken('test')->plainTextToken;
echo "Token: $token\n";
echo "User ID: {$user->id}\n\n";

$json = ['HTTP_Accept' => 'application/json', 'HTTP_X-Requested-With' => 'XMLHttpRequest'];
$auth = array_merge($json, ['HTTP_Authorization' => "Bearer $token"]);

// Test user endpoint first
$r = $kernel->handle(Illuminate\Http\Request::create('/api/v1/user', 'GET', [], [], [], $auth));
echo "GET /user: HTTP {$r->getStatusCode()}\n";
echo "Body: " . substr($r->getContent(), 0, 200) . "\n\n";

// Now check the plan
$plan = \App\Models\BudgetPlan::find(1);
echo "Plan 1 user_id: {$plan->user_id}\n\n";

// Test storeItem
$r2 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans/1/items', 'POST', [
    'name' => 'Test', 'amount' => 100, 'date' => '2026-06-30',
], [], [], $auth));
echo "POST items: HTTP {$r2->getStatusCode()}\n";
echo "Body: " . $r2->getContent() . "\n";

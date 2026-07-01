<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$json = ['HTTP_Accept' => 'application/json', 'HTTP_X-Requested-With' => 'XMLHttpRequest'];

// Login as Jep
$r = $kernel->handle(Illuminate\Http\Request::create('/api/v1/login', 'POST', [
    'username' => 'Jep', 'password' => 'password123',
], [], [], $json));
$res = json_decode($r->getContent(), true);
echo "Login as Jep: HTTP {$r->getStatusCode()} - " . ($res['message'] ?? 'FAIL') . "\n";
echo "Redirect: " . ($res['redirect'] ?? 'none') . "\n";

if (($res['success'] ?? false)) {
    $user = \App\Models\User::find(10);
    $token = $user->createToken('test')->plainTextToken;
    $auth = array_merge($json, ['HTTP_Authorization' => "Bearer $token"]);

    // List plans
    $r2 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans', 'GET', [], [], [], $auth));
    echo "Plans: " . substr($r2->getContent(), 0, 300) . "\n\n";

    // Add item to plan 1
    $r3 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans/1/items', 'POST', [
        'name' => 'Test Item', 'amount' => 500, 'date' => '2026-06-30',
    ], [], [], $auth));
    echo "Add item to plan 1: HTTP {$r3->getStatusCode()}\n";
    echo "Body: " . substr($r3->getContent(), 0, 200) . "\n";
} else {
    // Try direct auth
    $user = \App\Models\User::find(10);
    $token = $user->createToken('test')->plainTextToken;
    $auth = array_merge($json, ['HTTP_Authorization' => "Bearer $token"]);
    
    $r2 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans', 'GET', [], [], [], $auth));
    echo "Plans (direct token): " . substr($r2->getContent(), 0, 300) . "\n\n";
    
    $r3 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans/1/items', 'POST', [
        'name' => 'Test Item', 'amount' => 500, 'date' => '2026-06-30',
    ], [], [], $auth));
    echo "Add item (direct token): HTTP {$r3->getStatusCode()}\n";
    echo "Body: " . substr($r3->getContent(), 0, 300) . "\n";
}

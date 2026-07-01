<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$json = ['HTTP_Accept' => 'application/json', 'HTTP_X-Requested-With' => 'XMLHttpRequest'];

// Login as Jep (user 10)
$r = $kernel->handle(Illuminate\Http\Request::create('/api/v1/login', 'POST', [
    'username' => 'Jep', 'password' => 'password123',
], [], [], $json));
$login = json_decode($r->getContent(), true);
echo "Login as Jep: " . $r->getStatusCode() . " " . ($login['message'] ?? 'FAIL') . "\n";

if (($login['success'] ?? false)) {
    $user = \App\Models\User::find(10);
    $token = $user->createToken('test')->plainTextToken;
    $auth = array_merge($json, ['HTTP_Authorization' => "Bearer $token"]);

    // Try to access plan 1's items
    $r2 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans/1/items', 'POST', [
        'name' => 'Test Item', 'amount' => 100, 'date' => '2026-06-30',
    ], [], [], $auth));
    echo "Create item on plan 1: " . $r2->getStatusCode() . " " . substr($r2->getContent(), 0, 200) . "\n";
}

echo "\n---\n";

// Login as ID 6 user
$r3 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/login', 'POST', [
    'username' => 'tu26986', 'password' => 'newpass123',
], [], [], $json));
$login3 = json_decode($r3->getContent(), true);
echo "Login as tu26986: " . $r3->getStatusCode() . " " . ($login3['message'] ?? 'FAIL') . "\n";

if (($login3['success'] ?? false)) {
    // Check what plans this user sees
    $user3 = \App\Models\User::where('username', 'tu26986')->first();
    $token3 = $user3->createToken('test')->plainTextToken;
    $auth3 = array_merge($json, ['HTTP_Authorization' => "Bearer $token3"]);

    $r4 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans', 'GET', [], [], [], $auth3));
    $plans = json_decode($r4->getContent(), true);
    echo "User tu26986 plans: " . json_encode($plans) . "\n";
}

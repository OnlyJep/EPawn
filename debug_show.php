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

// Test the show endpoint (also uses route model binding)
$r = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans/1', 'GET', [], [], [], $auth));
echo "GET /budget-plans/1: HTTP {$r->getStatusCode()}\n";
echo "Body: " . substr($r->getContent(), 0, 300) . "\n\n";

// Test items POST again
$r2 = $kernel->handle(Illuminate\Http\Request::create('/api/v1/budget-plans/1/items', 'POST', [
    'name' => 'Test', 'amount' => 100, 'date' => '2026-06-30',
], [], [], $auth));
echo "POST /budget-plans/1/items: HTTP {$r2->getStatusCode()}\n";
echo "Body: " . $r2->getContent() . "\n";

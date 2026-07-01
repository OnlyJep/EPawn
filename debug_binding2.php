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

// Test category model binding (category uses implicit binding too)
// First, create a test category
$cat = \App\Models\Category::create([
    'user_id' => 10,
    'name' => 'TestCat',
    'type' => 'expense',
]);
echo "Created category id={$cat->id}\n";

// Test GET category via route
$r = $kernel->handle(Illuminate\Http\Request::create("/api/v1/categories/{$cat->id}", 'GET', [], [], [], $auth));
echo "GET /categories/{$cat->id}: HTTP {$r->getStatusCode()}\n";
echo "Body: " . substr($r->getContent(), 0, 300) . "\n\n";

// Test category update (PUT)
$r2 = $kernel->handle(Illuminate\Http\Request::create("/api/v1/categories/{$cat->id}", 'PUT', [
    'name' => 'UpdatedCat', 'type' => 'expense',
], [], [], $auth));
echo "PUT /categories/{$cat->id}: HTTP {$r2->getStatusCode()}\n";
echo "Body: " . substr($r2->getContent(), 0, 300) . "\n\n";

<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$json = ['HTTP_Accept' => 'application/json', 'HTTP_X-Requested-With' => 'XMLHttpRequest'];

// Try known password combinations
$attempts = [
    ['username' => 'Jep', 'password' => '071799'],
    ['username' => 'Jep', 'password' => 'password123'],
    ['username' => 'Jep', 'password' => 'test123'],
    ['username' => 'tu26986', 'password' => 'newpass123'],
    ['username' => 'tu26986', 'password' => 'password123'],
];

foreach ($attempts as $a) {
    $r = $kernel->handle(Illuminate\Http\Request::create('/api/v1/login', 'POST', $a, [], [], $json));
    $body = json_decode($r->getContent(), true);
    echo "{$a['username']} / {$a['password']}: HTTP {$r->getStatusCode()} - " . ($body['message'] ?? '') . "\n";
}

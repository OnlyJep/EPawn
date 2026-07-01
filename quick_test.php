<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$time = time();
$json = ['HTTP_Accept' => 'application/json', 'HTTP_X-Requested-With' => 'XMLHttpRequest'];

// Register
$req = Illuminate\Http\Request::create('/api/v1/register', 'POST', [
    'first_name' => 'Jane', 'last_name' => 'Smith', 'email' => 'j' . $time . '@test.com',
    'username' => 'u' . substr($time, -6), 'password' => 'pass123', 'password_confirmation' => 'pass123',
], [], [], $json);
$r = json_decode($kernel->handle($req)->getContent(), true);

echo "Register: " . ($r['success'] ? 'PASS' : 'FAIL') . "\n";
echo "  User cols: " . implode(', ', array_keys($r['user'] ?? [])) . "\n";
echo "  Profile cols: " . implode(', ', array_keys($r['user']['profile'] ?? [])) . "\n";
echo "  Name: {$r['user']['profile']['first_name']} {$r['user']['profile']['last_name']}\n";

// Check users table schema directly
$usersCols = Illuminate\Support\Facades\Schema::getColumnListing('users');
$profilesCols = Illuminate\Support\Facades\Schema::getColumnListing('profiles');
echo "\nUsers table: " . implode(', ', $usersCols) . "\n";
echo "Profiles table: " . implode(', ', $profilesCols) . "\n";

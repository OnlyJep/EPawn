<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::find(6);
echo "User 6: {$user->username}\n";
echo "Hash: {$user->password}\n";
echo "Check 'newpass123': " . (\Illuminate\Support\Facades\Hash::check('newpass123', $user->password) ? 'true' : 'false') . "\n";
echo "Check 'password123': " . (\Illuminate\Support\Facades\Hash::check('password123', $user->password) ? 'true' : 'false') . "\n";

// Also test creating a user now and checking
$hash = \Illuminate\Support\Facades\Hash::make('password123');
echo "\nFresh hash of 'password123': $hash\n";
echo "Check fresh: " . (\Illuminate\Support\Facades\Hash::check('password123', $hash) ? 'true' : 'false') . "\n";

// Check APP_KEY
echo "\nAPP_KEY: " . env('APP_KEY') . "\n";
echo "Cipher: " . env('APP_CIPHER', 'AES-256-CBC') . "\n";

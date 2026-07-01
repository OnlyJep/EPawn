<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::find(10);
echo "User: {$user->username}\n";
echo "Password hash: {$user->password}\n";
echo "Hash::check('password123'): " . (\Illuminate\Support\Facades\Hash::check('password123', $user->password) ? 'true' : 'false') . "\n";
echo "Hash::check('071799'): " . (\Illuminate\Support\Facades\Hash::check('071799', $user->password) ? 'true' : 'false') . "\n";

// Test with a fresh hash
$freshHash = \Illuminate\Support\Facades\Hash::make('test123');
echo "Fresh hash of 'test123': $freshHash\n";
echo "Hash::check('test123', fresh): " . (\Illuminate\Support\Facades\Hash::check('test123', $freshHash) ? 'true' : 'false') . "\n";

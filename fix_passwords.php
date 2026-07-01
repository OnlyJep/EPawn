<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Reset passwords for all users to 'password123'
foreach (\App\Models\User::all() as $user) {
    $user->password = \Illuminate\Support\Facades\Hash::make('password123');
    $user->save();
    echo "Reset password for user {$user->id} ({$user->username})\n";
}

echo "\nDone. All passwords set to 'password123'\n";

<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user6 = \App\Models\User::find(6);
echo "User 6: {$user6->username}\n";
echo "Hash: {$user6->password}\n";
echo "Hash length: " . strlen($user6->password) . "\n";

// Check for trailing whitespace
echo "Last 5 chars: '" . substr($user6->password, -5) . "'\n";

// Try every password we know
foreach (['password123', 'newpass123', 'test123', '123456', '071799', 'password', 'Password123', 'pass123'] as $pw) {
    $r = \Illuminate\Support\Facades\Hash::check($pw, $user6->password);
    if ($r) { echo "MATCHED: $pw\n"; }
}

// Let's manually see what Hash::check does
$hash2 = password_hash('password123', PASSWORD_BCRYPT);
echo "\nDirect password_hash of 'password123': $hash2\n";
echo "password_verify: " . (password_verify('password123', $hash2) ? 'true' : 'false') . "\n";
echo "password_verify(user6 hash): " . (password_verify('password123', $user6->password) ? 'true' : 'false') . "\n";
echo "password_verify(newpass123 with user6 hash): " . (password_verify('newpass123', $user6->password) ? 'true' : 'false') . "\n";

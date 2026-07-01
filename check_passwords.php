<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

foreach (\App\Models\User::all() as $u) {
    $pw = $u->password;
    echo "ID {$u->id}: {$u->username} | password: " . substr($pw, 0, 30) . "... | has_password: " . ($u->has_password ? 'true' : 'false') . "\n";
}

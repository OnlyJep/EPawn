<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$plans = \App\Models\BudgetPlan::with('user')->get();
echo "Budget Plans:\n";
foreach ($plans as $p) {
    echo "  ID {$p->id}: user_id={$p->user_id} (user: {$p->user?->username})\n";
}
echo "\nUsers:\n";
foreach (\App\Models\User::all() as $u) {
    echo "  ID {$u->id}: {$u->username}\n";
}

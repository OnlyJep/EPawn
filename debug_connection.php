<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Check the model's connection
$plan = new \App\Models\BudgetPlan();
echo "Default connection name: '" . $plan->getConnectionName() . "'\n";
echo "Default connection driver: " . config('database.default') . "\n";
echo "MySQL database: " . config('database.connections.mysql.database') . "\n";

// Check if there's a model event clearing data
\App\Models\BudgetPlan::retrieved(function ($model) {
    echo "RETRIEVED EVENT: id={$model->id}, user_id={$model->user_id}\n";
});

// Now test the find
$plan1 = \App\Models\BudgetPlan::find(1);
echo "After find(1): id={$plan1->id}, user_id={$plan1->user_id}\n";

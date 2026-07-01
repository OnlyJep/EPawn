<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Check what connection BudgetPlan uses
$plan = new \App\Models\BudgetPlan();
echo "Connection: " . $plan->getConnectionName() . "\n";
echo "Table: " . $plan->getTable() . "\n";

// Check all connections
echo "\nChecking tables on all connections...\n";
foreach (['mysql', 'sqlite', 'remote'] as $conn) {
    try {
        $tables = \Illuminate\Support\Facades\DB::connection($conn)
            ->table('information_schema.TABLES')
            ->where('TABLE_SCHEMA', function($q) use ($conn) {
                $q->select(\Illuminate\Support\Facades\DB::connection($conn)->raw('DATABASE()'));
            })
            ->pluck('TABLE_NAME');
        echo "$conn: " . $tables->implode(', ') . "\n";
    } catch (Exception $e) {
        try {
            $pdo = \Illuminate\Support\Facades\DB::connection($conn)->getPdo();
            echo "$conn: PDO OK\n";
        } catch (Exception $e2) {
            echo "$conn: ERROR - " . $e2->getMessage() . "\n";
        }
    }
}

// Force BudgetPlan to use mysql connection
echo "\nBudgetPlan::on('mysql')->find(1):\n";
$plan1 = \App\Models\BudgetPlan::on('mysql')->find(1);
if ($plan1) {
    echo "  Found: id={$plan1->id}, user_id={$plan1->user_id}\n";
} else {
    echo "  NOT FOUND\n";
}

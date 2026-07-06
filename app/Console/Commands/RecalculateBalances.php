<?php

namespace App\Console\Commands;

use App\Http\Controllers\Api\TransactionController;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class RecalculateBalances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'balances:recalculate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate all user account balances';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Recalculating balances for all users...');

        $users = User::all();
        $transactionController = new TransactionController();

        foreach ($users as $user) {
            try {
                $transactionController->recalculateBalance($user->id);
                $this->info("Recalculated balances for user ID: {$user->id}");
            } catch (\Exception $e) {
                Log::error("Failed to recalculate balances for user ID {$user->id}: " . $e->getMessage());
                $this->error("Failed for user ID {$user->id}: " . $e->getMessage());
            }
        }

        $this->info('Balance recalculation completed.');
        return Command::SUCCESS;
    }
}

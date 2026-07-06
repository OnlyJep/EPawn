<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\Transaction;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Fix existing transfer transactions by setting is_source flag
        // For each pair of transfer transactions, mark the one with smaller account_id as source
        $transfers = Transaction::where('type', 'transfer')
            ->whereNull('is_source')
            ->orderBy('id')
            ->get()
            ->chunk(2, function ($transfers) {
                if ($transfers->count() === 2) {
                    $first = $transfers[0];
                    $second = $transfers[1];
                    
                    // Mark the one with smaller account_id as source
                    if ($first->account_id < $second->account_id) {
                        $first->update(['is_source' => true]);
                        $second->update(['is_source' => false]);
                    } else {
                        $first->update(['is_source' => false]);
                        $second->update(['is_source' => true]);
                    }
                }
            });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this as it's a data fix
    }
};

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
        // Fix existing transfer transactions by setting is_source flag properly
        // Group transfers by their unique combination of date, amount, and description
        $transfers = Transaction::where('type', 'transfer')
            ->whereNull('is_source')
            ->orderBy('id')
            ->get();

        // Group by date, amount, description to find pairs
        $grouped = [];
        foreach ($transfers as $tx) {
            $key = $tx->date . '_' . $tx->amount . '_' . ($tx->description ?? '');
            if (!isset($grouped[$key])) {
                $grouped[$key] = [];
            }
            $grouped[$key][] = $tx;
        }

        // For each group, mark the one with smaller account_id as source
        foreach ($grouped as $key => $txs) {
            if (count($txs) === 2) {
                $first = $txs[0];
                $second = $txs[1];
                
                // The one with smaller account_id is the source (from account)
                if ($first->account_id < $second->account_id) {
                    $first->update(['is_source' => true]);
                    $second->update(['is_source' => false]);
                } else {
                    $first->update(['is_source' => false]);
                    $second->update(['is_source' => true]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No need to reverse this as it's a data fix
    }
};

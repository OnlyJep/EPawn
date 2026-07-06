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
        // Fix all transfer transactions to ensure proper is_source flag
        // For each pair of transfer transactions with same date, amount, description
        // The one with smaller account_id should be is_source = true (from account)
        // The one with larger account_id should be is_source = false (to account)
        
        $transfers = Transaction::where('type', 'transfer')
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
            } elseif (count($txs) === 1) {
                // If only one transaction exists, mark it as source
                $txs[0]->update(['is_source' => true]);
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

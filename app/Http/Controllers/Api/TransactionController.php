<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Transaction;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $transactions = Transaction::where('user_id', $request->user()->id)
                ->with('account:id,name', 'category:id,name')
                ->orderBy('date', 'desc')
                ->orderBy('id', 'desc')
                ->get();

            return response()->json(['success' => true, 'transactions' => $transactions]);
        } catch (\Exception $e) {
            Log::error('TransactionController@index: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->validate([
                'account_id' => 'nullable|exists:accounts,id',
                'category_id' => 'nullable|exists:categories,id',
                'type' => 'required|in:income,expense,transfer',
                'amount' => 'required|numeric|min:0',
                'description' => 'nullable|string|max:255',
                'date' => 'required|date',
            ]);

            // Handle both ISO format (2026-07-01T00:00:00.000000Z) and yyyy-MM-dd HH:mm:ss format
            $dateValue = $request->date;
            if (strpos($dateValue, 'T') !== false) {
                $dateOnly = explode('T', $dateValue)[0];
            } else {
                $dateOnly = explode(' ', $dateValue)[0];
            }

            $transaction = Transaction::create([
                'user_id' => $request->user()->id,
                'account_id' => $request->account_id,
                'category_id' => $request->category_id,
                'type' => $request->type,
                'amount' => $request->amount,
                'description' => $request->description,
                'date' => $dateOnly,
            ]);

            ActivityLog::log($request->user()->id, 'create_transaction', ['transaction_id' => $transaction->id, 'amount' => $transaction->amount, 'type' => $transaction->type], $request);

            try {
                $this->recalculateBalance($request->user()->id);
            } catch (\Exception $e) {
                Log::error('recalculateBalance failed: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'transaction' => $transaction->load('account:id,name', 'category:id,name')]);
        } catch (\Exception $e) {
            Log::error('TransactionController@store: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Transaction $transaction)
    {
        try {
            Log::info('TransactionController@update - Request data: ' . json_encode($request->all()));
            Log::info('TransactionController@update - Transaction ID: ' . $transaction->id . ', User ID: ' . $request->user()->id . ', Transaction User ID: ' . $transaction->user_id);

            if ($transaction->user_id !== $request->user()->id) {
                abort(403);
            }

            $validated = $request->validate([
                'account_id' => 'nullable|exists:accounts,id',
                'category_id' => 'nullable|exists:categories,id',
                'type' => 'required|in:income,expense,transfer',
                'amount' => 'required|numeric|min:0',
                'description' => 'nullable|string|max:255',
                'date' => 'required|date',
            ]);

            Log::info('TransactionController@update - Validation passed');

            $data = $request->only('account_id', 'category_id', 'type', 'amount', 'description');
            // Handle both ISO format (2026-07-01T00:00:00.000000Z) and yyyy-MM-dd HH:mm:ss format
            $dateValue = $request->date;
            if (strpos($dateValue, 'T') !== false) {
                $data['date'] = explode('T', $dateValue)[0];
            } else {
                $data['date'] = explode(' ', $dateValue)[0];
            }
            $transaction->update($data);

            ActivityLog::log($request->user()->id, 'update_transaction', ['transaction_id' => $transaction->id], $request);

            try {
                $this->recalculateBalance($request->user()->id);
            } catch (\Exception $e) {
                Log::error('recalculateBalance failed: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'transaction' => $transaction->fresh()->load('account:id,name', 'category:id,name')]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('TransactionController@update - Validation failed: ' . json_encode($e->errors()));
            return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            Log::error('TransactionController@update: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(Request $request, Transaction $transaction)
    {
        try {
            if ($transaction->user_id !== $request->user()->id) {
                abort(403);
            }

            ActivityLog::log($request->user()->id, 'delete_transaction', ['transaction_id' => $transaction->id], $request);

            $transaction->delete();

            try {
                $this->recalculateBalance($request->user()->id);
            } catch (\Exception $e) {
                Log::error('recalculateBalance failed: ' . $e->getMessage());
            }

            return response()->json(['success' => true, 'message' => 'Transaction deleted.']);
        } catch (\Exception $e) {
            Log::error('TransactionController@destroy: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    protected function recalculateBalance($userId)
    {
        $accounts = Account::where('user_id', $userId)->get();
        foreach ($accounts as $account) {
            $balance = (float)$account->initial_balance;
            $incomes = Transaction::where('user_id', $userId)->where('account_id', $account->id)->where('type', 'income')->sum('amount');
            $expenses = Transaction::where('user_id', $userId)->where('account_id', $account->id)->where('type', 'expense')->sum('amount');
            $transferOuts = Transaction::where('user_id', $userId)->where('account_id', $account->id)->where('type', 'transfer')->sum('amount');
            $balance += $incomes - $expenses - $transferOuts;
            $account->update(['balance' => max($balance, 0)]);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Transaction;
use App\Models\Account;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $transactions = Transaction::where('user_id', $request->user()->id)
            ->active()
            ->with('account:id,name', 'category:id,name')
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        return response()->json(['success' => true, 'transactions' => $transactions]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'account_id' => 'nullable|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'type' => 'required|in:income,expense,transfer',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date' => 'required|date',
        ]);

        $dateOnly = explode(' ', $request->date)[0];

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
            \Log::error('recalculateBalance failed: ' . $e->getMessage());
        }

        return response()->json(['success' => true, 'transaction' => $transaction->load('account:id,name', 'category:id,name')]);
    }

    public function update(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'account_id' => 'nullable|exists:accounts,id',
            'category_id' => 'nullable|exists:categories,id',
            'type' => 'required|in:income,expense,transfer',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
            'date' => 'required|date',
        ]);

        $data = $request->only('account_id', 'category_id', 'type', 'amount', 'description');
        $data['date'] = explode(' ', $request->date)[0];
        $transaction->update($data);

        ActivityLog::log($request->user()->id, 'update_transaction', ['transaction_id' => $transaction->id], $request);

        try {
            $this->recalculateBalance($request->user()->id);
        } catch (\Exception $e) {
            \Log::error('recalculateBalance failed: ' . $e->getMessage());
        }

        return response()->json(['success' => true, 'transaction' => $transaction->fresh()->load('account:id,name', 'category:id,name')]);
    }

    public function destroy(Request $request, Transaction $transaction)
    {
        if ($transaction->user_id !== $request->user()->id) {
            abort(403);
        }

        ActivityLog::log($request->user()->id, 'delete_transaction', ['transaction_id' => $transaction->id], $request);

        $transaction->delete();

        try {
            $this->recalculateBalance($request->user()->id);
        } catch (\Exception $e) {
            \Log::error('recalculateBalance failed: ' . $e->getMessage());
        }

        return response()->json(['success' => true, 'message' => 'Transaction deleted.']);
    }

    protected function recalculateBalance($userId)
    {
        $accounts = Account::where('user_id', $userId)->get();
        foreach ($accounts as $account) {
            $balance = (float)$account->initial_balance;
            $incomes = Transaction::where('user_id', $userId)->where('account_id', $account->id)->where('type', 'income')->active()->sum('amount');
            $expenses = Transaction::where('user_id', $userId)->where('account_id', $account->id)->where('type', 'expense')->active()->sum('amount');
            $transferOuts = Transaction::where('user_id', $userId)->where('account_id', $account->id)->where('type', 'transfer')->active()->sum('amount');
            $balance += $incomes - $expenses - $transferOuts;
            $account->update(['balance' => max($balance, 0)]);
        }
    }
}
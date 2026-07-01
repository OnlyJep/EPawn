<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\ActivityLog;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AccountController extends Controller
{
    public function index(Request $request)
    {
        $accounts = Account::where('user_id', $request->user()->id)
            ->active()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json(['success' => true, 'accounts' => $accounts]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('accounts', 'name')->where('user_id', $request->user()->id)],
            'initial_balance' => 'nullable|numeric',
            'icon' => 'nullable|string|max:50',
        ]);

        $account = Account::create([
            'user_id' => $request->user()->id,
            'name' => $request->name,
            'initial_balance' => $request->initial_balance ?? 0,
            'balance' => $request->initial_balance ?? 0,
            'icon' => $request->icon,
            'sort_order' => Account::where('user_id', $request->user()->id)->max('sort_order') + 1,
        ]);

        ActivityLog::log($request->user()->id, 'create_account', ['account_id' => $account->id, 'name' => $account->name], $request);

        return response()->json(['success' => true, 'account' => $account]);
    }

    public function update(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('accounts', 'name')->where('user_id', $request->user()->id)->ignore($account->id)],
            'initial_balance' => 'nullable|numeric',
            'icon' => 'nullable|string|max:50',
        ]);

        $data = $request->only('name', 'initial_balance', 'icon');
        if ($request->has('initial_balance')) {
            $data['balance'] = $request->initial_balance;
        }
        $account->update($data);

        ActivityLog::log($request->user()->id, 'update_account', ['account_id' => $account->id, 'name' => $account->name], $request);

        return response()->json(['success' => true, 'account' => $account]);
    }

    public function destroy(Request $request, Account $account)
    {
        if ($account->user_id !== $request->user()->id) {
            abort(403);
        }

        ActivityLog::log($request->user()->id, 'delete_account', ['account_id' => $account->id, 'name' => $account->name], $request);
        Transaction::where('account_id', $account->id)->update(['account_id' => null]);
        $account->delete();

        return response()->json(['success' => true, 'message' => 'Account deleted.']);
    }
}
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Budget;
use App\Models\Category;
use App\Models\Transaction;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $now = now();

        $accounts = $user->accounts()->orderBy('sort_order')->get();
        $recentTransactions = $user->transactions()
            ->whereNull('archived_at')
            ->with(['account:id,name', 'category:id,name,icon'])
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->take(10)
            ->get();

        $totalBalance = $accounts->sum('balance');
        $totalIncome = $user->transactions()->where('type', 'income')->whereNull('archived_at')->sum('amount');
        $totalExpenses = $user->transactions()->where('type', 'expense')->whereNull('archived_at')->sum('amount');

        $monthStart = $now->copy()->startOfMonth();
        $monthlyIncome = $user->transactions()
            ->where('type', 'income')->whereNull('archived_at')
            ->where('date', '>=', $monthStart)
            ->sum('amount');
        $monthlyExpenses = $user->transactions()
            ->where('type', 'expense')->whereNull('archived_at')
            ->where('date', '>=', $monthStart)
            ->sum('amount');

        return response()->json([
            'success' => true,
            'stats' => [
                'totalBalance' => round($totalBalance, 2),
                'totalIncome' => round($totalIncome, 2),
                'totalExpenses' => round($totalExpenses, 2),
                'monthlyIncome' => round($monthlyIncome, 2),
                'monthlyExpenses' => round($monthlyExpenses, 2),
                'accountCount' => $accounts->count(),
                'transactionCount' => $user->transactions()->whereNull('archived_at')->count(),
            ],
            'accounts' => $accounts,
            'recentTransactions' => $recentTransactions,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Category;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\Budget;
use App\Models\BudgetPlan;
use App\Models\Profile;
use App\Models\DeletionReason;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class AdminController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required',
            'password' => 'required',
        ]);

        $adminUser = config('admin.credentials');

        if (
            $request->username !== $adminUser['username'] ||
            $request->password !== $adminUser['password']
        ) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        $request->session()->put('admin_logged_in', true);
        $request->session()->put('admin_username', $adminUser['username']);

        return response()->json(['message' => 'Login successful']);
    }

    public function logout(Request $request)
    {
        $request->session()->forget(['admin_logged_in', 'admin_username']);
        return response()->json(['message' => 'Logged out']);
    }

    public function check(Request $request)
    {
        if ($request->session()->get('admin_logged_in')) {
            return response()->json(['authenticated' => true, 'username' => $request->session()->get('admin_username')]);
        }
        return response()->json(['authenticated' => false], 401);
    }

    public function dashboard()
    {
        $totalUsers = User::count();
        $activeUsers = User::whereNull('archived_at')->count();
        $archivedUsers = User::whereNotNull('archived_at')->count();
        $totalCategories = Category::count();
        $activeCategories = Category::whereNull('archived_at')->count();
        $archivedCategories = Category::whereNotNull('archived_at')->count();
        $totalAccounts = Account::count();
        $totalBudgetPlans = BudgetPlan::count();

        $usersJoinedToday = User::whereDate('created_at', Carbon::today())->count();
        $usersThisMonth = User::whereMonth('created_at', Carbon::now()->month)->whereYear('created_at', Carbon::now()->year)->count();

        $recentUsers = User::with('profile')->latest()->take(5)->get()->map(function ($u) {
            return [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email,
                'created_at' => $u->created_at,
                'archived_at' => $u->archived_at,
                'avatar' => $u->profile->avatar ?? null,
            ];
        });

        return response()->json([
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'archived_users' => $archivedUsers,
            'total_categories' => $totalCategories,
            'active_categories' => $activeCategories,
            'archived_categories' => $archivedCategories,
            'total_accounts' => $totalAccounts,
            'total_budget_plans' => $totalBudgetPlans,
            'users_joined_today' => $usersJoinedToday,
            'users_this_month' => $usersThisMonth,
            'recent_users' => $recentUsers,
        ]);
    }

    public function users(Request $request)
    {
        $query = User::with('profile')->withCount(['categories', 'accounts', 'transactions', 'budgets', 'budgetPlans']);

        // Filter by archived status
        if ($request->status === 'archived') {
            $query->whereNotNull('archived_at');
        } elseif ($request->status === 'active') {
            $query->whereNull('archived_at');
        }

        $users = $query->latest()->get()->map(function ($u) {
            $canSeePassword = $u->password && $u->google_id === null;
            return [
                'id' => $u->id,
                'username' => $u->username,
                'email' => $u->email,
                'google_id' => $u->google_id,
                'has_password' => $canSeePassword,
                'password_hash' => $canSeePassword ? $u->password : null,
                'archived_at' => $u->archived_at,
                'created_at' => $u->created_at,
                'avatar' => $u->profile->avatar ?? null,
                'categories_count' => $u->categories_count,
                'accounts_count' => $u->accounts_count,
                'transactions_count' => $u->transactions_count,
                'budgets_count' => $u->budgets_count,
                'budget_plans_count' => $u->budget_plans_count,
            ];
        });

        return response()->json(['users' => $users]);
    }

    public function userShow($id)
    {
        $user = User::with('profile')->withCount(['categories', 'accounts', 'transactions', 'budgets', 'budgetPlans'])->findOrFail($id);

        $accounts = Account::where('user_id', $id)->get();
        $categories = Category::where('user_id', $id)->get();
        $transactions = Transaction::where('user_id', $id)->latest()->take(50)->get();
        $budgets = Budget::where('user_id', $id)->get();
        $budgetPlans = BudgetPlan::with('items')->where('user_id', $id)->get();

        $canSeePassword = $user->password && $user->google_id === null;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'google_id' => $user->google_id,
                'has_password' => $canSeePassword,
                'password_hash' => $canSeePassword ? $user->password : null,
                'archived_at' => $user->archived_at,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'avatar' => $user->profile->avatar ?? null,
                'categories_count' => $user->categories_count,
                'accounts_count' => $user->accounts_count,
                'transactions_count' => $user->transactions_count,
                'budgets_count' => $user->budgets_count,
                'budget_plans_count' => $user->budget_plans_count,
            ],
            'accounts' => $accounts,
            'categories' => $categories,
            'transactions' => $transactions,
            'budgets' => $budgets,
            'budget_plans' => $budgetPlans,
        ]);
    }

    public function userArchive($id)
    {
        $user = User::findOrFail($id);
        if ($user->archived_at) {
            $user->update(['archived_at' => null]);
            $message = 'User restored successfully.';
        } else {
            $user->update(['archived_at' => now()]);
            $message = 'User archived successfully.';
        }
        return response()->json(['message' => $message]);
    }

    public function userUpdate(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'username' => 'sometimes|string|max:255|unique:users,username,' . $id,
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $id,
        ]);

        $user->update($request->only('username', 'email'));

        return response()->json(['message' => 'User updated successfully.', 'user' => $user]);
    }

    public function categories(Request $request)
    {
        $query = Category::with('user:id,username,email');

        if ($request->status === 'archived') {
            $query->whereNotNull('archived_at');
        } elseif ($request->status === 'active') {
            $query->whereNull('archived_at');
        }

        $categories = $query->latest()->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'name' => $c->name,
                'type' => $c->type,
                'icon' => $c->icon,
                'user_id' => $c->user_id,
                'username' => $c->user->username ?? 'N/A',
                'archived_at' => $c->archived_at,
                'created_at' => $c->created_at,
            ];
        });

        return response()->json(['categories' => $categories]);
    }

    public function categoryArchive($id)
    {
        $category = Category::findOrFail($id);
        if ($category->archived_at) {
            $category->update(['archived_at' => null]);
            $message = 'Category restored successfully.';
        } else {
            $category->update(['archived_at' => now()]);
            $message = 'Category archived successfully.';
        }
        return response()->json(['message' => $message]);
    }

    public function categoryUpdate(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'type' => 'sometimes|in:income,expense',
        ]);

        $category->update($request->only('name', 'type'));

        return response()->json(['message' => 'Category updated successfully.', 'category' => $category]);
    }

    public function deletionReasons()
    {
        $reasons = DeletionReason::latest()->get();
        return response()->json(['reasons' => $reasons]);
    }

    public function activityLogs(Request $request)
    {
        $query = ActivityLog::with('user:id,username,email');

        if ($request->action) {
            $query->where('action', $request->action);
        }
        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $logs = $query->latest()->take(200)->get()->map(function ($log) {
            return [
                'id' => $log->id,
                'user_id' => $log->user_id,
                'username' => $log->user->username ?? 'Guest',
                'email' => $log->user->email ?? '',
                'action' => $log->action,
                'details' => $log->details,
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at,
            ];
        });

        $actionCounts = ActivityLog::selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->orderByDesc('count')
            ->get();

        $logsToday = ActivityLog::whereDate('created_at', Carbon::today())->count();

        return response()->json([
            'logs' => $logs,
            'action_counts' => $actionCounts,
            'logs_today' => $logsToday,
        ]);
    }

    public function budgetPlans()
    {
        $plans = BudgetPlan::with('user:id,username,email', 'items')->latest()->get()->map(function ($p) {
            return [
                'id' => $p->id,
                'name' => $p->name,
                'budget' => $p->budget,
                'month' => $p->month,
                'year' => $p->year,
                'user' => ['id' => $p->user_id, 'username' => $p->user->username ?? 'N/A', 'email' => $p->user->email ?? ''],
                'items' => $p->items->map(function ($i) {
                    return ['id' => $i->id, 'name' => $i->name, 'category' => $i->category, 'amount' => $i->amount];
                }),
                'created_at' => $p->created_at,
            ];
        });

        return response()->json(['plans' => $plans]);
    }

    public function transactions(Request $request)
    {
        $query = Transaction::with('user:id,username,email', 'account:id,name', 'category:id,name,type');

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }
        if ($request->type) {
            $query->where('type', $request->type);
        }

        $transactions = $query->latest()->get()->map(function ($t) {
            return [
                'id' => $t->id,
                'user_id' => $t->user_id,
                'username' => $t->user->username ?? 'N/A',
                'email' => $t->user->email ?? '',
                'description' => $t->description,
                'type' => $t->type,
                'amount' => $t->amount,
                'category' => $t->category ? ['id' => $t->category->id, 'name' => $t->category->name, 'type' => $t->category->type] : null,
                'account' => $t->account ? ['id' => $t->account->id, 'name' => $t->account->name] : null,
                'created_at' => $t->created_at,
            ];
        });

        return response()->json(['transactions' => $transactions]);
    }

    public function budgetPlanUpdate(Request $request, $id)
    {
        $plan = BudgetPlan::findOrFail($id);
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'budget' => 'sometimes|numeric|min:0',
        ]);
        $plan->update($request->only('name', 'budget'));
        return response()->json(['message' => 'Budget plan updated successfully.']);
    }

    // ─── Admin CRUD for categories ────────────────────────────────────
    public function createCategory(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'type' => 'required|in:income,expense',
        ]);
        $category = Category::create($request->only('user_id', 'name', 'type'));
        return response()->json(['message' => 'Category created.', 'category' => $category]);
    }

    public function deleteCategory($id)
    {
        $category = Category::findOrFail($id);
        $category->update(['archived_at' => now()]);
        return response()->json(['message' => 'Category archived.']);
    }

    // ─── Admin CRUD for accounts ──────────────────────────────────────
    public function updateAccount(Request $request, $id)
    {
        $account = Account::findOrFail($id);
        $request->validate([
            'name' => 'sometimes|string|max:255',
            'balance' => 'sometimes|numeric',
            'icon' => 'sometimes|string',
        ]);
        $account->update($request->only('name', 'balance', 'icon'));
        return response()->json(['message' => 'Account updated.', 'account' => $account]);
    }

    public function deleteAccount($id)
    {
        $account = Account::findOrFail($id);
        $account->delete();
        return response()->json(['message' => 'Account deleted.']);
    }

    // ─── Admin CRUD for budget plans ──────────────────────────────────
    public function createBudgetPlan(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'name' => 'required|string|max:255',
            'budget' => 'required|numeric|min:0',
            'month' => 'required|integer|between:1,12',
            'year' => 'required|integer|min:2020',
        ]);
        $plan = BudgetPlan::create($request->only('user_id', 'name', 'budget', 'month', 'year'));
        return response()->json(['message' => 'Budget plan created.', 'plan' => $plan]);
    }

    public function deleteBudgetPlan($id)
    {
        $plan = BudgetPlan::findOrFail($id);
        $plan->items()->delete();
        $plan->delete();
        return response()->json(['message' => 'Budget plan deleted.']);
    }
}

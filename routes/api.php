<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\BudgetPlanController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardCardController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::post('login', [AuthController::class, 'login']);
Route::post('register', [AuthController::class, 'register']);
Route::post('forgot-password/reset', [ForgotPasswordController::class, 'reset']);
Route::get('check-username', [AuthController::class, 'checkUsername']);
Route::get('check-email', [AuthController::class, 'checkEmail']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('user', [AuthController::class, 'user']);
    Route::get('dashboard', function (\Illuminate\Http\Request $request) {
    $user = $request->user()->load('profile');
    $totalSaved = $user->accounts()->sum('balance');
    $incomeLogged = $user->transactions()->where('type', 'income')->sum('amount');
    $activeLoans = $user->transactions()->where('type', 'expense')->sum('amount');

    return response()->json([
        'success' => true,
        'user' => $user,
        'logo' => asset('img/EPAWNlogo.png'),
        'defaultAvatar' => asset('img/defpfp.webp'),
        'csrf' => csrf_token(),
        'routes' => [
            'home' => url('/'),
            'dashboard' => url('/dashboard'),
            'logout' => url('/api/logout'),
            'updateProfile' => url('/api/settings/profile'),
            'updatePassword' => url('/api/settings/password'),
        ],
        'stats' => [
            'totalSaved' => round($totalSaved, 2),
            'activeLoans' => round($activeLoans, 2),
            'incomeLogged' => round($incomeLogged, 2),
            'dynamicStats' => [],
        ],
        'flash' => [
            'settingsSuccess' => session('settings_success'),
            'openSettings' => session('open_settings', false),
        ],
        'errors' => session('errors') ? session('errors')->getMessages() : [],
        'old' => session()->getOldInput(),
    ]);
});
    Route::get('dashboard-data', [DashboardController::class, 'index']);
    Route::get('dashboard-cards', [DashboardCardController::class, 'index']);
    Route::post('dashboard-cards', [DashboardCardController::class, 'store']);
    Route::put('dashboard-cards/{dashboard_card}', [DashboardCardController::class, 'update']);
    Route::delete('dashboard-cards/{dashboard_card}', [DashboardCardController::class, 'destroy']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('settings/profile', [SettingsController::class, 'updateProfile']);
    Route::post('settings/password', [SettingsController::class, 'updatePassword']);
    Route::post('user/delete', [SettingsController::class, 'deleteAccount']);

    Route::get('categories', [CategoryController::class, 'index']);
    Route::post('categories', [CategoryController::class, 'store']);
    Route::put('categories/{category}', [CategoryController::class, 'update']);
    Route::delete('categories/{category}', [CategoryController::class, 'destroy']);

    Route::get('accounts', [AccountController::class, 'index']);
    Route::post('accounts', [AccountController::class, 'store']);
    Route::put('accounts/{account}', [AccountController::class, 'update']);
    Route::delete('accounts/{account}', [AccountController::class, 'destroy']);

    Route::get('transactions', [TransactionController::class, 'index']);
    Route::post('transactions', [TransactionController::class, 'store']);
    Route::put('transactions/{transaction}', [TransactionController::class, 'update']);
    Route::delete('transactions/{transaction}', [TransactionController::class, 'destroy']);

    Route::get('budgets', [BudgetController::class, 'index']);
    Route::post('budgets', [BudgetController::class, 'store']);
    Route::put('budgets/{budget}', [BudgetController::class, 'update']);
    Route::delete('budgets/{budget}', [BudgetController::class, 'destroy']);

    Route::get('budget-plans', [BudgetPlanController::class, 'index']);
    Route::post('budget-plans', [BudgetPlanController::class, 'store']);
    Route::get('budget-plans/{plan}', [BudgetPlanController::class, 'show']);
    Route::put('budget-plans/{plan}', [BudgetPlanController::class, 'update']);
    Route::delete('budget-plans/{plan}', [BudgetPlanController::class, 'destroy']);
    Route::post('budget-plans/{plan}/items', [BudgetPlanController::class, 'storeItem']);
    Route::put('budget-plans/{plan}/items/{item}', [BudgetPlanController::class, 'updateItem']);
    Route::delete('budget-plans/{plan}/items/{item}', [BudgetPlanController::class, 'destroyItem']);
});

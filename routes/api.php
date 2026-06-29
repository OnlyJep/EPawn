<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BootstrapController;
use App\Http\Controllers\Api\BudgetController;
use App\Http\Controllers\Api\BudgetPlanController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardCardController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ForgotPasswordController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\TransactionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/bootstrap', [BootstrapController::class, 'landing']);

    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/forgot-password/reset', [ForgotPasswordController::class, 'reset']);
    Route::get('/check-username', [AuthController::class, 'checkUsername']);
    Route::get('/check-email', [AuthController::class, 'checkEmail']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/dashboard', [BootstrapController::class, 'dashboard']);
        Route::get('/dashboard-data', [DashboardController::class, 'index']);
        Route::get('/dashboard-cards', [DashboardCardController::class, 'index']);
        Route::post('/dashboard-cards', [DashboardCardController::class, 'store']);
        Route::put('/dashboard-cards/{dashboard_card}', [DashboardCardController::class, 'update']);
        Route::delete('/dashboard-cards/{dashboard_card}', [DashboardCardController::class, 'destroy']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/settings/profile', [SettingsController::class, 'updateProfile']);
        Route::post('/settings/password', [SettingsController::class, 'updatePassword']);
        Route::post('/user/delete', [SettingsController::class, 'deleteAccount']);

        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        Route::get('/accounts', [AccountController::class, 'index']);
        Route::post('/accounts', [AccountController::class, 'store']);
        Route::put('/accounts/{account}', [AccountController::class, 'update']);
        Route::delete('/accounts/{account}', [AccountController::class, 'destroy']);

        Route::get('/transactions', [TransactionController::class, 'index']);
        Route::post('/transactions', [TransactionController::class, 'store']);
        Route::put('/transactions/{transaction}', [TransactionController::class, 'update']);
        Route::delete('/transactions/{transaction}', [TransactionController::class, 'destroy']);

        Route::get('/budgets', [BudgetController::class, 'index']);
        Route::post('/budgets', [BudgetController::class, 'store']);
        Route::put('/budgets/{budget}', [BudgetController::class, 'update']);
        Route::delete('/budgets/{budget}', [BudgetController::class, 'destroy']);

        Route::get('/budget-plans', [BudgetPlanController::class, 'index']);
        Route::post('/budget-plans', [BudgetPlanController::class, 'store']);
        Route::get('/budget-plans/{budget_plan}', [BudgetPlanController::class, 'show']);
        Route::put('/budget-plans/{budget_plan}', [BudgetPlanController::class, 'update']);
        Route::delete('/budget-plans/{budget_plan}', [BudgetPlanController::class, 'destroy']);
        Route::post('/budget-plans/{budget_plan}/items', [BudgetPlanController::class, 'storeItem']);
        Route::put('/budget-plans/{budget_plan}/items/{item}', [BudgetPlanController::class, 'updateItem']);
        Route::delete('/budget-plans/{budget_plan}/items/{item}', [BudgetPlanController::class, 'destroyItem']);
    });
});

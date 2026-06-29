<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\AdminController;
use Illuminate\Support\Facades\Route;

Route::view('/', 'welcome');
Route::view('/features', 'welcome');
Route::view('/how-it-works', 'welcome');
Route::view('/about', 'welcome');
Route::view('/help-center', 'welcome');
Route::view('/privacy-policy', 'welcome');
Route::view('/terms-of-service', 'welcome');

Route::get('/login', function () {
    return redirect('/');
});
Route::get('/register', function () {
    return redirect('/');
});

Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

Route::prefix('api/v1')->group(function () {
    Route::get('/auth/google', [AuthController::class, 'googleRedirect'])->name('auth.google');
    Route::get('/auth/google/callback', [AuthController::class, 'googleCallback'])->name('auth.google.callback');
});

Route::get('/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('email.verify');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/budget-planning', [DashboardController::class, 'index'])->name('budget-planning');
    Route::post('/settings/profile', [SettingsController::class, 'updateProfile'])->name('settings.profile');
    Route::post('/settings/password', [SettingsController::class, 'updatePassword'])->name('settings.password');
});

// Admin Portal
Route::prefix('admin')->group(function () {
    Route::post('/login', [AdminController::class, 'login']);
    Route::post('/logout', [AdminController::class, 'logout']);
    Route::get('/check', [AdminController::class, 'check']);

    Route::middleware('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::get('/users/{id}', [AdminController::class, 'userShow']);
        Route::post('/users/{id}/archive', [AdminController::class, 'userArchive']);
        Route::post('/users/{id}/edit', [AdminController::class, 'userUpdate']);
        Route::get('/categories', [AdminController::class, 'categories']);
        Route::post('/categories/{id}/archive', [AdminController::class, 'categoryArchive']);
        Route::post('/categories/{id}/edit', [AdminController::class, 'categoryUpdate']);
        Route::get('/deletion-reasons', [AdminController::class, 'deletionReasons']);
        Route::get('/transactions', [AdminController::class, 'transactions']);
        Route::get('/activity-logs', [AdminController::class, 'activityLogs']);
        Route::get('/budget-plans', [AdminController::class, 'budgetPlans']);
        Route::post('/budget-plans/create', [AdminController::class, 'createBudgetPlan']);
        Route::post('/budget-plans/{id}/edit', [AdminController::class, 'budgetPlanUpdate']);
        Route::post('/budget-plans/{id}/delete', [AdminController::class, 'deleteBudgetPlan']);
        Route::post('/categories/create', [AdminController::class, 'createCategory']);
        Route::post('/categories/{id}/delete', [AdminController::class, 'deleteCategory']);
        Route::post('/accounts/{id}/edit', [AdminController::class, 'updateAccount']);
        Route::post('/accounts/{id}/delete', [AdminController::class, 'deleteAccount']);
    });
});

Route::view('/adminportal', 'admin');

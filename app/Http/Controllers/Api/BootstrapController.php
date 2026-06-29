<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class BootstrapController extends Controller
{
    public function landing(Request $request)
    {
        $errors = session('errors');
        $errorMessages = $errors ? $errors->getMessages() : [];

        $openModal = '';
        if (! empty($errorMessages)) {
            $openModal = isset($errorMessages['login']) ? 'login' : 'register';
        } elseif (session('open_modal')) {
            $openModal = session('open_modal');
        }

        return response()->json([
            'success' => true,
            'user' => null,
            'logo' => asset('img/EPAWNlogo.png'),
            'csrf' => csrf_token(),
            'routes' => [
                'home' => url('/'),
                'features' => url('/features'),
                'howItWorks' => url('/how-it-works'),
                'about' => url('/about'),
                'helpCenter' => url('/help-center'),
                'privacyPolicy' => url('/privacy-policy'),
                'termsOfService' => url('/terms-of-service'),
                'login' => url('/api/v1/login'),
                'register' => url('/api/v1/register'),
                'logout' => url('/api/v1/logout'),
                'dashboard' => route('dashboard'),
            ],
            'errors' => $errorMessages,
            'old' => session()->getOldInput(),
            'openModal' => $openModal,
            'year' => (int) date('Y'),
        ]);
    }

    public function dashboard(Request $request)
    {
        $user = auth()->user()->load('profile');

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
                'dashboard' => route('dashboard'),
                'logout' => url('/api/v1/logout'),
                'updateProfile' => url('/api/v1/settings/profile'),
                'updatePassword' => url('/api/v1/settings/password'),
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
    }
}

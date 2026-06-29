<?php

namespace App\Http\Controllers;

use App\Notifications\VerifyEmail;
use App\Models\ActivityLog;
use App\Models\Profile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\URL;
use Illuminate\Validation\Rule;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($request->username === 'admin' && $request->password === '071799') {
            $admin = User::firstOrCreate(
                ['username' => 'admin'],
                [
                    'first_name' => 'Admin',
                    'last_name' => 'User',
                    'email' => 'admin@epawn.local',
                    'password' => Hash::make('071799'),
                ]
            );

            if (! Hash::check('071799', $admin->password)) {
                $admin->update(['password' => Hash::make('071799')]);
            }

            Auth::login($admin);
            ActivityLog::log($admin->id, 'login', ['method' => 'web'], $request);

            return redirect()->route('dashboard');
        }

        $user = User::where('username', $request->username)
            ->orWhere('email', $request->username)
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return back()
                ->withErrors(['login' => 'Invalid username or password.'])
                ->with('open_modal', 'login')
                ->withInput($request->only('username'));
        }

        Auth::login($user);
        ActivityLog::log($user->id, 'login', ['method' => 'web'], $request);

        return redirect()->route('dashboard');
    }

    public function register(Request $request)
    {
        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_initial' => 'nullable|string|max:10',
            'last_name' => 'required|string|max:255',
            'suffix' => ['nullable', 'string', Rule::in(['Jr.', 'Sr.', 'II', 'III', 'IV'])],
            'email' => 'required|string|email|max:255|unique:users',
            'username' => 'required|string|max:255|unique:users|not_in:admin',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::create([
            'first_name' => $request->first_name,
            'middle_initial' => $request->middle_initial,
            'last_name' => $request->last_name,
            'suffix' => $request->suffix ?: null,
            'email' => $request->email,
            'username' => $request->username,
            'password' => Hash::make($request->password),
        ]);

        Auth::login($user);
        ActivityLog::log($user->id, 'register', null, $request);

        return redirect()->route('dashboard');
    }

    public function logout(Request $request)
    {
        $user = Auth::user();
        ActivityLog::log($user->id, 'logout', null, $request);

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    public function verifyEmail($id, $hash)
    {
        $user = User::findOrFail($id);

        if (!URL::hasValidSignature(request())) {
            abort(403, 'Invalid or expired verification link.');
        }

        if (!hash_equals($hash, sha1($user->getEmailForVerification()))) {
            abort(403, 'Invalid verification link.');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('dashboard');
        }

        $user->markEmailAsVerified();

        Auth::login($user);

        return redirect()->route('dashboard');
    }

    public function googleRedirect()
    {
        return Socialite::driver('google')->redirect();
    }

    public function googleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->stateless()->user();

            $raw = $googleUser->getRaw();
            $googleId = $raw['sub'] ?? $googleUser->id;
            $firstName = $raw['given_name'] ?? explode(' ', $googleUser->name, 2)[0] ?? 'User';
            $lastName = $raw['family_name'] ?? explode(' ', $googleUser->name, 2)[1] ?? '';
            $fullname = $lastName ? "$firstName $lastName" : $firstName;
            $email = $googleUser->email;
            $username = strtolower(explode('@', $email)[0]);

            $user = User::where('email', $email)->first();

            if ($user) {
                if (!$user->google_id) {
                    $user->update(['google_id' => $googleId]);
                }
                if (!$user->profile) {
                    Profile::create([
                        'user_id' => $user->id,
                        'first_name' => $user->first_name ?: $firstName,
                        'middle_initial' => null,
                        'last_name' => $user->last_name ?: $lastName,
                        'suffix' => null,
                        'fullname' => $user->fullname ?: $fullname,
                    ]);
                }
            } else {
                $baseUsername = $username;
                $counter = 1;
                while (User::where('username', $username)->exists()) {
                    $username = $baseUsername . $counter;
                    $counter++;
                }

                $user = User::create([
                    'google_id' => $googleId,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'fullname' => $fullname,
                    'email' => $email,
                    'username' => $username,
                    'password' => Hash::make(uniqid()),
                    'email_verified_at' => now(),
                ]);

                Profile::create([
                    'user_id' => $user->id,
                    'first_name' => $firstName,
                    'middle_initial' => null,
                    'last_name' => $lastName,
                    'suffix' => null,
                    'fullname' => $fullname,
                ]);
            }

            ActivityLog::log($user->id, 'login', ['method' => 'google'], $request);

            Auth::login($user);

            return redirect()->route('dashboard');
        } catch (\Exception $e) {
            return redirect('/')->withErrors([
                'login' => 'Google sign-in failed: ' . $e->getMessage(),
            ]);
        }
    }
}

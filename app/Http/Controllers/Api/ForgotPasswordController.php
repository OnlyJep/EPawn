<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ForgotPasswordController extends Controller
{
    public function reset(Request $request)
    {
        $request->validate([
            'username_or_email' => 'required|string',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string|min:6|confirmed',
        ]);

        $user = User::where('username', $request->username_or_email)
            ->orWhere('email', $request->username_or_email)
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'username_or_email' => ['We could not find an account with that username or email.'],
            ]);
        }

        if ($user->username === 'admin') {
            throw ValidationException::withMessages([
                'username_or_email' => ['Please contact support to reset the admin password.'],
            ]);
        }

        $matches = strcasecmp(trim($user->first_name), trim($request->first_name)) === 0
            && strcasecmp(trim($user->last_name), trim($request->last_name)) === 0
            && strcasecmp(trim($user->email), trim($request->email)) === 0;

        if (! $matches) {
            throw ValidationException::withMessages([
                'survey' => ['Your survey answers do not match our records. Please try again.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password reset successfully. You can now sign in with your new password.',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DeletionReason;
use App\Models\Profile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
    public function updateProfile(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'first_name' => 'required|string|max:255',
            'middle_initial' => 'nullable|string|max:1',
            'last_name' => 'required|string|max:255',
            'suffix' => ['nullable', 'string', Rule::in(['Jr.', 'Sr.', 'II', 'III', 'IV'])],
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users', 'username')->ignore($user->id),
                Rule::notIn(['admin']),
            ],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
        ]);

        try {
            $user->update([
                'username' => $request->username,
                'email' => $request->email,
            ]);

            $fullname = $request->last_name
                ? "{$request->first_name} {$request->last_name}"
                : $request->first_name;

            $profile = Profile::firstOrCreate(['user_id' => $user->id]);
            $profile->update([
                'first_name' => $request->first_name,
                'middle_initial' => $request->middle_initial,
                'last_name' => $request->last_name,
                'suffix' => $request->suffix ?: null,
                'fullname' => $fullname,
            ]);

            if ($request->hasFile('avatar')) {
                $path = $request->file('avatar')->store('avatars', 'public');
                $profile->update(['avatar' => $path]);
            }

            $user->refresh();

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully.',
                'user' => $user->load('profile'),
            ]);
        } catch (\Illuminate\Database\QueryException $e) {
            \Illuminate\Support\Facades\Log::error("Profile update DB error for user {$user->id}: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Database error: ' . $e->getMessage()], 500);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("Profile update error for user {$user->id}: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function updatePassword(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:6|confirmed',
        ]);

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully.',
        ]);
    }

    public function deleteAccount(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'reason' => 'nullable|string|max:5000',
        ]);

        DeletionReason::create([
            'email' => $user->email,
            'reason' => $request->reason,
        ]);

        $user->delete();

        if ($request->hasSession()) {
            auth()->guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'message' => 'Account deleted successfully.',
            'redirect' => url('/'),
        ]);
    }
}

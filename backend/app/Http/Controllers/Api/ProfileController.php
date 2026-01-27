<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * Get user profile.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['socialAccounts:id,user_id,provider,nickname,avatar']);

        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Update user profile.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'avatar' => ['sometimes', 'nullable', 'url', 'max:500'],
        ]);

        // Check if email is being changed
        $emailChanged = isset($validated['email']) && $validated['email'] !== $user->email;

        if ($emailChanged) {
            $validated['email_verified_at'] = null;
        }

        $user->update($validated);

        if ($emailChanged) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user,
            'email_verification_sent' => $emailChanged,
        ]);
    }

    /**
     * Update user password.
     */
    public function updatePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Password updated successfully',
        ]);
    }

    /**
     * Delete user account.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        // Prevent deleting the last admin
        if ($user->isAdmin() && \App\Models\User::where('is_admin', true)->count() === 1) {
            return response()->json([
                'message' => 'Cannot delete the last admin account',
            ], 400);
        }

        // Delete related data
        $user->socialAccounts()->delete();
        $user->settings()->delete();
        $user->notifications()->delete();
        $user->aiProviders()->delete();

        $user->delete();

        return response()->json([
            'message' => 'Account deleted successfully',
        ]);
    }
}

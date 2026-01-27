<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * List all users with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');

        $query = User::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($users);
    }

    /**
     * Get a specific user.
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'user' => $user->makeHidden(['password', 'two_factor_secret', 'two_factor_recovery_codes']),
        ]);
    }

    /**
     * Create a new user.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            'is_admin' => ['sometimes', 'boolean'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'is_admin' => $validated['is_admin'] ?? false,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => $user->makeHidden(['password', 'two_factor_secret', 'two_factor_recovery_codes']),
        ], 201);
    }

    /**
     * Update a user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => ['sometimes', 'string', 'min:8'],
            'is_admin' => ['sometimes', 'boolean'],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json([
            'message' => 'User updated successfully',
            'user' => $user->makeHidden(['password', 'two_factor_secret', 'two_factor_recovery_codes'])->fresh(),
        ]);
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent deleting the last admin
        if ($user->isAdmin() && User::where('is_admin', true)->count() === 1) {
            return response()->json([
                'message' => 'Cannot delete the last admin account',
            ], 400);
        }

        // Prevent deleting yourself
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Cannot delete your own account',
            ], 400);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully',
        ]);
    }

    /**
     * Toggle admin status.
     */
    public function toggleAdmin(User $user): JsonResponse
    {
        // Prevent removing admin from the last admin
        if ($user->isAdmin() && User::where('is_admin', true)->count() === 1) {
            return response()->json([
                'message' => 'Cannot remove admin status from the last admin account',
            ], 400);
        }

        // Prevent removing admin from yourself
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Cannot remove admin status from your own account',
            ], 400);
        }

        $user->update(['is_admin' => !$user->is_admin]);

        return response()->json([
            'message' => 'Admin status updated successfully',
            'user' => $user->makeHidden(['password', 'two_factor_secret', 'two_factor_recovery_codes'])->fresh(),
        ]);
    }

    /**
     * Reset user password.
     */
    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $user->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json([
            'message' => 'Password reset successfully',
        ]);
    }

    /**
     * Toggle user disabled status (soft delete alternative).
     */
    public function toggleDisabled(User $user): JsonResponse
    {
        // Prevent disabling the last admin
        if ($user->isAdmin() && User::where('is_admin', true)->count() === 1) {
            return response()->json([
                'message' => 'Cannot disable the last admin account',
            ], 400);
        }

        // Prevent disabling yourself
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Cannot disable your own account',
            ], 400);
        }

        // Note: This is a placeholder. You may want to add a 'disabled_at' or 'is_disabled' field
        // For now, we'll just return a message indicating this feature needs implementation
        return response()->json([
            'message' => 'User disable feature requires additional database field',
        ], 501);
    }
}

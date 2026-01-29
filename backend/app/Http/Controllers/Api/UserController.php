<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\AdminAuthorizationTrait;
use App\Http\Traits\ApiResponseTrait;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    use AdminAuthorizationTrait;
    use ApiResponseTrait;

    /**
     * List all users with pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', config('app.pagination.default'));
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

        return $this->dataResponse($users);
    }

    /**
     * Get a specific user.
     */
    public function show(User $user): JsonResponse
    {
        return $this->dataResponse([
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
            'password' => $validated['password'],
            'is_admin' => $validated['is_admin'] ?? false,
        ]);

        return $this->createdResponse('User created successfully', [
            'user' => $user->makeHidden(['password', 'two_factor_secret', 'two_factor_recovery_codes']),
        ]);
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

        $user->update($validated);

        return $this->successResponse('User updated successfully', [
            'user' => $user->makeHidden(['password', 'two_factor_secret', 'two_factor_recovery_codes'])->fresh(),
        ]);
    }

    /**
     * Delete a user.
     */
    public function destroy(User $user): JsonResponse
    {
        if ($error = $this->ensureNotLastAdmin($user, 'delete')) {
            return $error;
        }

        if ($user->id === auth()->id()) {
            return $this->errorResponse('Cannot delete your own account', 400);
        }

        $user->delete();

        return $this->successResponse('User deleted successfully');
    }

    /**
     * Toggle admin status.
     */
    public function toggleAdmin(User $user): JsonResponse
    {
        if ($error = $this->ensureNotLastAdmin($user, 'remove admin status from')) {
            return $error;
        }

        if ($user->id === auth()->id()) {
            return $this->errorResponse('Cannot remove admin status from your own account', 400);
        }

        $user->update(['is_admin' => !$user->is_admin]);

        return $this->successResponse('Admin status updated successfully', [
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
            'password' => $validated['password'],
        ]);

        return $this->successResponse('Password reset successfully');
    }

    /**
     * Toggle user disabled status (soft delete alternative).
     */
    public function toggleDisabled(User $user): JsonResponse
    {
        if ($error = $this->ensureNotLastAdmin($user, 'disable')) {
            return $error;
        }

        if ($user->id === auth()->id()) {
            return $this->errorResponse('Cannot disable your own account', 400);
        }

        return $this->errorResponse('User disable feature requires additional database field', 501);
    }
}

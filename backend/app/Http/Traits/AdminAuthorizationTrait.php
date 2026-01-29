<?php

namespace App\Http\Traits;

use App\Models\User;
use Illuminate\Http\JsonResponse;

trait AdminAuthorizationTrait
{
    /**
     * Ensure the user is not the last admin. Returns an error response if so, null otherwise.
     */
    protected function ensureNotLastAdmin(User $user, string $action = 'modify'): ?JsonResponse
    {
        if ($user->isAdmin() && User::where('is_admin', true)->count() === 1) {
            return response()->json([
                'message' => "Cannot {$action} the last admin account",
            ], 400);
        }

        return null;
    }
}

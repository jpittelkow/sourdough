# Recipe: Add Admin-Protected Action

Step-by-step guide to protect admin user actions (delete, disable, demote) so the last admin cannot be removed.

## When to Use

- **Delete user**: UserController destroy, ProfileController destroy (account deletion)
- **Disable user**: Toggle disabled status, soft-disable
- **Demote admin**: Toggle admin status, remove admin role

Use `AdminAuthorizationTrait` whenever an action could leave the system with zero admins.

## Prerequisites

- Route already protected with `auth:sanctum` and `admin` middleware
- Controller receives a `User` model (route model binding or `$request->user()`)

## Step 1: Use the Trait

```php
<?php
// backend/app/Http/Controllers/Api/UserController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\AdminAuthorizationTrait;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    use AdminAuthorizationTrait;

    // ...
}
```

## Step 2: Call ensureNotLastAdmin Before the Action

Call `ensureNotLastAdmin(User $user, string $action)` **before** performing the destructive action. It returns a `JsonResponse` to send back, or `null` if the check passes.

```php
public function destroy(User $user): JsonResponse
{
    if ($error = $this->ensureNotLastAdmin($user, 'delete')) {
        return $error;
    }

    // Optional: prevent self-delete
    if ($user->id === auth()->id()) {
        return $this->errorResponse('Cannot delete your own account', 400);
    }

    $user->delete();
    return $this->successResponse('User deleted successfully');
}
```

## Step 3: Use the Correct Action Verb

The `$action` string is used in the error message: `"Cannot {$action} the last admin account"`.

| Action | Use case | Example message |
|--------|----------|-----------------|
| `'delete'` | User/account deletion | "Cannot delete the last admin account" |
| `'disable'` | Disabling a user | "Cannot disable the last admin account" |
| `'remove admin status from'` | Toggling admin off, demotion | "Cannot remove admin status from the last admin account" |

```php
// Delete
if ($error = $this->ensureNotLastAdmin($user, 'delete')) {
    return $error;
}

// Disable
if ($error = $this->ensureNotLastAdmin($user, 'disable')) {
    return $error;
}

// Toggle admin / demote
if ($error = $this->ensureNotLastAdmin($user, 'remove admin status from')) {
    return $error;
}
```

## Step 4: Combine With ApiResponseTrait (Optional)

Use `ApiResponseTrait` for consistent error and success responses:

```php
use App\Http\Traits\AdminAuthorizationTrait;
use App\Http\Traits\ApiResponseTrait;

class UserController extends Controller
{
    use AdminAuthorizationTrait;
    use ApiResponseTrait;

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
}
```

## Integration With Admin Middleware

`AdminAuthorizationTrait` only enforces "don't remove the last admin." It does **not** enforce "caller must be admin." Ensure routes use `admin` middleware:

```php
// backend/routes/api.php
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::delete('/users/{user}', [UserController::class, 'destroy']);
    Route::post('/users/{user}/toggle-admin', [UserController::class, 'toggleAdmin']);
    Route::post('/users/{user}/toggle-disabled', [UserController::class, 'toggleDisabled']);
});
```

For profile self-deletion (user deletes own account), the route is typically under `auth:sanctum` only (no `admin`). The trait still applies when the user being deleted is the last admin.

## Checklist

- [ ] Controller uses `AdminAuthorizationTrait`
- [ ] `ensureNotLastAdmin($user, $action)` called before the destructive action
- [ ] Correct action verb used (`'delete'`, `'disable'`, `'remove admin status from'`)
- [ ] Self-action checks (e.g. prevent self-delete) added if needed
- [ ] Admin routes use `auth:sanctum` and `admin` middleware where appropriate

## See Also

- [Backend Traits](../patterns.md#backend-traits) in patterns.md
- [Add API endpoint](add-api-endpoint.md) – Using Shared Traits section
- [Anti-pattern: Duplicate "Last Admin" checks](../anti-patterns.md#dont-duplicate-last-admin-checks)

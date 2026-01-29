<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;

class AuthController extends Controller
{
    use ApiResponseTrait;

    /**
     * Register a new user.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'is_admin' => User::count() === 0, // First user is admin
        ]);

        event(new Registered($user));

        Auth::login($user);

        return $this->createdResponse('Registration successful', ['user' => $user]);
    }

    /**
     * Login user.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (!Auth::attempt($credentials, $request->boolean('remember'))) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        $user = Auth::user();

        // Check if 2FA is enabled
        if ($user->hasTwoFactorEnabled()) {
            // Store user ID in session for 2FA verification
            $request->session()->put('2fa:user_id', $user->id);
            Auth::logout();

            return $this->successResponse('Two-factor authentication required', ['requires_2fa' => true]);
        }

        $request->session()->regenerate();

        return $this->successResponse('Login successful', ['user' => $user]);
    }

    /**
     * Logout user.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return $this->successResponse('Logged out successfully');
    }

    /**
     * Get authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->load(['socialAccounts:id,user_id,provider,nickname,avatar']);

        return $this->dataResponse([
            'user' => $user,
            'sso_accounts' => $user->socialAccounts->pluck('provider'),
            'two_factor_enabled' => $user->hasTwoFactorEnabled(),
        ]);
    }

    /**
     * Request password reset link.
     * 
     * Note: Always returns success to prevent user enumeration.
     * The actual email is only sent if the user exists.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // Attempt to send the reset link, but don't reveal whether the user exists
        Password::sendResetLink($request->only('email'));

        // Always return success message to prevent user enumeration
        return $this->successResponse('If an account exists with this email, a password reset link has been sent.');
    }

    /**
     * Reset password.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => $password,
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->successResponse('Password reset successful');
        }

        return response()->json([
            'message' => 'Password reset failed',
            'error' => __($status),
        ], 400);
    }

    /**
     * Verify email address.
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->validate([
            'id' => ['required'],
            'hash' => ['required'],
        ]);

        $user = User::findOrFail($request->id);

        if (!hash_equals(sha1($user->getEmailForVerification()), $request->hash)) {
            return $this->errorResponse('Invalid verification link', 400);
        }

        if ($user->hasVerifiedEmail()) {
            return $this->successResponse('Email already verified');
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        return $this->successResponse('Email verified successfully');
    }

    /**
     * Resend verification email.
     */
    public function resendVerification(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->successResponse('Email already verified');
        }

        $user->sendEmailVerificationNotification();

        return $this->successResponse('Verification link sent');
    }
}

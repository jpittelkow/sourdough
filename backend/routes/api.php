<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\SSOController;
use App\Http\Controllers\Api\TwoFactorController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\NotificationSettingsController;
use App\Http\Controllers\Api\NotificationChannelConfigController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\MailSettingController;
use App\Http\Controllers\Api\JobController;
use App\Http\Controllers\Api\StorageSettingController;
use App\Http\Controllers\Api\ApiTokenController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Api\BrandingController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\VersionController;
use App\Http\Controllers\Api\LLMController;
use App\Http\Controllers\Api\UserSettingController;
use App\Http\Controllers\Api\UserNotificationSettingsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::get('/version', [VersionController::class, 'index']);
Route::get('/health', fn() => response()->json(['status' => 'ok']));

// SSO Provider Info (public)
Route::get('/auth/sso/providers', [SSOController::class, 'providers']);

// Public system settings and branding (no auth required)
Route::get('/system-settings/public', [SystemSettingController::class, 'publicSettings']);
Route::get('/branding', [BrandingController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {
    // Registration & Login (rate limited)
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware('rate.sensitive:register');
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('rate.sensitive:login');
    
    // Password Reset (rate limited)
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])
        ->middleware('rate.sensitive:password_reset');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])
        ->middleware('rate.sensitive:password_reset');
    
    // Email Verification
    Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerification'])
        ->middleware('auth:sanctum');
    
    // SSO Routes
    Route::get('/sso/{provider}', [SSOController::class, 'redirect']);
    Route::get('/callback/{provider}', [SSOController::class, 'callback']);
    Route::post('/sso/{provider}/link', [SSOController::class, 'link'])
        ->middleware('auth:sanctum');
    Route::delete('/sso/{provider}/unlink', [SSOController::class, 'unlink'])
        ->middleware('auth:sanctum');
    
    // Authenticated routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);
        
        // 2FA Routes
        Route::prefix('2fa')->group(function () {
            Route::get('/status', [TwoFactorController::class, 'status']);
            Route::post('/enable', [TwoFactorController::class, 'enable']);
            Route::post('/confirm', [TwoFactorController::class, 'confirm']);
            Route::post('/disable', [TwoFactorController::class, 'disable']);
            // 2FA verify is rate limited to prevent brute force
            Route::post('/verify', [TwoFactorController::class, 'verify'])
                ->withoutMiddleware('auth:sanctum')
                ->middleware('rate.sensitive:2fa');
            Route::get('/recovery-codes', [TwoFactorController::class, 'recoveryCodes']);
            Route::post('/recovery-codes/regenerate', [TwoFactorController::class, 'regenerateRecoveryCodes']);
        });
    });
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {
    
    // Profile
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'show']);
        Route::put('/', [ProfileController::class, 'update']);
        Route::put('/password', [ProfileController::class, 'updatePassword']);
        Route::delete('/', [ProfileController::class, 'destroy']);
    });
    
    // User Settings (Personal preferences - not admin-only)
    Route::prefix('user')->group(function () {
        Route::get('/settings', [UserSettingController::class, 'show']);
        Route::put('/settings', [UserSettingController::class, 'update']);
        Route::get('/notification-settings', [UserNotificationSettingsController::class, 'show']);
        Route::put('/notification-settings', [UserNotificationSettingsController::class, 'update']);
    });
    
    // Settings (Admin only)
    Route::prefix('settings')->middleware('can:manage-settings')->group(function () {
        Route::get('/', [SettingController::class, 'index']);
        Route::put('/', [SettingController::class, 'update']);
        Route::get('/notifications', [NotificationSettingsController::class, 'show']);
        Route::put('/notifications', [NotificationSettingsController::class, 'update']);
        Route::get('/{group}', [SettingController::class, 'show']);
        Route::put('/{group}', [SettingController::class, 'updateGroup']);
    });
    
    // System Settings (Admin only)
    Route::prefix('system-settings')->middleware('can:manage-settings')->group(function () {
        Route::get('/', [SystemSettingController::class, 'index']);
        Route::put('/', [SystemSettingController::class, 'update']);
        Route::get('/{group}', [SystemSettingController::class, 'show']);
    });

    // Admin notification channel config (available toggles, SMS preferred provider)
    Route::prefix('admin')->middleware('can:manage-settings')->group(function () {
        Route::get('notification-channels', [NotificationChannelConfigController::class, 'index']);
        Route::put('notification-channels', [NotificationChannelConfigController::class, 'update']);
    });
    
    // Notifications
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/mark-read', [NotificationController::class, 'markAsRead']);
        Route::post('/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
        
        // Test notification
        Route::post('/test/{channel}', [NotificationController::class, 'test']);
    });
    
    // LLM/AI (Admin only)
    Route::prefix('llm')->middleware('can:manage-settings')->group(function () {
        Route::get('/providers', [LLMController::class, 'providers']);
        Route::post('/providers', [LLMController::class, 'storeProvider']);
        Route::put('/providers/{provider}', [LLMController::class, 'updateProvider']);
        Route::delete('/providers/{provider}', [LLMController::class, 'destroyProvider']);
        Route::get('/config', [LLMController::class, 'config']);
        Route::put('/config', [LLMController::class, 'updateConfig']);
        Route::post('/test/{provider}', [LLMController::class, 'testProvider']);
        Route::post('/query', [LLMController::class, 'query']);
        Route::post('/query/vision', [LLMController::class, 'visionQuery']);
    });
    
    // Backup & Restore (Admin only)
    Route::prefix('backup')->middleware('can:manage-backups')->group(function () {
        Route::get('/', [BackupController::class, 'index']);
        Route::post('/create', [BackupController::class, 'create']);
        Route::get('/download/{filename}', [BackupController::class, 'download']);
        Route::post('/restore', [BackupController::class, 'restore']);
        Route::delete('/{filename}', [BackupController::class, 'destroy']);
    });
    
    // User Management (Admin only)
    Route::prefix('users')->middleware('can:admin')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::post('/', [UserController::class, 'store']);
        Route::get('/{user}', [UserController::class, 'show']);
        Route::put('/{user}', [UserController::class, 'update']);
        Route::delete('/{user}', [UserController::class, 'destroy']);
        Route::post('/{user}/toggle-admin', [UserController::class, 'toggleAdmin']);
        Route::post('/{user}/reset-password', [UserController::class, 'resetPassword']);
        Route::post('/{user}/disable', [UserController::class, 'toggleDisabled']);
    });
    
    // Audit Logs (Admin only)
    Route::prefix('audit-logs')->middleware('can:admin')->group(function () {
        Route::get('/', [AuditLogController::class, 'index']);
        Route::get('/export', [AuditLogController::class, 'export']);
        Route::get('/stats', [AuditLogController::class, 'stats']);
    });
    
    // Mail Settings (Admin only)
    Route::prefix('mail-settings')->middleware('can:manage-settings')->group(function () {
        Route::get('/', [MailSettingController::class, 'show']);
        Route::put('/', [MailSettingController::class, 'update']);
        Route::post('/test', [MailSettingController::class, 'sendTestEmail']);
    });
    
    // Jobs (Admin only)
    Route::prefix('jobs')->middleware('can:admin')->group(function () {
        Route::get('/scheduled', [JobController::class, 'scheduled']);
        Route::get('/queue', [JobController::class, 'queueStatus']);
        Route::get('/failed', [JobController::class, 'failedJobs']);
        Route::post('/failed/{id}/retry', [JobController::class, 'retryJob']);
        Route::delete('/failed/{id}', [JobController::class, 'deleteJob']);
        Route::post('/failed/retry-all', [JobController::class, 'retryAllFailed']);
        Route::delete('/failed/clear', [JobController::class, 'clearFailed']);
    });
    
    // Storage Settings (Admin only)
    Route::prefix('storage-settings')->middleware('can:manage-settings')->group(function () {
        Route::get('/', [StorageSettingController::class, 'show']);
        Route::put('/', [StorageSettingController::class, 'update']);
        Route::get('/stats', [StorageSettingController::class, 'stats']);
    });
    
    // API Tokens (Authenticated users)
    Route::prefix('api-tokens')->group(function () {
        Route::get('/', [ApiTokenController::class, 'index']);
        Route::post('/', [ApiTokenController::class, 'store']);
        Route::delete('/{token}', [ApiTokenController::class, 'destroy']);
    });
    
    // Webhooks (Admin only)
    Route::prefix('webhooks')->middleware('can:admin')->group(function () {
        Route::get('/', [WebhookController::class, 'index']);
        Route::post('/', [WebhookController::class, 'store']);
        // More specific routes must come before parameterized routes
        Route::get('/{webhook}/deliveries', [WebhookController::class, 'deliveries']);
        Route::post('/{webhook}/test', [WebhookController::class, 'test']);
        Route::put('/{webhook}', [WebhookController::class, 'update']);
        Route::delete('/{webhook}', [WebhookController::class, 'destroy']);
    });
    
    // Branding (admin write only - public read is defined above)
    Route::prefix('branding')->middleware('can:manage-settings')->group(function () {
        Route::put('/', [BrandingController::class, 'update']);
        Route::post('/logo', [BrandingController::class, 'uploadLogo']);
        Route::post('/favicon', [BrandingController::class, 'uploadFavicon']);
        Route::delete('/logo', [BrandingController::class, 'deleteLogo']);
        Route::delete('/favicon', [BrandingController::class, 'deleteFavicon']);
    });
    
});

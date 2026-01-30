<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\AuditService;
use App\Services\EmailConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;

class SystemSettingController extends Controller
{
    public function __construct(
        private AuditService $auditService
    ) {}
    /**
     * Get all system settings (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $settings = SystemSetting::all()
            ->groupBy('group')
            ->map(fn ($group) => $group->pluck('value', 'key'));

        return response()->json([
            'settings' => $settings,
        ]);
    }

    /**
     * Get public system settings (no auth required).
     */
    public function publicSettings(EmailConfigService $emailConfigService): JsonResponse
    {
        $settings = Cache::remember('system_settings_public', 3600, function () {
            return SystemSetting::getPublic();
        });

        return response()->json([
            'settings' => $settings,
            'features' => [
                'email_configured' => $emailConfigService->isConfigured(),
                'password_reset_available' => $emailConfigService->isConfigured(),
                'email_verification_available' => $emailConfigService->isConfigured(),
            ],
        ]);
    }

    /**
     * Get settings for a specific group.
     */
    public function show(Request $request, string $group): JsonResponse
    {
        $settings = SystemSetting::where('group', $group)
            ->get()
            ->pluck('value', 'key');

        return response()->json([
            'group' => $group,
            'settings' => $settings,
        ]);
    }

    /**
     * Update system settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.group' => ['required', 'string'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['nullable'], // Allow null/empty for optional fields
            'settings.*.is_public' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();

        foreach ($validated['settings'] as $setting) {
            SystemSetting::set(
                $setting['key'],
                $setting['value'],
                $setting['group'],
                $user->id,
                $setting['is_public'] ?? false
            );
        }

        // Clear cache
        Cache::forget('system_settings_public');

        $this->auditService->logSettings('system', [], ['settings' => $validated['settings']], $user->id);

        return response()->json([
            'message' => 'System settings updated successfully',
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateNovuSettingsRequest;
use App\Http\Traits\ApiResponseTrait;
use App\Services\NovuService;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NovuSettingController extends Controller
{
    use ApiResponseTrait;

    private const GROUP = 'novu';

    public function __construct(
        private NovuService $novuService,
        private SettingService $settingService
    ) {}

    /**
     * Get Novu settings (admin). API key is masked in response.
     */
    public function show(): JsonResponse
    {
        $settings = $this->settingService->getGroup(self::GROUP);
        $masked = $settings;
        if (! empty($settings['api_key'] ?? '')) {
            $masked['api_key'] = '••••••••';
        }

        return $this->dataResponse(['settings' => $masked]);
    }

    /**
     * Update Novu settings.
     */
    public function update(UpdateNovuSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Skip api_key if it's the masked placeholder (user didn't change it)
        if (isset($validated['api_key']) && $validated['api_key'] === '••••••••') {
            unset($validated['api_key']);
        }

        $userId = $request->user()->id;
        foreach ($validated as $key => $value) {
            $this->settingService->set(self::GROUP, $key, $value === '' ? null : $value, $userId);
        }

        $this->settingService->clearCache();
        \Illuminate\Support\Facades\Cache::forget('system_settings_public');

        return $this->successResponse('Novu settings updated successfully');
    }

    /**
     * Test Novu connection.
     */
    public function test(Request $request): JsonResponse
    {
        $result = $this->novuService->testConnection();

        if ($result['success']) {
            return $this->successResponse('Connection successful');
        }

        return $this->errorResponse($result['error'] ?? 'Connection failed', 400);
    }

    /**
     * Reset a Novu setting to env default.
     */
    public function resetKey(Request $request, string $key): JsonResponse
    {
        $schema = config('settings-schema.'.self::GROUP, []);
        if (! array_key_exists($key, $schema)) {
            return $this->errorResponse('Unknown setting key', 422);
        }
        $this->settingService->reset(self::GROUP, $key);
        $this->settingService->clearCache();
        \Illuminate\Support\Facades\Cache::forget('system_settings_public');

        return $this->successResponse('Setting reset to default');
    }
}

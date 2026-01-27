<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BrandingController extends Controller
{
    /**
     * Get branding settings (public - no auth required).
     */
    public function show(): JsonResponse
    {
        $settings = SystemSetting::where('group', 'branding')
            ->where('is_public', true)
            ->get()
            ->pluck('value', 'key');

        return response()->json([
            'settings' => $settings,
        ]);
    }

    /**
     * Update branding settings (admin only).
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'logo_url' => ['sometimes', 'nullable', 'url'],
            'favicon_url' => ['sometimes', 'nullable', 'url'],
            'primary_color' => ['sometimes', 'nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'dark_mode_default' => ['sometimes', 'boolean'],
            'custom_css' => ['sometimes', 'nullable', 'string'],
        ]);

        $user = $request->user();

        foreach ($validated as $key => $value) {
            // Logo and favicon URLs are public
            $isPublic = in_array($key, ['logo_url', 'favicon_url', 'primary_color', 'dark_mode_default']);
            
            SystemSetting::set($key, $value, 'branding', $user->id, $isPublic);
        }

        return response()->json([
            'message' => 'Branding settings updated successfully',
        ]);
    }

    /**
     * Upload logo.
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'logo' => ['required', 'image', 'max:2048'], // 2MB max
        ]);

        try {
            $path = $request->file('logo')->store('branding', 'public');
            $url = Storage::disk('public')->url($path);

            $user = $request->user();
            SystemSetting::set('logo_url', $url, 'branding', $user->id, true);

            return response()->json([
                'message' => 'Logo uploaded successfully',
                'url' => $url,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to upload logo: ' . $e->getMessage(),
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all user settings.
     */
    public function index(Request $request): JsonResponse
    {
        $settings = $request->user()
            ->settings()
            ->get()
            ->groupBy('group')
            ->map(fn ($group) => $group->pluck('value', 'key'));

        return response()->json([
            'settings' => $settings,
        ]);
    }

    /**
     * Get settings for a specific group.
     */
    public function show(Request $request, string $group): JsonResponse
    {
        $settings = $request->user()
            ->settings()
            ->where('group', $group)
            ->get()
            ->pluck('value', 'key');

        return response()->json([
            'group' => $group,
            'settings' => $settings,
        ]);
    }

    /**
     * Update settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['required'],
            'settings.*.group' => ['sometimes', 'string'],
        ]);

        $user = $request->user();

        foreach ($validated['settings'] as $setting) {
            $user->setSetting(
                $setting['group'] ?? 'general',
                $setting['key'],
                $setting['value']
            );
        }

        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }

    /**
     * Update settings for a specific group.
     */
    public function updateGroup(Request $request, string $group): JsonResponse
    {
        $validated = $request->validate([
            'settings' => ['required', 'array'],
        ]);

        $user = $request->user();

        foreach ($validated['settings'] as $key => $value) {
            $user->setSetting($group, $key, $value);
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'group' => $group,
        ]);
    }
}

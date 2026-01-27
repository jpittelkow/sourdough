<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserSettingController extends Controller
{
    /**
     * Get user personal preferences.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'theme' => $user->getSetting('appearance', 'theme', 'system'),
            'default_llm_mode' => $user->getSetting('defaults', 'llm_mode', 'single'),
            'notification_channels' => $user->getSetting('notifications', 'preferences', []),
        ]);
    }

    /**
     * Update user personal preferences.
     */
    public function update(Request $request): JsonResponse
    {
        // Validate only the fields that are present in the request
        $validated = $request->validate([
            'theme' => ['sometimes', 'nullable', 'string', 'in:light,dark,system'],
            'default_llm_mode' => ['sometimes', 'nullable', 'string', 'in:single,aggregation,council'],
            'notification_channels' => ['sometimes', 'nullable', 'array'],
        ]);

        $user = $request->user();

        // Only update settings that were provided and are not null
        if (isset($validated['theme']) && $validated['theme'] !== null) {
            $user->setSetting('appearance', 'theme', $validated['theme']);
        }

        if (isset($validated['default_llm_mode']) && $validated['default_llm_mode'] !== null) {
            $user->setSetting('defaults', 'llm_mode', $validated['default_llm_mode']);
        }

        if (isset($validated['notification_channels']) && $validated['notification_channels'] !== null) {
            $user->setSetting('notifications', 'preferences', $validated['notification_channels']);
        }

        return response()->json([
            'message' => 'Preferences updated successfully',
            'preferences' => [
                'theme' => $user->getSetting('appearance', 'theme', 'system'),
                'default_llm_mode' => $user->getSetting('defaults', 'llm_mode', 'single'),
                'notification_channels' => $user->getSetting('notifications', 'preferences', []),
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\Notifications\NotificationChannelMetadata;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserNotificationSettingsController extends Controller
{
    use NotificationChannelMetadata;
    private const GROUP = 'notifications';

    /**
     * List notification channels available to the current user.
     * Only includes channels where admin has set "available" (and provider configured).
     * For SMS, only the preferred provider is included.
     */
    public function show(Request $request): JsonResponse
    {
        $channelConfig = config('notifications.channels');
        $smsProvider = SystemSetting::get('sms_provider', null, self::GROUP);
        $userSettings = $request->user()->settings()
            ->where('group', self::GROUP)
            ->pluck('value', 'key')
            ->toArray();

        $channelIds = $this->getAvailableChannelIds($channelConfig, $smsProvider);

        $channels = collect($channelIds)->map(function (string $id) use ($channelConfig, $userSettings) {
            $config = $channelConfig[$id] ?? [];

            return [
                'id' => $id,
                'name' => $this->getChannelName($id),
                'description' => $this->getChannelDescription($id),
                'enabled' => (bool) ($userSettings["{$id}_enabled"] ?? false),
                'configured' => $this->isChannelConfigured($id, $config, $userSettings),
                'usage_accepted' => (bool) ($userSettings["{$id}_usage_accepted"] ?? false),
                'settings' => $this->getChannelSettings($id, $userSettings),
            ];
        })->values();

        return response()->json(['channels' => $channels]);
    }

    /**
     * Update user notification settings.
     * Rejects enabling a channel that is not available to users.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'channel' => ['required', 'string'],
            'enabled' => ['sometimes', 'boolean'],
            'settings' => ['sometimes', 'array'],
            'usage_accepted' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();
        $channelId = $validated['channel'];

        if (isset($validated['enabled']) && $validated['enabled']) {
            if (!$this->isChannelAvailableToUser($channelId)) {
                return response()->json([
                    'message' => 'This channel is not available. An administrator must enable it first.',
                ], 403);
            }
        }

        if (isset($validated['enabled'])) {
            $user->setSetting("{$channelId}_enabled", $validated['enabled'], self::GROUP);
        }

        if (isset($validated['usage_accepted'])) {
            $user->setSetting("{$channelId}_usage_accepted", $validated['usage_accepted'], self::GROUP);
        }

        if (isset($validated['settings'])) {
            foreach ($validated['settings'] as $key => $value) {
                $user->setSetting("{$channelId}_{$key}", $value, self::GROUP);
            }
        }

        return response()->json(['message' => 'Notification settings updated']);
    }

    private function getAvailableChannelIds(array $channelConfig, ?string $smsProvider): array
    {
        $ids = [];
        foreach ($channelConfig as $id => $config) {
            // Always-available channels (database, email) and user-configurable channels
            // (Slack, Discord - users provide their own webhooks) bypass provider check
            if (!$this->isAlwaysAvailableChannel($id) && !$this->isUserConfigurableChannel($id)) {
                $providerConfigured = (bool) ($config['enabled'] ?? false);
                if (!$providerConfigured) {
                    continue;
                }
            }

            $available = $this->isChannelAvailableToUser($id);
            if (!$available) {
                continue;
            }

            if (in_array($id, ['twilio', 'vonage', 'sns'], true)) {
                if ($smsProvider === null || $id !== $smsProvider) {
                    continue;
                }
            }

            $ids[] = $id;
        }

        return $ids;
    }

    private function isChannelAvailableToUser(string $channelId): bool
    {
        if ($this->isAlwaysAvailableChannel($channelId)) {
            return true;
        }

        $value = SystemSetting::get("channel_{$channelId}_available", false, self::GROUP);

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    private function isChannelConfigured(string $id, array $config, array $userSettings): bool
    {
        if ($this->isAlwaysAvailableChannel($id)) {
            return true;
        }

        $required = $this->getRequiredSettings($id);
        if (empty($required)) {
            return true;
        }

        foreach ($required as $setting) {
            $key = "{$id}_{$setting['key']}";
            if (empty($userSettings[$key] ?? null)) {
                return false;
            }
        }

        return true;
    }

    private function getChannelSettings(string $id, array $userSettings): array
    {
        $required = $this->getRequiredSettings($id);

        return collect($required)->map(function ($s) use ($id, $userSettings) {
            $key = "{$id}_{$s['key']}";

            return [
                'key' => $s['key'],
                'label' => $s['label'],
                'type' => $s['type'],
                'value' => $userSettings[$key] ?? '',
                'placeholder' => $s['placeholder'] ?? '',
            ];
        })->toArray();
    }

    private function getRequiredSettings(string $id): array
    {
        return match ($id) {
            'telegram' => [
                ['key' => 'chat_id', 'label' => 'Chat ID', 'type' => 'text', 'placeholder' => 'Your Telegram chat ID'],
            ],
            'discord' => [
                ['key' => 'webhook_url', 'label' => 'Webhook URL', 'type' => 'text', 'placeholder' => 'https://discord.com/api/webhooks/...'],
            ],
            'slack' => [
                ['key' => 'webhook_url', 'label' => 'Webhook URL', 'type' => 'text', 'placeholder' => 'https://hooks.slack.com/services/...'],
            ],
            'signal' => [
                ['key' => 'phone_number', 'label' => 'Phone Number', 'type' => 'text', 'placeholder' => '+1234567890'],
            ],
            'matrix' => [
                ['key' => 'room_id', 'label' => 'Room ID', 'type' => 'text', 'placeholder' => '!roomid:matrix.org'],
            ],
            'twilio', 'vonage', 'sns' => [
                ['key' => 'phone_number', 'label' => 'Phone Number', 'type' => 'text', 'placeholder' => '+1234567890'],
            ],
            'ntfy' => [
                ['key' => 'topic', 'label' => 'Topic', 'type' => 'text', 'placeholder' => 'my-notifications', 'help' => 'Subscribe to this topic in the ntfy app'],
            ],
            default => [],
        };
    }
}

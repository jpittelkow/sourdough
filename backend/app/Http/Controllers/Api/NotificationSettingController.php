<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Services\Notifications\NotificationOrchestrator;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationSettingController extends Controller
{
    use ApiResponseTrait;

    private const GROUP = 'notifications';

    public function __construct(
        private SettingService $settingService,
        private NotificationOrchestrator $notificationOrchestrator
    ) {}

    /**
     * Get notification channel settings.
     */
    public function show(): JsonResponse
    {
        $settings = $this->settingService->getGroup(self::GROUP);

        return $this->dataResponse([
            'settings' => $settings,
        ]);
    }

    /**
     * Update notification settings.
     */
    public function update(Request $request): JsonResponse
    {
        $schema = config('settings-schema.notifications', []);
        $rules = [];
        foreach (array_keys($schema) as $key) {
            if (in_array($key, ['ntfy_enabled', 'sns_enabled'], true)) {
                $rules[$key] = ['sometimes', 'boolean'];
            } else {
                $rules[$key] = ['sometimes', 'nullable', 'string'];
            }
        }
        $validated = $request->validate($rules);

        $userId = $request->user()->id;
        foreach ($validated as $key => $value) {
            $this->settingService->set(self::GROUP, $key, $value, $userId);
        }

        return $this->successResponse('Notification settings updated successfully');
    }

    /**
     * Reset a notification setting to env default.
     */
    public function reset(Request $request, string $key): JsonResponse
    {
        $schema = config('settings-schema.notifications', []);
        if (!array_key_exists($key, $schema)) {
            return $this->errorResponse('Unknown setting key', 422);
        }
        $this->settingService->reset(self::GROUP, $key);

        return $this->successResponse('Setting reset to default');
    }

    /**
     * Test a notification channel.
     */
    public function testChannel(Request $request, string $channel): JsonResponse
    {
        $settings = $this->settingService->getGroup(self::GROUP);
        $this->applyNotificationsConfigForRequest($settings);

        try {
            $this->notificationOrchestrator->sendTestNotification($request->user(), $channel);

            return $this->successResponse('Test notification sent', ['channel' => $channel]);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to send test notification: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Apply notification settings to config for the current request (e.g. test channel).
     */
    private function applyNotificationsConfigForRequest(array $settings): void
    {
        if (isset($settings['telegram_bot_token'])) {
            config(['notifications.channels.telegram.bot_token' => $settings['telegram_bot_token']]);
            config(['notifications.channels.telegram.enabled' => !empty($settings['telegram_bot_token'])]);
        }
        if (array_key_exists('discord_webhook_url', $settings)) {
            config(['notifications.channels.discord.webhook_url' => $settings['discord_webhook_url']]);
            config(['notifications.channels.discord.username' => $settings['discord_bot_name'] ?? config('notifications.channels.discord.username')]);
            config(['notifications.channels.discord.avatar_url' => $settings['discord_avatar_url'] ?? null]);
            config(['notifications.channels.discord.enabled' => !empty($settings['discord_webhook_url'])]);
        }
        if (array_key_exists('slack_webhook_url', $settings)) {
            config(['notifications.channels.slack.webhook_url' => $settings['slack_webhook_url']]);
            config(['notifications.channels.slack.username' => $settings['slack_bot_name'] ?? config('notifications.channels.slack.username')]);
            config(['notifications.channels.slack.icon' => $settings['slack_icon'] ?? config('notifications.channels.slack.icon')]);
            config(['notifications.channels.slack.enabled' => !empty($settings['slack_webhook_url'])]);
        }
        if (array_key_exists('signal_cli_path', $settings)) {
            config(['notifications.channels.signal.cli_path' => $settings['signal_cli_path'] ?? config('notifications.channels.signal.cli_path')]);
            config(['notifications.channels.signal.phone_number' => $settings['signal_phone_number'] ?? null]);
            config(['notifications.channels.signal.config_dir' => $settings['signal_config_dir'] ?? config('notifications.channels.signal.config_dir')]);
            config(['notifications.channels.signal.enabled' => !empty($settings['signal_cli_path']) && !empty($settings['signal_phone_number'])]);
        }
        if (array_key_exists('twilio_sid', $settings)) {
            config(['notifications.channels.twilio.sid' => $settings['twilio_sid']]);
            config(['notifications.channels.twilio.token' => $settings['twilio_token'] ?? null]);
            config(['notifications.channels.twilio.from' => $settings['twilio_from'] ?? null]);
            config(['notifications.channels.twilio.enabled' => !empty($settings['twilio_sid']) && !empty($settings['twilio_token'])]);
        }
        if (array_key_exists('vonage_api_key', $settings)) {
            config(['notifications.channels.vonage.api_key' => $settings['vonage_api_key']]);
            config(['notifications.channels.vonage.api_secret' => $settings['vonage_api_secret'] ?? null]);
            config(['notifications.channels.vonage.from' => $settings['vonage_from'] ?? null]);
            config(['notifications.channels.vonage.enabled' => !empty($settings['vonage_api_key']) && !empty($settings['vonage_api_secret'])]);
        }
        if (array_key_exists('sns_enabled', $settings)) {
            config(['notifications.channels.sns.enabled' => !empty(config('mail.mailers.ses.key')) && $settings['sns_enabled']]);
        }
        if (array_key_exists('vapid_public_key', $settings)) {
            config(['notifications.channels.webpush.public_key' => $settings['vapid_public_key']]);
            config(['notifications.channels.webpush.private_key' => $settings['vapid_private_key'] ?? null]);
            config(['notifications.channels.webpush.subject' => $settings['vapid_subject'] ?? config('app.url')]);
            config(['notifications.channels.webpush.enabled' => !empty($settings['vapid_public_key']) && !empty($settings['vapid_private_key'])]);
        }
        if (array_key_exists('fcm_server_key', $settings)) {
            config(['notifications.channels.fcm.server_key' => $settings['fcm_server_key']]);
            config(['notifications.channels.fcm.enabled' => !empty($settings['fcm_server_key'])]);
        }
        if (array_key_exists('ntfy_enabled', $settings)) {
            config(['notifications.channels.ntfy.enabled' => $settings['ntfy_enabled']]);
        }
        if (array_key_exists('ntfy_server', $settings)) {
            config(['notifications.channels.ntfy.server' => $settings['ntfy_server'] ?? 'https://ntfy.sh']);
        }
        if (array_key_exists('matrix_homeserver', $settings)) {
            config(['notifications.channels.matrix.homeserver' => $settings['matrix_homeserver']]);
            config(['notifications.channels.matrix.access_token' => $settings['matrix_access_token'] ?? null]);
            config(['notifications.channels.matrix.default_room' => $settings['matrix_default_room'] ?? null]);
            config(['notifications.channels.matrix.enabled' => !empty($settings['matrix_homeserver']) && !empty($settings['matrix_access_token'])]);
        }
    }

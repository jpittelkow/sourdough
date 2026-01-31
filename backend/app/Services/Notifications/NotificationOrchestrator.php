<?php

namespace App\Services\Notifications;

use App\Models\User;
use App\Models\Notification;
use App\Models\SystemSetting;
use App\Services\NotificationTemplateService;
use App\Services\Notifications\Channels\ChannelInterface;
use App\Services\Notifications\Channels\DatabaseChannel;
use App\Services\Notifications\Channels\EmailChannel;
use App\Services\Notifications\Channels\TelegramChannel;
use App\Services\Notifications\Channels\DiscordChannel;
use App\Services\Notifications\Channels\SlackChannel;
use App\Services\Notifications\Channels\TwilioChannel;
use App\Services\Notifications\Channels\SignalChannel;
use App\Services\Notifications\Channels\MatrixChannel;
use App\Services\Notifications\Channels\VonageChannel;
use App\Services\Notifications\Channels\SNSChannel;
use App\Services\Notifications\Channels\WebPushChannel;
use App\Services\Notifications\Channels\FCMChannel;
use App\Services\Notifications\Channels\NtfyChannel;
use Illuminate\Support\Facades\Log;

class NotificationOrchestrator
{
    use NotificationChannelMetadata;
    private array $channelInstances = [];

    public function __construct(
        private NotificationTemplateService $notificationTemplateService
    ) {}

    /**
     * Map channel identifier to channel group for template lookup.
     */
    private function channelToGroup(string $channel): string
    {
        return match ($channel) {
            'database' => 'inapp',
            'email' => 'email',
            'webpush', 'fcm', 'ntfy' => 'push',
            'telegram', 'discord', 'slack', 'twilio', 'signal', 'matrix', 'vonage', 'sns' => 'chat',
            default => 'inapp',
        };
    }

    /**
     * Send a notification by type using per-channel templates (push, inapp, chat).
     * For email, variables must include 'title' and 'message'.
     * Variables are merged with user and app_name; templates are rendered for push/inapp/chat.
     */
    public function sendByType(
        User $user,
        string $type,
        array $variables = [],
        ?array $channels = null
    ): array {
        $channels = $channels ?? $this->getDefaultChannels();
        $baseVariables = [
            'user' => ['name' => $user->name, 'email' => $user->email],
            'app_name' => config('app.name', 'Sourdough'),
        ];
        $variables = array_merge($baseVariables, $variables);
        $results = [];

        foreach ($channels as $channel) {
            try {
                $channelInstance = $this->getChannelInstance($channel);

                if (!$channelInstance || !$this->isChannelEnabled($channel)) {
                    continue;
                }

                if (!$this->isChannelAvailableToUsers($channel)) {
                    continue;
                }

                if (!$this->isUserChannelEnabled($user, $channel)) {
                    continue;
                }

                if (!$channelInstance->isAvailableFor($user)) {
                    continue;
                }

                $channelGroup = $this->channelToGroup($channel);
                $title = null;
                $message = null;

                if ($channelGroup === 'email') {
                    $title = $variables['title'] ?? $type;
                    $message = $variables['message'] ?? '';
                } else {
                    try {
                        $rendered = $this->notificationTemplateService->render($type, $channelGroup, $variables);
                        $title = $rendered['title'];
                        $message = $rendered['body'];
                    } catch (\InvalidArgumentException $e) {
                        continue;
                    }
                }

                $result = $channelInstance->send($user, $type, $title, $message, $variables);
                $results[$channel] = [
                    'success' => true,
                    'result' => $result,
                ];
            } catch (\Exception $e) {
                Log::error("Notification channel {$channel} failed", [
                    'user' => $user->id,
                    'type' => $type,
                    'error' => $e->getMessage(),
                ]);
                $results[$channel] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    /**
     * Send a notification to a user via specified channels.
     */
    public function send(
        User $user,
        string $type,
        string $title,
        string $message,
        array $data = [],
        ?array $channels = null
    ): array {
        $channels = $channels ?? $this->getDefaultChannels();
        $results = [];

        foreach ($channels as $channel) {
            try {
                $channelInstance = $this->getChannelInstance($channel);

                if (!$channelInstance || !$this->isChannelEnabled($channel)) {
                    continue;
                }

                if (!$this->isChannelAvailableToUsers($channel)) {
                    continue;
                }

                if (!$this->isUserChannelEnabled($user, $channel)) {
                    continue;
                }

                if (!$channelInstance->isAvailableFor($user)) {
                    continue;
                }

                $result = $channelInstance->send($user, $type, $title, $message, $data);
                $results[$channel] = [
                    'success' => true,
                    'result' => $result,
                ];
            } catch (\Exception $e) {
                Log::error("Notification channel {$channel} failed", [
                    'user' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                $results[$channel] = [
                    'success' => false,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $results;
    }

    /**
     * Send a test notification.
     */
    public function sendTestNotification(User $user, string $channel): array
    {
        $channelInstance = $this->getChannelInstance($channel);

        if (!$channelInstance) {
            throw new \RuntimeException("Unknown channel: {$channel}");
        }

        if (!$this->isChannelEnabled($channel)) {
            throw new \RuntimeException("Channel is not enabled: {$channel}");
        }

        if (!$this->isChannelAvailableToUsers($channel)) {
            throw new \RuntimeException("Channel is not available to users: {$channel}");
        }

        return $channelInstance->send(
            $user,
            'test',
            'Test Notification',
            'This is a test notification from Sourdough.',
            ['test' => true, 'timestamp' => now()->toISOString()]
        );
    }

    /**
     * Create an in-app notification.
     */
    public function createInAppNotification(
        User $user,
        string $type,
        string $title,
        string $message,
        array $data = []
    ): Notification {
        return Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);
    }

    /**
     * Get default notification channels.
     */
    private function getDefaultChannels(): array
    {
        return config('notifications.default_channels', ['database']);
    }

    /**
     * Check if a channel is enabled.
     */
    private function isChannelEnabled(string $channel): bool
    {
        return config("notifications.channels.{$channel}.enabled", false);
    }

    /**
     * Check if the channel is available to users (admin has enabled it).
     * Database and email are always available; others use SystemSetting.
     */
    protected function isChannelAvailableToUsers(string $channel): bool
    {
        if ($this->isAlwaysAvailableChannel($channel)) {
            return true;
        }

        $value = SystemSetting::get("channel_{$channel}_available", false, 'notifications');

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    /**
     * Check if the user has enabled this channel in their preferences.
     */
    protected function isUserChannelEnabled(User $user, string $channel): bool
    {
        if ($channel === 'database') {
            return true;
        }

        return (bool) $user->getSetting('notifications', "{$channel}_enabled", false);
    }

    /**
     * Get or create channel instance.
     */
    private function getChannelInstance(string $channel): ?ChannelInterface
    {
        if (isset($this->channelInstances[$channel])) {
            return $this->channelInstances[$channel];
        }

        $instance = match ($channel) {
            'database' => new DatabaseChannel(),
            'email' => new EmailChannel(),
            'telegram' => new TelegramChannel(),
            'discord' => new DiscordChannel(),
            'slack' => new SlackChannel(),
            'twilio' => new TwilioChannel(),
            'signal' => new SignalChannel(),
            'matrix' => new MatrixChannel(),
            'vonage' => new VonageChannel(),
            'sns' => new SNSChannel(),
            'webpush' => new WebPushChannel(),
            'fcm' => new FCMChannel(),
            'ntfy' => new NtfyChannel(),
            default => null,
        };

        if ($instance) {
            $this->channelInstances[$channel] = $instance;
        }

        return $instance;
    }
}

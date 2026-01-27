<?php

namespace App\Services\Notifications;

use App\Models\User;
use App\Models\Notification;
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
use Illuminate\Support\Facades\Log;

class NotificationOrchestrator
{
    private array $channelInstances = [];

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
            default => null,
        };

        if ($instance) {
            $this->channelInstances[$channel] = $instance;
        }

        return $instance;
    }
}

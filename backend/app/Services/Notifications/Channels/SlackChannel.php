<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use Illuminate\Support\Facades\Http;

class SlackChannel implements ChannelInterface
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        $webhookUrl = $user->getSetting('notifications', 'slack_webhook_url')
            ?? config('notifications.channels.slack.webhook_url');

        if (!$webhookUrl) {
            throw new \RuntimeException('Slack webhook URL not configured');
        }

        $payload = [
            'username' => config('notifications.channels.slack.username', 'Sourdough'),
            'icon_emoji' => config('notifications.channels.slack.icon', ':robot_face:'),
            'attachments' => [
                [
                    'color' => $this->getColorForType($type),
                    'title' => $title,
                    'text' => $message,
                    'ts' => time(),
                ],
            ],
        ];

        $response = Http::post($webhookUrl, $payload);

        if (!$response->successful()) {
            throw new \RuntimeException('Slack webhook error: ' . $response->body());
        }

        return [
            'sent' => true,
        ];
    }

    public function getName(): string
    {
        return 'Slack';
    }

    public function isAvailableFor(User $user): bool
    {
        // User-configurable channel: available if user has webhook OR global webhook exists
        $userWebhook = $user->getSetting('notifications', 'slack_webhook_url');
        $globalWebhook = config('notifications.channels.slack.webhook_url');

        return !empty($userWebhook) || !empty($globalWebhook);
    }

    private function getColorForType(string $type): string
    {
        return match ($type) {
            'error' => 'danger',
            'warning' => 'warning',
            'success' => 'good',
            default => '#7289DA',
        };
    }
}

<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use Illuminate\Support\Facades\Http;

class DiscordChannel implements ChannelInterface
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        // User-specific webhook or global webhook
        $webhookUrl = $user->getSetting('discord_webhook_url')
            ?? config('notifications.channels.discord.webhook_url');

        if (!$webhookUrl) {
            throw new \RuntimeException('Discord webhook URL not configured');
        }

        $payload = [
            'username' => config('notifications.channels.discord.username', 'Sourdough'),
            'embeds' => [
                [
                    'title' => $title,
                    'description' => $message,
                    'color' => $this->getColorForType($type),
                    'timestamp' => now()->toISOString(),
                ],
            ],
        ];

        if ($avatarUrl = config('notifications.channels.discord.avatar_url')) {
            $payload['avatar_url'] = $avatarUrl;
        }

        $response = Http::post($webhookUrl, $payload);

        if (!$response->successful()) {
            throw new \RuntimeException('Discord webhook error: ' . $response->body());
        }

        return [
            'sent' => true,
        ];
    }

    public function getName(): string
    {
        return 'Discord';
    }

    public function isAvailableFor(User $user): bool
    {
        return config('notifications.channels.discord.enabled', false);
    }

    private function getColorForType(string $type): int
    {
        return match ($type) {
            'error' => 0xFF0000,    // Red
            'warning' => 0xFFA500,  // Orange
            'success' => 0x00FF00,  // Green
            'info' => 0x0099FF,     // Blue
            default => 0x7289DA,    // Discord blurple
        };
    }
}

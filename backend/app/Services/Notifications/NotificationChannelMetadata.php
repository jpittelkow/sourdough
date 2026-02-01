<?php

namespace App\Services\Notifications;

/**
 * Shared metadata for notification channels.
 * Used by both admin and user notification settings controllers.
 */
trait NotificationChannelMetadata
{
    /**
     * Check if a channel is always available (no admin toggle required).
     */
    protected function isAlwaysAvailableChannel(string $id): bool
    {
        return in_array($id, ['database', 'email'], true);
    }

    /**
     * Check if a channel is user-configurable (no global provider credentials needed).
     * These channels only require user-provided settings (webhooks, etc.),
     * so admins can enable them without setting up global credentials.
     */
    protected function isUserConfigurableChannel(string $id): bool
    {
        return in_array($id, ['slack', 'discord', 'ntfy', 'webpush'], true);
    }

    /**
     * Get human-readable channel name.
     */
    protected function getChannelName(string $id): string
    {
        return match ($id) {
            'database' => 'In-App',
            'email' => 'Email',
            'telegram' => 'Telegram',
            'discord' => 'Discord',
            'slack' => 'Slack',
            'signal' => 'Signal',
            'matrix' => 'Matrix',
            'twilio' => 'Twilio SMS',
            'vonage' => 'Vonage SMS',
            'sns' => 'AWS SNS',
            'webpush' => 'Web Push',
            'fcm' => 'Firebase Cloud Messaging',
            'ntfy' => 'ntfy Push',
            default => ucfirst($id),
        };
    }

    /**
     * Get channel description.
     */
    protected function getChannelDescription(string $id): string
    {
        return match ($id) {
            'database' => 'Receive notifications in the application',
            'email' => 'Receive notifications via email',
            'telegram' => 'Receive notifications via Telegram bot',
            'discord' => 'Receive notifications via Discord webhook',
            'slack' => 'Receive notifications via Slack webhook',
            'signal' => 'Receive notifications via Signal messaging',
            'matrix' => 'Receive notifications via Matrix',
            'twilio' => 'Receive notifications via Twilio SMS',
            'vonage' => 'Receive notifications via Vonage SMS',
            'sns' => 'Receive notifications via AWS SNS',
            'webpush' => 'Receive browser push notifications',
            'fcm' => 'Receive notifications via Firebase Cloud Messaging',
            'ntfy' => 'Receive push notifications via ntfy',
            default => "Receive notifications via {$id}",
        };
    }
}

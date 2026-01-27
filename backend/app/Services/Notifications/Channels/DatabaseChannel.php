<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use App\Models\Notification;

class DatabaseChannel implements ChannelInterface
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        $notification = Notification::create([
            'user_id' => $user->id,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        return [
            'notification_id' => $notification->id,
            'stored' => true,
        ];
    }

    public function getName(): string
    {
        return 'Database';
    }

    public function isAvailableFor(User $user): bool
    {
        return true;
    }
}

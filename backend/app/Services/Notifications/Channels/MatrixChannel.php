<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use Illuminate\Support\Facades\Http;

class MatrixChannel implements ChannelInterface
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        $roomId = $user->getSetting('matrix_room_id') ?? config('notifications.channels.matrix.default_room');

        if (!$roomId) {
            throw new \RuntimeException('Matrix room ID not configured for user');
        }

        $homeserver = config('notifications.channels.matrix.homeserver');
        $accessToken = config('notifications.channels.matrix.access_token');

        if (!$homeserver || !$accessToken) {
            throw new \RuntimeException('Matrix configuration incomplete');
        }

        // Ensure homeserver URL format
        $homeserver = rtrim($homeserver, '/');

        // Generate a transaction ID for idempotency
        $txnId = uniqid('sourdough_', true);

        // Build the message content
        $formattedBody = "<strong>{$title}</strong><br><br>{$message}";
        $plainBody = "{$title}\n\n{$message}";

        $messageContent = [
            'msgtype' => 'm.text',
            'body' => $plainBody,
            'format' => 'org.matrix.custom.html',
            'formatted_body' => $formattedBody,
        ];

        // URL encode the room ID
        $encodedRoomId = urlencode($roomId);

        $url = "{$homeserver}/_matrix/client/v3/rooms/{$encodedRoomId}/send/m.room.message/{$txnId}";

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$accessToken}",
            'Content-Type' => 'application/json',
        ])->put($url, $messageContent);

        if (!$response->successful()) {
            throw new \RuntimeException('Matrix API error: ' . $response->body());
        }

        return [
            'room_id' => $roomId,
            'event_id' => $response->json('event_id'),
            'sent' => true,
        ];
    }

    public function getName(): string
    {
        return 'Matrix';
    }

    public function isAvailableFor(User $user): bool
    {
        $hasRoom = !empty($user->getSetting('matrix_room_id')) 
            || !empty(config('notifications.channels.matrix.default_room'));

        return config('notifications.channels.matrix.enabled', false) && $hasRoom;
    }
}

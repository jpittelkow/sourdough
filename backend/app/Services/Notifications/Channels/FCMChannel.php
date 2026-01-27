<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use Illuminate\Support\Facades\Http;

class FCMChannel implements ChannelInterface
{
    private string $serverKey;

    public function __construct()
    {
        $this->serverKey = config('notifications.channels.fcm.server_key', '');
    }

    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        $fcmToken = $user->getSetting('fcm_token');

        if (!$fcmToken) {
            throw new \RuntimeException('FCM token not configured for user');
        }

        if (!$this->serverKey) {
            throw new \RuntimeException('FCM server key not configured');
        }

        // Build the FCM message payload
        $payload = [
            'to' => $fcmToken,
            'notification' => [
                'title' => $title,
                'body' => $message,
                'icon' => $data['icon'] ?? 'default',
                'click_action' => $data['click_action'] ?? null,
                'sound' => $data['sound'] ?? 'default',
            ],
            'data' => array_merge($data, [
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'timestamp' => time(),
            ]),
            'priority' => $data['priority'] ?? 'high',
        ];

        // Remove null values from notification
        $payload['notification'] = array_filter($payload['notification']);

        // Add Android-specific options
        if (isset($data['android'])) {
            $payload['android'] = $data['android'];
        }

        // Add iOS-specific options
        if (isset($data['apns'])) {
            $payload['apns'] = $data['apns'];
        }

        // Add web-specific options
        if (isset($data['webpush'])) {
            $payload['webpush'] = $data['webpush'];
        }

        $response = Http::withHeaders([
            'Authorization' => 'key=' . $this->serverKey,
            'Content-Type' => 'application/json',
        ])->post('https://fcm.googleapis.com/fcm/send', $payload);

        if (!$response->successful()) {
            throw new \RuntimeException('FCM API error: ' . $response->body());
        }

        $responseData = $response->json();

        // Check for errors in the response
        if (isset($responseData['failure']) && $responseData['failure'] > 0) {
            $error = $responseData['results'][0]['error'] ?? 'Unknown error';
            throw new \RuntimeException('FCM send failed: ' . $error);
        }

        return [
            'message_id' => $responseData['results'][0]['message_id'] ?? null,
            'multicast_id' => $responseData['multicast_id'] ?? null,
            'sent' => true,
        ];
    }

    /**
     * Send to multiple devices (multicast).
     */
    public function sendMulticast(User $user, array $tokens, string $type, string $title, string $message, array $data = []): array
    {
        if (empty($tokens)) {
            throw new \RuntimeException('No FCM tokens provided');
        }

        if (!$this->serverKey) {
            throw new \RuntimeException('FCM server key not configured');
        }

        $payload = [
            'registration_ids' => $tokens,
            'notification' => [
                'title' => $title,
                'body' => $message,
            ],
            'data' => array_merge($data, [
                'type' => $type,
                'timestamp' => time(),
            ]),
            'priority' => 'high',
        ];

        $response = Http::withHeaders([
            'Authorization' => 'key=' . $this->serverKey,
            'Content-Type' => 'application/json',
        ])->post('https://fcm.googleapis.com/fcm/send', $payload);

        if (!$response->successful()) {
            throw new \RuntimeException('FCM API error: ' . $response->body());
        }

        $responseData = $response->json();

        return [
            'success_count' => $responseData['success'] ?? 0,
            'failure_count' => $responseData['failure'] ?? 0,
            'multicast_id' => $responseData['multicast_id'] ?? null,
            'results' => $responseData['results'] ?? [],
            'sent' => ($responseData['success'] ?? 0) > 0,
        ];
    }

    /**
     * Send to a topic.
     */
    public function sendToTopic(string $topic, string $title, string $message, array $data = []): array
    {
        if (!$this->serverKey) {
            throw new \RuntimeException('FCM server key not configured');
        }

        $payload = [
            'to' => '/topics/' . $topic,
            'notification' => [
                'title' => $title,
                'body' => $message,
            ],
            'data' => array_merge($data, [
                'timestamp' => time(),
            ]),
            'priority' => 'high',
        ];

        $response = Http::withHeaders([
            'Authorization' => 'key=' . $this->serverKey,
            'Content-Type' => 'application/json',
        ])->post('https://fcm.googleapis.com/fcm/send', $payload);

        if (!$response->successful()) {
            throw new \RuntimeException('FCM API error: ' . $response->body());
        }

        return [
            'message_id' => $response->json('message_id'),
            'topic' => $topic,
            'sent' => true,
        ];
    }

    public function getName(): string
    {
        return 'Firebase Cloud Messaging';
    }

    public function isAvailableFor(User $user): bool
    {
        return config('notifications.channels.fcm.enabled', false)
            && !empty($user->getSetting('fcm_token'));
    }
}

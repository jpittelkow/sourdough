<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use Illuminate\Support\Facades\Http;

class VonageChannel implements ChannelInterface
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        $phoneNumber = $user->getSetting('notifications', 'vonage_phone_number')
            ?? $user->getSetting('phone_number');

        if (!$phoneNumber) {
            throw new \RuntimeException('Phone number not configured for user');
        }

        $apiKey = config('notifications.channels.vonage.api_key');
        $apiSecret = config('notifications.channels.vonage.api_secret');
        $from = config('notifications.channels.vonage.from', 'Sourdough');

        if (!$apiKey || !$apiSecret) {
            throw new \RuntimeException('Vonage configuration incomplete');
        }

        $smsBody = "{$title}\n\n{$message}";

        // Vonage SMS API
        $response = Http::post('https://rest.nexmo.com/sms/json', [
            'api_key' => $apiKey,
            'api_secret' => $apiSecret,
            'to' => $this->formatPhoneNumber($phoneNumber),
            'from' => $from,
            'text' => $smsBody,
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Vonage API error: ' . $response->body());
        }

        $data = $response->json();

        // Vonage returns status in messages array
        if (isset($data['messages'][0]['status']) && $data['messages'][0]['status'] !== '0') {
            throw new \RuntimeException('Vonage SMS failed: ' . ($data['messages'][0]['error-text'] ?? 'Unknown error'));
        }

        return [
            'message_id' => $data['messages'][0]['message-id'] ?? null,
            'to' => $phoneNumber,
            'sent' => true,
        ];
    }

    /**
     * Format phone number for Vonage (remove + and spaces).
     */
    private function formatPhoneNumber(string $phone): string
    {
        return preg_replace('/[^0-9]/', '', $phone);
    }

    public function getName(): string
    {
        return 'SMS (Vonage)';
    }

    public function isAvailableFor(User $user): bool
    {
        $phone = $user->getSetting('notifications', 'vonage_phone_number')
            ?? $user->getSetting('phone_number');

        return config('notifications.channels.vonage.enabled', false)
            && !empty($phone);
    }
}

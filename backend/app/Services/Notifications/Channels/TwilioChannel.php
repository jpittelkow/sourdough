<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use Illuminate\Support\Facades\Http;

class TwilioChannel implements ChannelInterface
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        $phoneNumber = $user->getSetting('notifications', 'twilio_phone_number')
            ?? $user->getSetting('phone_number');

        if (!$phoneNumber) {
            throw new \RuntimeException('Phone number not configured for user');
        }

        $sid = config('notifications.channels.twilio.sid');
        $token = config('notifications.channels.twilio.token');
        $from = config('notifications.channels.twilio.from');

        if (!$sid || !$token || !$from) {
            throw new \RuntimeException('Twilio configuration incomplete');
        }

        $smsBody = "{$title}\n\n{$message}";

        $response = Http::withBasicAuth($sid, $token)
            ->asForm()
            ->post("https://api.twilio.com/2010-04-01/Accounts/{$sid}/Messages.json", [
                'To' => $phoneNumber,
                'From' => $from,
                'Body' => $smsBody,
            ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Twilio API error: ' . $response->body());
        }

        return [
            'sid' => $response->json('sid'),
            'to' => $phoneNumber,
            'sent' => true,
        ];
    }

    public function getName(): string
    {
        return 'SMS (Twilio)';
    }

    public function isAvailableFor(User $user): bool
    {
        $phone = $user->getSetting('notifications', 'twilio_phone_number')
            ?? $user->getSetting('phone_number');

        return config('notifications.channels.twilio.enabled', false)
            && !empty($phone);
    }
}

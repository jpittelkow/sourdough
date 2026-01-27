<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use Illuminate\Support\Facades\Mail;

class EmailChannel implements ChannelInterface
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        Mail::raw($message, function ($mail) use ($user, $title) {
            $mail->to($user->email)
                ->subject($title);
        });

        return [
            'email' => $user->email,
            'sent' => true,
        ];
    }

    public function getName(): string
    {
        return 'Email';
    }

    public function isAvailableFor(User $user): bool
    {
        return !empty($user->email) && config('notifications.channels.email.enabled', false);
    }
}

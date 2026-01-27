<?php

namespace App\Services\Notifications\Channels;

use App\Models\User;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class SignalChannel implements ChannelInterface
{
    public function send(User $user, string $type, string $title, string $message, array $data = []): array
    {
        $recipientPhone = $user->getSetting('signal_phone_number');

        if (!$recipientPhone) {
            throw new \RuntimeException('Signal phone number not configured for user');
        }

        $cliPath = config('notifications.channels.signal.cli_path', '/usr/local/bin/signal-cli');
        $senderPhone = config('notifications.channels.signal.phone_number');
        $configDir = config('notifications.channels.signal.config_dir');

        if (!$senderPhone) {
            throw new \RuntimeException('Signal sender phone number not configured');
        }

        if (!file_exists($cliPath)) {
            throw new \RuntimeException('signal-cli binary not found at: ' . $cliPath);
        }

        $messageText = "{$title}\n\n{$message}";

        // Build the signal-cli command
        $command = [
            $cliPath,
            '-a', $senderPhone,
        ];

        if ($configDir) {
            $command[] = '--config';
            $command[] = $configDir;
        }

        $command = array_merge($command, [
            'send',
            '-m', $messageText,
            $recipientPhone,
        ]);

        $process = new Process($command);
        $process->setTimeout(30);

        try {
            $process->mustRun();

            return [
                'recipient' => $recipientPhone,
                'output' => $process->getOutput(),
                'sent' => true,
            ];
        } catch (ProcessFailedException $e) {
            throw new \RuntimeException('Signal send failed: ' . $e->getMessage());
        }
    }

    public function getName(): string
    {
        return 'Signal';
    }

    public function isAvailableFor(User $user): bool
    {
        return config('notifications.channels.signal.enabled', false)
            && !empty($user->getSetting('signal_phone_number'));
    }
}

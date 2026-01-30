<?php

namespace App\Services;

class EmailConfigService
{
    private const PLACEHOLDER_FROM = 'hello@example.com';

    private const DEV_MAILERS = ['log', 'array'];

    public function __construct(
        private SettingService $settingService
    ) {}

    /**
     * Whether email (SMTP/provider) is properly configured for sending.
     */
    public function isConfigured(): bool
    {
        $status = $this->getStatus();

        return $status['configured'];
    }

    /**
     * Get email configuration status for admin/API.
     *
     * @return array{configured: bool, provider: string, missing_fields: array<string>}
     */
    public function getStatus(): array
    {
        $settings = $this->settingService->getGroup('mail');
        $mailer = (string) ($settings['mailer'] ?? 'log');

        if (in_array($mailer, self::DEV_MAILERS, true)) {
            return [
                'configured' => false,
                'provider' => $mailer,
                'missing_fields' => ['mailer must be smtp, mailgun, sendgrid, ses, or postmark'],
            ];
        }

        $fromAddress = trim((string) ($settings['from_address'] ?? ''));
        if ($fromAddress === '' || $fromAddress === self::PLACEHOLDER_FROM) {
            return [
                'configured' => false,
                'provider' => $mailer,
                'missing_fields' => ['from_address must be set to a real email address'],
            ];
        }

        $missing = match ($mailer) {
            'smtp' => $this->validateSmtp($settings),
            'mailgun' => $this->validateMailgun($settings),
            'sendgrid' => $this->validateSendgrid($settings),
            'ses' => $this->validateSes($settings),
            'postmark' => $this->validatePostmark($settings),
            default => ['mailer must be smtp, mailgun, sendgrid, ses, or postmark'],
        };

        return [
            'configured' => empty($missing),
            'provider' => $mailer,
            'missing_fields' => $missing,
        ];
    }

    /**
     * @param array<string, mixed> $settings
     * @return array<string>
     */
    private function validateSmtp(array $settings): array
    {
        $missing = [];
        $host = trim((string) ($settings['smtp_host'] ?? ''));
        $port = $settings['smtp_port'] ?? null;
        if ($host === '') {
            $missing[] = 'smtp_host';
        }
        if ($port === null || $port === '') {
            $missing[] = 'smtp_port';
        }

        return $missing;
    }

    /**
     * @param array<string, mixed> $settings
     * @return array<string>
     */
    private function validateMailgun(array $settings): array
    {
        $missing = [];
        if (empty(trim((string) ($settings['mailgun_domain'] ?? '')))) {
            $missing[] = 'mailgun_domain';
        }
        if (empty(trim((string) ($settings['mailgun_secret'] ?? '')))) {
            $missing[] = 'mailgun_secret';
        }

        return $missing;
    }

    /**
     * @param array<string, mixed> $settings
     * @return array<string>
     */
    private function validateSendgrid(array $settings): array
    {
        $missing = [];
        if (empty(trim((string) ($settings['sendgrid_api_key'] ?? '')))) {
            $missing[] = 'sendgrid_api_key';
        }

        return $missing;
    }

    /**
     * @param array<string, mixed> $settings
     * @return array<string>
     */
    private function validateSes(array $settings): array
    {
        $missing = [];
        if (empty(trim((string) ($settings['ses_key'] ?? '')))) {
            $missing[] = 'ses_key';
        }
        if (empty(trim((string) ($settings['ses_secret'] ?? '')))) {
            $missing[] = 'ses_secret';
        }
        if (empty(trim((string) ($settings['ses_region'] ?? '')))) {
            $missing[] = 'ses_region';
        }

        return $missing;
    }

    /**
     * @param array<string, mixed> $settings
     * @return array<string>
     */
    private function validatePostmark(array $settings): array
    {
        $missing = [];
        if (empty(trim((string) ($settings['postmark_token'] ?? '')))) {
            $missing[] = 'postmark_token';
        }

        return $missing;
    }
}

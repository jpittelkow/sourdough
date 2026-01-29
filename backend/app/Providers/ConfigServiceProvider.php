<?php

namespace App\Providers;

use App\Services\SettingService;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ConfigServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap services: inject database settings into Laravel config.
     */
    public function boot(): void
    {
        if (!$this->databaseReady()) {
            return;
        }

        $settings = $this->app->make(SettingService::class)->all();

        if (isset($settings['mail'])) {
            $this->injectMailConfig($settings['mail']);
        }

        if (isset($settings['notifications'])) {
            $this->injectNotificationsConfig($settings['notifications']);
        }

        if (isset($settings['llm'])) {
            $this->injectLLMConfig($settings['llm']);
        }

        if (isset($settings['sso'])) {
            $this->injectSSOConfig($settings['sso']);
        }

        if (isset($settings['backup'])) {
            $this->injectBackupConfig($settings['backup']);
        }
    }

    /**
     * Check if database is available, system_settings table exists, and migration has run (is_encrypted column).
     */
    private function databaseReady(): bool
    {
        try {
            DB::connection()->getPdo();
            return Schema::hasTable('system_settings')
                && Schema::hasColumn('system_settings', 'is_encrypted');
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Inject mail settings into Laravel config.
     */
    private function injectMailConfig(array $settings): void
    {
        if (isset($settings['mailer'])) {
            config(['mail.default' => $settings['mailer']]);
        }

        config([
            'mail.mailers.smtp.host' => $settings['smtp_host'] ?? config('mail.mailers.smtp.host'),
            'mail.mailers.smtp.port' => $settings['smtp_port'] ?? config('mail.mailers.smtp.port'),
            'mail.mailers.smtp.encryption' => $settings['smtp_encryption'] ?? config('mail.mailers.smtp.encryption'),
            'mail.mailers.smtp.username' => $settings['smtp_username'] ?? config('mail.mailers.smtp.username'),
            'mail.mailers.smtp.password' => $settings['smtp_password'] ?? config('mail.mailers.smtp.password'),
        ]);

        if (!empty($settings['mailgun_domain'])) {
            config(['mail.mailers.mailgun.domain' => $settings['mailgun_domain']]);
        }
        if (isset($settings['mailgun_secret'])) {
            config(['mail.mailers.mailgun.secret' => $settings['mailgun_secret']]);
        }
        if (isset($settings['sendgrid_api_key'])) {
            config(['mail.mailers.sendgrid.api_key' => $settings['sendgrid_api_key']]);
        }
        if (isset($settings['ses_key'])) {
            config(['mail.mailers.ses.key' => $settings['ses_key']]);
        }
        if (isset($settings['ses_secret'])) {
            config(['mail.mailers.ses.secret' => $settings['ses_secret']]);
        }
        if (!empty($settings['ses_region'])) {
            config(['mail.mailers.ses.region' => $settings['ses_region']]);
        }
        if (isset($settings['postmark_token'])) {
            config(['mail.mailers.postmark.token' => $settings['postmark_token']]);
        }

        if (isset($settings['from_address'])) {
            config(['mail.from.address' => $settings['from_address']]);
        }
        if (isset($settings['from_name'])) {
            config(['mail.from.name' => $settings['from_name']]);
        }
    }

    /**
     * Inject notification channel settings into Laravel config.
     */
    private function injectNotificationsConfig(array $settings): void
    {
        // Telegram
        if (array_key_exists('telegram_bot_token', $settings)) {
            config(['notifications.channels.telegram.bot_token' => $settings['telegram_bot_token']]);
            config(['notifications.channels.telegram.enabled' => !empty($settings['telegram_bot_token'])]);
        }
        // Discord
        if (array_key_exists('discord_webhook_url', $settings)) {
            config(['notifications.channels.discord.webhook_url' => $settings['discord_webhook_url']]);
            config(['notifications.channels.discord.enabled' => !empty($settings['discord_webhook_url'])]);
        }
        if (array_key_exists('discord_bot_name', $settings)) {
            config(['notifications.channels.discord.username' => $settings['discord_bot_name'] ?? config('notifications.channels.discord.username')]);
        }
        if (array_key_exists('discord_avatar_url', $settings)) {
            config(['notifications.channels.discord.avatar_url' => $settings['discord_avatar_url']]);
        }
        // Slack
        if (array_key_exists('slack_webhook_url', $settings)) {
            config(['notifications.channels.slack.webhook_url' => $settings['slack_webhook_url']]);
            config(['notifications.channels.slack.enabled' => !empty($settings['slack_webhook_url'])]);
        }
        if (array_key_exists('slack_bot_name', $settings)) {
            config(['notifications.channels.slack.username' => $settings['slack_bot_name'] ?? config('notifications.channels.slack.username')]);
        }
        if (array_key_exists('slack_icon', $settings)) {
            config(['notifications.channels.slack.icon' => $settings['slack_icon'] ?? config('notifications.channels.slack.icon')]);
        }
        // Signal
        if (array_key_exists('signal_cli_path', $settings)) {
            config(['notifications.channels.signal.cli_path' => $settings['signal_cli_path'] ?? config('notifications.channels.signal.cli_path')]);
            config(['notifications.channels.signal.enabled' => !empty($settings['signal_cli_path']) && !empty($settings['signal_phone_number'] ?? null)]);
        }
        if (array_key_exists('signal_phone_number', $settings)) {
            config(['notifications.channels.signal.phone_number' => $settings['signal_phone_number']]);
        }
        if (array_key_exists('signal_config_dir', $settings) && $settings['signal_config_dir'] !== null && $settings['signal_config_dir'] !== '') {
            config(['notifications.channels.signal.config_dir' => $settings['signal_config_dir']]);
        }
        // Twilio
        if (array_key_exists('twilio_sid', $settings)) {
            config(['notifications.channels.twilio.sid' => $settings['twilio_sid']]);
            config(['notifications.channels.twilio.token' => $settings['twilio_token'] ?? null]);
            config(['notifications.channels.twilio.from' => $settings['twilio_from'] ?? null]);
            config(['notifications.channels.twilio.enabled' => !empty($settings['twilio_sid']) && !empty($settings['twilio_token'] ?? null)]);
        }
        // Vonage
        if (array_key_exists('vonage_api_key', $settings)) {
            config(['notifications.channels.vonage.api_key' => $settings['vonage_api_key']]);
            config(['notifications.channels.vonage.api_secret' => $settings['vonage_api_secret'] ?? null]);
            config(['notifications.channels.vonage.from' => $settings['vonage_from'] ?? null]);
            config(['notifications.channels.vonage.enabled' => !empty($settings['vonage_api_key']) && !empty($settings['vonage_api_secret'] ?? null)]);
        }
        // SNS (uses AWS creds from mail)
        if (array_key_exists('sns_enabled', $settings)) {
            config(['notifications.channels.sns.enabled' => !empty(config('mail.mailers.ses.key')) && $settings['sns_enabled']]);
        }
        // WebPush
        if (array_key_exists('vapid_public_key', $settings)) {
            config(['notifications.channels.webpush.public_key' => $settings['vapid_public_key']]);
            config(['notifications.channels.webpush.private_key' => $settings['vapid_private_key'] ?? null]);
            config(['notifications.channels.webpush.subject' => $settings['vapid_subject'] ?? config('app.url')]);
            config(['notifications.channels.webpush.enabled' => !empty($settings['vapid_public_key']) && !empty($settings['vapid_private_key'] ?? null)]);
        }
        // FCM
        if (array_key_exists('fcm_server_key', $settings)) {
            config(['notifications.channels.fcm.server_key' => $settings['fcm_server_key']]);
            config(['notifications.channels.fcm.enabled' => !empty($settings['fcm_server_key'])]);
        }
        // ntfy
        if (array_key_exists('ntfy_enabled', $settings)) {
            config(['notifications.channels.ntfy.enabled' => $settings['ntfy_enabled']]);
        }
        if (array_key_exists('ntfy_server', $settings)) {
            config(['notifications.channels.ntfy.server' => $settings['ntfy_server'] ?? 'https://ntfy.sh']);
        }
        // Matrix
        if (array_key_exists('matrix_homeserver', $settings)) {
            config(['notifications.channels.matrix.homeserver' => $settings['matrix_homeserver']]);
            config(['notifications.channels.matrix.access_token' => $settings['matrix_access_token'] ?? null]);
            config(['notifications.channels.matrix.default_room' => $settings['matrix_default_room'] ?? null]);
            config(['notifications.channels.matrix.enabled' => !empty($settings['matrix_homeserver']) && !empty($settings['matrix_access_token'] ?? null)]);
        }
    }

    /**
     * Inject LLM system-wide settings into Laravel config.
     */
    private function injectLLMConfig(array $settings): void
    {
        if (array_key_exists('mode', $settings)) {
            config(['llm.mode' => $settings['mode'] ?? config('llm.mode')]);
        }
        if (array_key_exists('primary', $settings)) {
            config(['llm.primary' => $settings['primary'] ?? config('llm.primary')]);
        }
        if (array_key_exists('timeout', $settings)) {
            config(['llm.timeout' => $settings['timeout'] ?? config('llm.timeout')]);
        }
        if (array_key_exists('logging_enabled', $settings)) {
            config(['llm.logging_enabled' => $settings['logging_enabled'] ?? config('llm.logging_enabled')]);
        }
        if (array_key_exists('council_min_providers', $settings)) {
            config(['llm.council.min_providers' => $settings['council_min_providers'] ?? config('llm.council.min_providers')]);
        }
        if (array_key_exists('council_strategy', $settings)) {
            config(['llm.council.resolution_strategy' => $settings['council_strategy'] ?? config('llm.council.resolution_strategy')]);
        }
        if (array_key_exists('aggregation_parallel', $settings)) {
            config(['llm.aggregation.parallel' => $settings['aggregation_parallel'] ?? config('llm.aggregation.parallel')]);
        }
        if (array_key_exists('aggregation_include_sources', $settings)) {
            config(['llm.aggregation.include_sources' => $settings['aggregation_include_sources'] ?? config('llm.aggregation.include_sources')]);
        }
    }

    /**
     * Inject SSO settings into Laravel config (sso.* and services.* for Socialite).
     */
    private function injectSSOConfig(array $settings): void
    {
        if (array_key_exists('enabled', $settings)) {
            config(['sso.enabled' => $settings['enabled'] ?? config('sso.enabled')]);
        }
        if (array_key_exists('allow_linking', $settings)) {
            config(['sso.allow_linking' => $settings['allow_linking'] ?? config('sso.allow_linking')]);
        }
        if (array_key_exists('auto_register', $settings)) {
            config(['sso.auto_register' => $settings['auto_register'] ?? config('sso.auto_register')]);
        }
        if (array_key_exists('trust_provider_email', $settings)) {
            config(['sso.trust_provider_email' => $settings['trust_provider_email'] ?? config('sso.trust_provider_email')]);
        }

        // Provider enabled flags and Socialite credentials
        $providers = ['google', 'github', 'microsoft', 'apple', 'discord', 'gitlab'];
        foreach ($providers as $provider) {
            $clientIdKey = $provider . '_client_id';
            $clientSecretKey = $provider . '_client_secret';
            if (array_key_exists($clientIdKey, $settings)) {
                config(['services.' . $provider . '.client_id' => $settings[$clientIdKey] ?? config('services.' . $provider . '.client_id')]);
                config(['sso.providers.' . $provider . '.enabled' => !empty($settings[$clientIdKey])]);
            }
            if (array_key_exists($clientSecretKey, $settings)) {
                config(['services.' . $provider . '.client_secret' => $settings[$clientSecretKey] ?? config('services.' . $provider . '.client_secret')]);
            }
        }

        // OIDC
        if (array_key_exists('oidc_client_id', $settings)) {
            config(['services.oidc.client_id' => $settings['oidc_client_id'] ?? config('services.oidc.client_id')]);
            config(['sso.providers.oidc.enabled' => !empty($settings['oidc_client_id'] ?? null) && !empty($settings['oidc_issuer_url'] ?? null)]);
        }
        if (array_key_exists('oidc_client_secret', $settings)) {
            config(['services.oidc.client_secret' => $settings['oidc_client_secret'] ?? config('services.oidc.client_secret')]);
        }
        if (array_key_exists('oidc_issuer_url', $settings)) {
            config(['services.oidc.issuer_url' => $settings['oidc_issuer_url'] ?? config('services.oidc.issuer_url')]);
        }
        if (array_key_exists('oidc_provider_name', $settings)) {
            config(['sso.providers.oidc.name' => $settings['oidc_provider_name'] ?? config('sso.providers.oidc.name')]);
        }
    }

    /**
     * Inject backup settings into Laravel config.
     */
    private function injectBackupConfig(array $settings): void
    {
        if (array_key_exists('disk', $settings)) {
            config(['backup.disk' => $settings['disk'] ?? config('backup.disk')]);
        }
        if (array_key_exists('retention_enabled', $settings)) {
            config(['backup.retention.enabled' => $settings['retention_enabled'] ?? config('backup.retention.enabled')]);
        }
        if (array_key_exists('retention_days', $settings)) {
            config(['backup.retention.days' => $settings['retention_days'] ?? config('backup.retention.days')]);
            config(['backup.scheduled.retention.keep_days' => $settings['retention_days'] ?? config('backup.scheduled.retention.keep_days')]);
        }
        if (array_key_exists('retention_count', $settings)) {
            config(['backup.scheduled.retention.keep_count' => $settings['retention_count'] ?? config('backup.scheduled.retention.keep_count')]);
        }
        if (array_key_exists('min_backups', $settings)) {
            config(['backup.retention.min_backups' => $settings['min_backups'] ?? config('backup.retention.min_backups')]);
        }
        if (array_key_exists('schedule_enabled', $settings)) {
            config(['backup.schedule.enabled' => $settings['schedule_enabled'] ?? config('backup.schedule.enabled')]);
        }
        if (array_key_exists('schedule_frequency', $settings)) {
            config(['backup.schedule.frequency' => $settings['schedule_frequency'] ?? config('backup.schedule.frequency')]);
        }
        if (array_key_exists('schedule_time', $settings)) {
            config(['backup.schedule.time' => $settings['schedule_time'] ?? config('backup.schedule.time')]);
        }
        if (array_key_exists('schedule_day', $settings)) {
            config(['backup.schedule.day_of_week' => $settings['schedule_day'] ?? config('backup.schedule.day_of_week')]);
        }
        if (array_key_exists('schedule_date', $settings)) {
            config(['backup.schedule.day_of_month' => $settings['schedule_date'] ?? config('backup.schedule.day_of_month')]);
        }
        if (array_key_exists('scheduled_destinations', $settings)) {
            $dest = $settings['scheduled_destinations'] ?? config('backup.scheduled.destinations');
            config(['backup.scheduled.destinations' => is_string($dest) ? array_map('trim', explode(',', $dest)) : $dest]);
        }
        if (array_key_exists('s3_enabled', $settings)) {
            config(['backup.destinations.s3.enabled' => $settings['s3_enabled'] ?? config('backup.destinations.s3.enabled')]);
        }
        if (array_key_exists('s3_bucket', $settings)) {
            config(['backup.destinations.s3.bucket' => $settings['s3_bucket'] ?? config('backup.destinations.s3.bucket')]);
        }
        if (array_key_exists('s3_path', $settings)) {
            config(['backup.destinations.s3.path' => $settings['s3_path'] ?? config('backup.destinations.s3.path')]);
        }
        if (array_key_exists('s3_access_key_id', $settings)) {
            config(['backup.destinations.s3.key' => $settings['s3_access_key_id'] ?? config('backup.destinations.s3.key')]);
        }
        if (array_key_exists('s3_secret_access_key', $settings)) {
            config(['backup.destinations.s3.secret' => $settings['s3_secret_access_key'] ?? config('backup.destinations.s3.secret')]);
        }
        if (array_key_exists('s3_region', $settings)) {
            config(['backup.destinations.s3.region' => $settings['s3_region'] ?? config('backup.destinations.s3.region')]);
        }
        if (array_key_exists('s3_endpoint', $settings)) {
            config(['backup.destinations.s3.endpoint' => $settings['s3_endpoint'] ?? config('backup.destinations.s3.endpoint')]);
        }
        if (array_key_exists('sftp_enabled', $settings)) {
            config(['backup.destinations.sftp.enabled' => $settings['sftp_enabled'] ?? config('backup.destinations.sftp.enabled')]);
        }
        if (array_key_exists('sftp_host', $settings)) {
            config(['backup.destinations.sftp.host' => $settings['sftp_host'] ?? config('backup.destinations.sftp.host')]);
        }
        if (array_key_exists('sftp_port', $settings)) {
            config(['backup.destinations.sftp.port' => $settings['sftp_port'] ?? config('backup.destinations.sftp.port')]);
        }
        if (array_key_exists('sftp_username', $settings)) {
            config(['backup.destinations.sftp.username' => $settings['sftp_username'] ?? config('backup.destinations.sftp.username')]);
        }
        if (array_key_exists('sftp_password', $settings)) {
            config(['backup.destinations.sftp.password' => $settings['sftp_password'] ?? config('backup.destinations.sftp.password')]);
        }
        if (array_key_exists('sftp_private_key', $settings)) {
            config(['backup.destinations.sftp.private_key' => $settings['sftp_private_key'] ?? config('backup.destinations.sftp.private_key')]);
        }
        if (array_key_exists('sftp_passphrase', $settings)) {
            config(['backup.destinations.sftp.passphrase' => $settings['sftp_passphrase'] ?? config('backup.destinations.sftp.passphrase')]);
        }
        if (array_key_exists('sftp_path', $settings)) {
            config(['backup.destinations.sftp.path' => $settings['sftp_path'] ?? config('backup.destinations.sftp.path')]);
        }
        if (array_key_exists('gdrive_enabled', $settings)) {
            config(['backup.destinations.google_drive.enabled' => $settings['gdrive_enabled'] ?? config('backup.destinations.google_drive.enabled')]);
        }
        if (array_key_exists('gdrive_client_id', $settings)) {
            config(['backup.destinations.google_drive.client_id' => $settings['gdrive_client_id'] ?? config('backup.destinations.google_drive.client_id')]);
        }
        if (array_key_exists('gdrive_client_secret', $settings)) {
            config(['backup.destinations.google_drive.client_secret' => $settings['gdrive_client_secret'] ?? config('backup.destinations.google_drive.client_secret')]);
        }
        if (array_key_exists('gdrive_refresh_token', $settings)) {
            config(['backup.destinations.google_drive.refresh_token' => $settings['gdrive_refresh_token'] ?? config('backup.destinations.google_drive.refresh_token')]);
        }
        if (array_key_exists('gdrive_folder_id', $settings)) {
            config(['backup.destinations.google_drive.folder_id' => $settings['gdrive_folder_id'] ?? config('backup.destinations.google_drive.folder_id')]);
        }
        if (array_key_exists('encryption_enabled', $settings)) {
            config(['backup.encryption.enabled' => $settings['encryption_enabled'] ?? config('backup.encryption.enabled')]);
        }
        if (array_key_exists('encryption_password', $settings)) {
            config(['backup.encryption.password' => $settings['encryption_password'] ?? config('backup.encryption.password')]);
        }
        if (array_key_exists('notify_success', $settings)) {
            config(['backup.notifications.on_success' => $settings['notify_success'] ?? config('backup.notifications.on_success')]);
        }
        if (array_key_exists('notify_failure', $settings)) {
            config(['backup.notifications.on_failure' => $settings['notify_failure'] ?? config('backup.notifications.on_failure')]);
        }
    }
}

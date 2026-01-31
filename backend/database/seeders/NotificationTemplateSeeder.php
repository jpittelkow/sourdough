<?php

namespace Database\Seeders;

use App\Models\NotificationTemplate;
use Illuminate\Database\Seeder;

class NotificationTemplateSeeder extends Seeder
{
    /**
     * Default template definitions. Each type has push, inapp, chat.
     */
    protected static function defaults(): array
    {
        $appName = config('app.name', 'Sourdough');
        return [
            // backup.completed
            ['type' => 'backup.completed', 'channel_group' => 'push', 'title' => '{{app_name}}: Backup complete', 'body' => 'Backup "{{backup_name}}" finished successfully.', 'variables' => ['app_name', 'backup_name', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'backup.completed', 'channel_group' => 'inapp', 'title' => 'Backup complete', 'body' => 'Backup "{{backup_name}}" finished successfully.', 'variables' => ['app_name', 'backup_name', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'backup.completed', 'channel_group' => 'chat', 'title' => '{{app_name}}: Backup complete', 'body' => 'Backup "{{backup_name}}" finished successfully.', 'variables' => ['app_name', 'backup_name', 'user.name'], 'is_system' => true, 'is_active' => true],
            // backup.failed
            ['type' => 'backup.failed', 'channel_group' => 'push', 'title' => '{{app_name}}: Backup failed', 'body' => 'Backup "{{backup_name}}" failed: {{error_message}}', 'variables' => ['app_name', 'backup_name', 'error_message', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'backup.failed', 'channel_group' => 'inapp', 'title' => 'Backup failed', 'body' => 'Backup "{{backup_name}}" failed: {{error_message}}', 'variables' => ['app_name', 'backup_name', 'error_message', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'backup.failed', 'channel_group' => 'chat', 'title' => '{{app_name}}: Backup failed', 'body' => 'Backup "{{backup_name}}" failed: {{error_message}}', 'variables' => ['app_name', 'backup_name', 'error_message', 'user.name'], 'is_system' => true, 'is_active' => true],
            // auth.login
            ['type' => 'auth.login', 'channel_group' => 'push', 'title' => '{{app_name}}: New sign-in', 'body' => 'New sign-in from {{ip}} at {{timestamp}}.', 'variables' => ['app_name', 'ip', 'timestamp', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'auth.login', 'channel_group' => 'inapp', 'title' => 'New sign-in', 'body' => 'New sign-in from {{ip}} at {{timestamp}}.', 'variables' => ['app_name', 'ip', 'timestamp', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'auth.login', 'channel_group' => 'chat', 'title' => '{{app_name}}: New sign-in', 'body' => 'New sign-in from {{ip}} at {{timestamp}}.', 'variables' => ['app_name', 'ip', 'timestamp', 'user.name'], 'is_system' => true, 'is_active' => true],
            // auth.password_reset
            ['type' => 'auth.password_reset', 'channel_group' => 'push', 'title' => '{{app_name}}: Password changed', 'body' => 'Your password was changed. If this wasn\'t you, contact support.', 'variables' => ['app_name', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'auth.password_reset', 'channel_group' => 'inapp', 'title' => 'Password changed', 'body' => 'Your password was changed. If this wasn\'t you, contact support.', 'variables' => ['app_name', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'auth.password_reset', 'channel_group' => 'chat', 'title' => '{{app_name}}: Password changed', 'body' => 'Your password was changed. If this wasn\'t you, contact support.', 'variables' => ['app_name', 'user.name'], 'is_system' => true, 'is_active' => true],
            // system.update
            ['type' => 'system.update', 'channel_group' => 'push', 'title' => '{{app_name}}: Update available', 'body' => 'A new version is ready to install.', 'variables' => ['app_name', 'version', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'system.update', 'channel_group' => 'inapp', 'title' => 'Update available', 'body' => 'A new version ({{version}}) is ready to install.', 'variables' => ['app_name', 'version', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'system.update', 'channel_group' => 'chat', 'title' => '{{app_name}}: Update available', 'body' => 'A new version ({{version}}) is ready to install.', 'variables' => ['app_name', 'version', 'user.name'], 'is_system' => true, 'is_active' => true],
            // llm.quota_warning
            ['type' => 'llm.quota_warning', 'channel_group' => 'push', 'title' => '{{app_name}}: Quota warning', 'body' => 'You have used {{usage}}% of your API quota.', 'variables' => ['app_name', 'usage', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'llm.quota_warning', 'channel_group' => 'inapp', 'title' => 'Quota warning', 'body' => 'You have used {{usage}}% of your API quota.', 'variables' => ['app_name', 'usage', 'user.name'], 'is_system' => true, 'is_active' => true],
            ['type' => 'llm.quota_warning', 'channel_group' => 'chat', 'title' => '{{app_name}}: Quota warning', 'body' => 'You have used {{usage}}% of your API quota.', 'variables' => ['app_name', 'usage', 'user.name'], 'is_system' => true, 'is_active' => true],
        ];
    }

    /**
     * Get default template content for a type and channel group (for reset).
     *
     * @return array{title: string, body: string}|null
     */
    public static function getDefaultFor(string $type, string $channelGroup): ?array
    {
        foreach (self::defaults() as $def) {
            if ($def['type'] === $type && $def['channel_group'] === $channelGroup) {
                return [
                    'title' => $def['title'],
                    'body' => $def['body'],
                ];
            }
        }
        return null;
    }

    public function run(): void
    {
        foreach (self::defaults() as $attrs) {
            NotificationTemplate::updateOrCreate(
                [
                    'type' => $attrs['type'],
                    'channel_group' => $attrs['channel_group'],
                ],
                $attrs
            );
        }
    }
}

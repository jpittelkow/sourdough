<?php

namespace App\Console\Commands;

use App\Models\SystemSetting;
use App\Models\User;
use App\Services\Notifications\NotificationOrchestrator;
use Illuminate\Console\Command;

class StorageAlertCommand extends Command
{
    protected $signature = 'storage:check-alerts';

    protected $description = 'Check storage usage against thresholds and notify admins when exceeded.';

    public function handle(NotificationOrchestrator $orchestrator): int
    {
        $enabled = filter_var(
            SystemSetting::get('storage_alert_enabled', false, 'storage'),
            FILTER_VALIDATE_BOOLEAN
        );

        if (! $enabled) {
            $this->info('Storage alerts are disabled.');

            return self::SUCCESS;
        }

        $storagePath = storage_path();
        $diskFree = disk_free_space($storagePath);
        $diskTotal = disk_total_space($storagePath);

        if ($diskFree === false || $diskTotal === false || $diskTotal <= 0) {
            $this->warn('Unable to determine disk space.');

            return self::FAILURE;
        }

        $diskUsedPercent = round((1 - $diskFree / $diskTotal) * 100, 1);
        $threshold = (int) (SystemSetting::get('storage_alert_threshold', 80, 'storage') ?: 80);
        $critical = (int) (SystemSetting::get('storage_alert_critical', 95, 'storage') ?: 95);
        $sendEmail = filter_var(
            SystemSetting::get('storage_alert_email', true, 'storage'),
            FILTER_VALIDATE_BOOLEAN
        );

        $channels = ['database'];
        if ($sendEmail) {
            $channels[] = 'email';
        }

        $variables = [
            'usage' => (string) $diskUsedPercent,
            'threshold' => (string) $threshold,
            'free_formatted' => $this->formatBytes((int) $diskFree),
            'total_formatted' => $this->formatBytes((int) $diskTotal),
        ];

        $admins = User::whereHas('groups', fn ($q) => $q->where('slug', 'admin'))->get();

        if ($admins->isEmpty()) {
            $this->warn('No admin users to notify.');

            return self::SUCCESS;
        }

        if ($diskUsedPercent >= $critical) {
            $variables['title'] = 'Storage critical: ' . $diskUsedPercent . '% used';
            $variables['message'] = "Storage usage is at {$diskUsedPercent}% (critical threshold: {$critical}%). Free: {$variables['free_formatted']} of {$variables['total_formatted']}. Take action immediately to prevent data loss.";

            foreach ($admins as $admin) {
                try {
                    $orchestrator->send(
                        $admin,
                        'storage.critical',
                        $variables['title'],
                        $variables['message'],
                        $variables,
                        $channels
                    );
                } catch (\Throwable $e) {
                    $this->warn("Failed to notify admin {$admin->id}: " . $e->getMessage());
                }
            }

            $this->warn("Critical storage alert: {$diskUsedPercent}% used. Admins notified: " . $admins->count());

            return self::SUCCESS;
        }

        if ($diskUsedPercent >= $threshold) {
            $variables['title'] = 'Storage warning: ' . $diskUsedPercent . '% used';
            $variables['message'] = "Storage usage is at {$diskUsedPercent}% (warning threshold: {$threshold}%). Free: {$variables['free_formatted']} of {$variables['total_formatted']}. Consider freeing space or expanding storage.";

            foreach ($admins as $admin) {
                try {
                    $orchestrator->send(
                        $admin,
                        'storage.warning',
                        $variables['title'],
                        $variables['message'],
                        $variables,
                        $channels
                    );
                } catch (\Throwable $e) {
                    $this->warn("Failed to notify admin {$admin->id}: " . $e->getMessage());
                }
            }

            $this->info("Storage warning: {$diskUsedPercent}% used. Admins notified: " . $admins->count());

            return self::SUCCESS;
        }

        $this->info("Storage usage OK: {$diskUsedPercent}% (threshold: {$threshold}%).");

        return self::SUCCESS;
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }

        return round($bytes, 2) . ' ' . $units[$i];
    }
}

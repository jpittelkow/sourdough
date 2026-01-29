<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Services\Backup\Destinations\S3Destination;
use App\Services\Backup\Destinations\SFTPDestination;
use App\Services\Backup\Destinations\GoogleDriveDestination;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BackupSettingController extends Controller
{
    use ApiResponseTrait;

    private const GROUP = 'backup';

    private const DESTINATION_CLASSES = [
        's3' => S3Destination::class,
        'sftp' => SFTPDestination::class,
        'google_drive' => GoogleDriveDestination::class,
    ];

    public function __construct(
        private SettingService $settingService
    ) {}

    /**
     * Get all backup settings.
     */
    public function show(): JsonResponse
    {
        $settings = $this->settingService->getGroup(self::GROUP);

        return $this->dataResponse([
            'settings' => $settings,
        ]);
    }

    /**
     * Update backup settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'disk' => ['sometimes', 'string', 'max:64'],
            'retention_enabled' => ['sometimes', 'boolean'],
            'retention_days' => ['sometimes', 'integer', 'min:1', 'max:365'],
            'retention_count' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'min_backups' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'schedule_enabled' => ['sometimes', 'boolean'],
            'schedule_frequency' => ['sometimes', 'string', 'in:daily,weekly,monthly'],
            'schedule_time' => ['sometimes', 'string', 'regex:/^\d{2}:\d{2}$/'],
            'schedule_day' => ['sometimes', 'integer', 'min:0', 'max:6'],
            'schedule_date' => ['sometimes', 'integer', 'min:1', 'max:31'],
            'scheduled_destinations' => ['sometimes', 'string', 'max:255'],
            's3_enabled' => ['sometimes', 'boolean'],
            's3_bucket' => ['sometimes', 'nullable', 'string', 'max:255'],
            's3_path' => ['sometimes', 'nullable', 'string', 'max:255'],
            's3_access_key_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            's3_secret_access_key' => ['sometimes', 'nullable', 'string'],
            's3_region' => ['sometimes', 'nullable', 'string', 'max:64'],
            's3_endpoint' => ['sometimes', 'nullable', 'string', 'max:512'],
            'sftp_enabled' => ['sometimes', 'boolean'],
            'sftp_host' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sftp_port' => ['sometimes', 'integer', 'min:1', 'max:65535'],
            'sftp_username' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sftp_password' => ['sometimes', 'nullable', 'string'],
            'sftp_private_key' => ['sometimes', 'nullable', 'string'],
            'sftp_passphrase' => ['sometimes', 'nullable', 'string'],
            'sftp_path' => ['sometimes', 'nullable', 'string', 'max:512'],
            'gdrive_enabled' => ['sometimes', 'boolean'],
            'gdrive_client_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'gdrive_client_secret' => ['sometimes', 'nullable', 'string'],
            'gdrive_refresh_token' => ['sometimes', 'nullable', 'string'],
            'gdrive_folder_id' => ['sometimes', 'nullable', 'string', 'max:255'],
            'encryption_enabled' => ['sometimes', 'boolean'],
            'encryption_password' => ['sometimes', 'nullable', 'string'],
            'notify_success' => ['sometimes', 'boolean'],
            'notify_failure' => ['sometimes', 'boolean'],
        ]);

        $userId = $request->user()->id;
        foreach ($validated as $key => $value) {
            $this->settingService->set(self::GROUP, $key, $value, $userId);
        }

        return $this->successResponse('Backup settings updated successfully');
    }

    /**
     * Reset a backup setting to env default.
     */
    public function reset(Request $request, string $key): JsonResponse
    {
        $schema = config('settings-schema.backup', []);
        if (!array_key_exists($key, $schema)) {
            return $this->errorResponse('Unknown setting key', 422);
        }
        $this->settingService->reset(self::GROUP, $key);

        return $this->successResponse('Setting reset to default');
    }

    /**
     * Test connectivity to a backup destination (s3, sftp, google_drive).
     */
    public function testDestination(Request $request, string $destination): JsonResponse
    {
        $destination = strtolower($destination);
        if (!array_key_exists($destination, self::DESTINATION_CLASSES)) {
            return $this->errorResponse('Unknown destination. Use: s3, sftp, google_drive', 422);
        }

        $this->injectBackupConfigFromSettings();

        try {
            $class = self::DESTINATION_CLASSES[$destination];
            $instance = new $class();
            $available = $instance->isAvailable();
            if ($available) {
                return $this->successResponse('Connection successful');
            }
            return $this->errorResponse('Connection failed: destination not available or not configured', 400);
        } catch (\Throwable $e) {
            return $this->errorResponse('Connection failed: ' . $e->getMessage(), 400);
        }
    }

    /**
     * Push current backup settings from DB into Laravel config so destination classes read them.
     */
    private function injectBackupConfigFromSettings(): void
    {
        $s = $this->settingService->getGroup(self::GROUP);

        config(['backup.disk' => $s['disk'] ?? config('backup.disk')]);
        config([
            'backup.retention.enabled' => $s['retention_enabled'] ?? config('backup.retention.enabled'),
            'backup.retention.days' => $s['retention_days'] ?? config('backup.retention.days'),
            'backup.retention.min_backups' => $s['min_backups'] ?? config('backup.retention.min_backups'),
        ]);
        config([
            'backup.schedule.enabled' => $s['schedule_enabled'] ?? config('backup.schedule.enabled'),
            'backup.schedule.frequency' => $s['schedule_frequency'] ?? config('backup.schedule.frequency'),
            'backup.schedule.time' => $s['schedule_time'] ?? config('backup.schedule.time'),
            'backup.schedule.day_of_week' => $s['schedule_day'] ?? config('backup.schedule.day_of_week'),
            'backup.schedule.day_of_month' => $s['schedule_date'] ?? config('backup.schedule.day_of_month'),
        ]);
        config([
            'backup.scheduled.destinations' => isset($s['scheduled_destinations'])
                ? array_map('trim', explode(',', (string) $s['scheduled_destinations']))
                : config('backup.scheduled.destinations'),
            'backup.scheduled.retention.keep_count' => $s['retention_count'] ?? config('backup.scheduled.retention.keep_count'),
            'backup.scheduled.retention.keep_days' => $s['retention_days'] ?? config('backup.scheduled.retention.keep_days'),
        ]);
        config([
            'backup.encryption.enabled' => $s['encryption_enabled'] ?? config('backup.encryption.enabled'),
            'backup.encryption.password' => $s['encryption_password'] ?? config('backup.encryption.password'),
        ]);
        config([
            'backup.notifications.on_success' => $s['notify_success'] ?? config('backup.notifications.on_success'),
            'backup.notifications.on_failure' => $s['notify_failure'] ?? config('backup.notifications.on_failure'),
        ]);

        config(['backup.destinations.s3.enabled' => $s['s3_enabled'] ?? config('backup.destinations.s3.enabled')]);
        config([
            'backup.destinations.s3.bucket' => $s['s3_bucket'] ?? config('backup.destinations.s3.bucket'),
            'backup.destinations.s3.path' => $s['s3_path'] ?? config('backup.destinations.s3.path'),
            'backup.destinations.s3.region' => $s['s3_region'] ?? config('backup.destinations.s3.region'),
            'backup.destinations.s3.endpoint' => $s['s3_endpoint'] ?? config('backup.destinations.s3.endpoint'),
        ]);
        if (array_key_exists('s3_access_key_id', $s)) {
            config(['backup.destinations.s3.key' => $s['s3_access_key_id']]);
        }
        if (array_key_exists('s3_secret_access_key', $s)) {
            config(['backup.destinations.s3.secret' => $s['s3_secret_access_key']]);
        }

        config(['backup.destinations.sftp.enabled' => $s['sftp_enabled'] ?? config('backup.destinations.sftp.enabled')]);
        config([
            'backup.destinations.sftp.host' => $s['sftp_host'] ?? config('backup.destinations.sftp.host'),
            'backup.destinations.sftp.port' => $s['sftp_port'] ?? config('backup.destinations.sftp.port'),
            'backup.destinations.sftp.username' => $s['sftp_username'] ?? config('backup.destinations.sftp.username'),
            'backup.destinations.sftp.password' => $s['sftp_password'] ?? config('backup.destinations.sftp.password'),
            'backup.destinations.sftp.private_key' => $s['sftp_private_key'] ?? config('backup.destinations.sftp.private_key'),
            'backup.destinations.sftp.passphrase' => $s['sftp_passphrase'] ?? config('backup.destinations.sftp.passphrase'),
            'backup.destinations.sftp.path' => $s['sftp_path'] ?? config('backup.destinations.sftp.path'),
        ]);

        config(['backup.destinations.google_drive.enabled' => $s['gdrive_enabled'] ?? config('backup.destinations.google_drive.enabled')]);
        config([
            'backup.destinations.google_drive.client_id' => $s['gdrive_client_id'] ?? config('backup.destinations.google_drive.client_id'),
            'backup.destinations.google_drive.client_secret' => $s['gdrive_client_secret'] ?? config('backup.destinations.google_drive.client_secret'),
            'backup.destinations.google_drive.refresh_token' => $s['gdrive_refresh_token'] ?? config('backup.destinations.google_drive.refresh_token'),
            'backup.destinations.google_drive.folder_id' => $s['gdrive_folder_id'] ?? config('backup.destinations.google_drive.folder_id'),
        ]);
    }
}

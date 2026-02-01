<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\AuditService;
use App\Services\StorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class StorageSettingController extends Controller
{
    /**
     * Get storage settings.
     */
    public function show(): JsonResponse
    {
        $settings = SystemSetting::getGroup('storage');

        return response()->json([
            'settings' => $settings,
        ]);
    }

    /**
     * Get storage location paths and descriptions.
     */
    public function paths(): JsonResponse
    {
        return response()->json([
            'paths' => [
                ['key' => 'app', 'path' => storage_path('app'), 'description' => 'Application files'],
                ['key' => 'public', 'path' => storage_path('app/public'), 'description' => 'Publicly accessible files'],
                ['key' => 'backups', 'path' => storage_path('app/backups'), 'description' => 'Database and file backups'],
                ['key' => 'cache', 'path' => storage_path('framework/cache'), 'description' => 'Framework cache'],
                ['key' => 'sessions', 'path' => storage_path('framework/sessions'), 'description' => 'Session files'],
                ['key' => 'logs', 'path' => storage_path('logs'), 'description' => 'Application logs'],
            ],
        ]);
    }

    /**
     * Get storage health status (permissions, disk space).
     */
    public function health(): JsonResponse
    {
        $storagePath = storage_path();
        $diskFree = disk_free_space($storagePath);
        $diskTotal = disk_total_space($storagePath);
        $diskFree = $diskFree !== false ? (int) $diskFree : 0;
        $diskTotal = $diskTotal !== false ? (int) $diskTotal : 0;
        $diskUsedPercent = $diskTotal > 0
            ? round((1 - $diskFree / $diskTotal) * 100, 1)
            : 0;

        $checks = [
            'writable' => is_writable($storagePath),
            'disk_free_bytes' => $diskFree,
            'disk_total_bytes' => $diskTotal,
            'disk_used_percent' => $diskUsedPercent,
        ];

        $checks['status'] = $checks['writable'] && $checks['disk_used_percent'] < 90 ? 'healthy' : 'warning';
        $checks['disk_free_formatted'] = $this->formatBytes($checks['disk_free_bytes']);
        $checks['disk_total_formatted'] = $this->formatBytes($checks['disk_total_bytes']);

        return response()->json($checks);
    }

    /**
     * Test storage connection for the given driver and config.
     */
    public function test(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'driver' => ['required', 'string', 'in:local,s3,gcs,azure,do_spaces,minio,b2'],
        ]);

        $driver = $validated['driver'];
        $config = $request->except(['driver']);
        $result = $this->storageService()->testConnection($driver, $config);

        if ($result['success']) {
            return response()->json(['success' => true]);
        }

        return response()->json([
            'success' => false,
            'error' => $result['error'] ?? 'Connection test failed',
        ], 422);
    }

    /**
     * Update storage settings.
     */
    public function update(Request $request): JsonResponse
    {
        $rules = [
            'driver' => ['required', 'string', 'in:local,s3,gcs,azure,do_spaces,minio,b2'],
            'max_upload_size' => ['required', 'integer', 'min:1'],
            'allowed_file_types' => ['required', 'array'],
            'storage_alert_enabled' => ['sometimes', 'boolean'],
            'storage_alert_threshold' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'storage_alert_critical' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'storage_alert_email' => ['sometimes', 'boolean'],
            's3_bucket' => ['required_if:driver,s3', 'nullable', 'string'],
            's3_region' => ['required_if:driver,s3', 'nullable', 'string'],
            's3_key' => ['required_if:driver,s3', 'nullable', 'string'],
            's3_secret' => ['required_if:driver,s3', 'nullable', 'string'],
            'gcs_bucket' => ['required_if:driver,gcs', 'nullable', 'string'],
            'gcs_project_id' => ['required_if:driver,gcs', 'nullable', 'string'],
            'gcs_credentials_json' => ['required_if:driver,gcs', 'nullable', 'string'],
            'azure_container' => ['required_if:driver,azure', 'nullable', 'string'],
            'azure_connection_string' => ['required_if:driver,azure', 'nullable', 'string'],
            'do_spaces_bucket' => ['required_if:driver,do_spaces', 'nullable', 'string'],
            'do_spaces_region' => ['required_if:driver,do_spaces', 'nullable', 'string'],
            'do_spaces_key' => ['required_if:driver,do_spaces', 'nullable', 'string'],
            'do_spaces_secret' => ['required_if:driver,do_spaces', 'nullable', 'string'],
            'do_spaces_endpoint' => ['nullable', 'string'],
            'minio_bucket' => ['required_if:driver,minio', 'nullable', 'string'],
            'minio_endpoint' => ['required_if:driver,minio', 'nullable', 'string'],
            'minio_key' => ['required_if:driver,minio', 'nullable', 'string'],
            'minio_secret' => ['required_if:driver,minio', 'nullable', 'string'],
            'b2_bucket' => ['required_if:driver,b2', 'nullable', 'string'],
            'b2_region' => ['required_if:driver,b2', 'nullable', 'string'],
            'b2_key_id' => ['required_if:driver,b2', 'nullable', 'string'],
            'b2_application_key' => ['required_if:driver,b2', 'nullable', 'string'],
        ];

        $validated = $request->validate($rules);

        $user = $request->user();

        foreach ($validated as $key => $value) {
            SystemSetting::set($key, $value, 'storage', $user->id, false);
        }

        return response()->json([
            'message' => 'Storage settings updated successfully',
        ]);
    }

    private function storageService(): StorageService
    {
        return app(StorageService::class);
    }

    /**
     * Get cleanup suggestions (local driver only).
     */
    public function cleanupSuggestions(): JsonResponse
    {
        try {
            $driver = SystemSetting::get('driver', 'local', 'storage');
            $suggestions = [
                'cache' => ['count' => 0, 'size' => 0, 'description' => 'Framework cache files'],
                'temp' => ['count' => 0, 'size' => 0, 'description' => 'Temporary files older than 7 days'],
                'old_backups' => ['count' => 0, 'size' => 0, 'description' => 'Backups beyond retention policy'],
            ];
            $totalReclaimable = 0;

            if ($driver !== 'local') {
                return response()->json([
                    'suggestions' => $suggestions,
                    'total_reclaimable' => 0,
                    'note' => 'Cleanup available for local storage only.',
                ]);
            }

            $cachePath = storage_path('framework/cache/data');
            if (is_dir($cachePath)) {
                $cacheSize = $this->getDirectorySize($cachePath);
                $cacheCount = $this->countFilesInDir($cachePath);
                $suggestions['cache'] = [
                    'count' => $cacheCount,
                    'size' => $cacheSize,
                    'size_formatted' => $this->formatBytes($cacheSize),
                    'description' => 'Framework cache files',
                ];
                $totalReclaimable += $cacheSize;
            }

            $tempPath = storage_path('app/temp');
            if (is_dir($tempPath)) {
                $cutoff = time() - (7 * 24 * 60 * 60);
                [$tempCount, $tempSize] = $this->getOldFilesInDir($tempPath, $cutoff);
                $suggestions['temp'] = [
                    'count' => $tempCount,
                    'size' => $tempSize,
                    'size_formatted' => $this->formatBytes($tempSize),
                    'description' => 'Temporary files older than 7 days',
                ];
                $totalReclaimable += $tempSize;
            }

            $backupsPath = storage_path('app/backups');
            if (is_dir($backupsPath)) {
                $keepCount = (int) config('backup.scheduled.retention.keep_count', 10);
                $keepDays = (int) config('backup.scheduled.retention.keep_days', 30);
                $cutoff = time() - ($keepDays * 24 * 60 * 60);
                $backupFiles = [];
                foreach (glob($backupsPath . '/*.zip') ?: [] as $f) {
                    $mtime = filemtime($f);
                    $backupFiles[] = ['path' => $f, 'mtime' => $mtime, 'size' => filesize($f)];
                }
                usort($backupFiles, fn ($a, $b) => $b['mtime'] <=> $a['mtime']);
                $toRemove = [];
                foreach (array_slice($backupFiles, $keepCount) as $f) {
                    if ($f['mtime'] < $cutoff) {
                        $toRemove[] = $f;
                    }
                }
                $oldBackupSize = array_sum(array_column($toRemove, 'size'));
                $suggestions['old_backups'] = [
                    'count' => count($toRemove),
                    'size' => $oldBackupSize,
                    'size_formatted' => $this->formatBytes($oldBackupSize),
                    'description' => 'Backups beyond retention policy',
                ];
                $totalReclaimable += $oldBackupSize;
            }

            return response()->json([
                'suggestions' => $suggestions,
                'total_reclaimable' => $totalReclaimable,
                'total_reclaimable_formatted' => $this->formatBytes($totalReclaimable),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Unable to get cleanup suggestions: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Execute cleanup for a given type.
     */
    public function cleanup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'string', 'in:cache,temp,old_backups'],
        ]);
        $type = $validated['type'];

        $driver = SystemSetting::get('driver', 'local', 'storage');
        if ($driver !== 'local') {
            return response()->json(['message' => 'Cleanup available for local storage only.'], 422);
        }

        try {
            $freed = 0;
            $count = 0;

            if ($type === 'cache') {
                $cachePath = storage_path('framework/cache/data');
                if (is_dir($cachePath)) {
                    $freed = $this->getDirectorySize($cachePath);
                    $count = $this->countFilesInDir($cachePath);
                    $this->deleteDirectoryContents($cachePath);
                }
            } elseif ($type === 'temp') {
                $tempPath = storage_path('app/temp');
                if (is_dir($tempPath)) {
                    $cutoff = time() - (7 * 24 * 60 * 60);
                    [$count, $freed] = $this->deleteOldFilesInDir($tempPath, $cutoff);
                }
            } elseif ($type === 'old_backups') {
                $backupsPath = storage_path('app/backups');
                $keepCount = (int) config('backup.scheduled.retention.keep_count', 10);
                $keepDays = (int) config('backup.scheduled.retention.keep_days', 30);
                $cutoff = time() - ($keepDays * 24 * 60 * 60);
                $backupFiles = [];
                foreach (glob($backupsPath . '/*.zip') ?: [] as $f) {
                    $backupFiles[] = ['path' => $f, 'mtime' => filemtime($f), 'size' => filesize($f)];
                }
                usort($backupFiles, fn ($a, $b) => $b['mtime'] <=> $a['mtime']);
                foreach (array_slice($backupFiles, $keepCount) as $f) {
                    if ($f['mtime'] < $cutoff) {
                        unlink($f['path']);
                        $count++;
                        $freed += $f['size'];
                    }
                }
            }

            app(AuditService::class)->log('storage.cleanup', null, [], [
                'type' => $type,
                'files_removed' => $count,
                'bytes_freed' => $freed,
            ]);

            return response()->json([
                'message' => 'Cleanup completed.',
                'files_removed' => $count,
                'bytes_freed' => $freed,
                'bytes_freed_formatted' => $this->formatBytes($freed),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'message' => 'Cleanup failed.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get storage analytics (by type, top files, recent files).
     * Local driver only.
     */
    public function analytics(): JsonResponse
    {
        try {
            $driver = SystemSetting::get('driver', 'local', 'storage');
            $analytics = [
                'driver' => $driver,
                'by_type' => [],
                'top_files' => [],
                'recent_files' => [],
            ];

            if ($driver === 'local') {
                $disk = Storage::disk('local');
                $allFiles = $disk->allFiles();

                $byType = [];
                $filesWithMeta = [];

                foreach ($allFiles as $file) {
                    try {
                        $size = $disk->size($file);
                        $lastModified = $disk->lastModified($file);
                        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION)) ?: 'none';
                        $byType[$ext] = ($byType[$ext] ?? 0) + $size;
                        $filesWithMeta[] = [
                            'path' => $file,
                            'size' => $size,
                            'lastModified' => $lastModified,
                            'name' => basename($file),
                        ];
                    } catch (\Throwable $e) {
                        continue;
                    }
                }

                arsort($byType);
                $analytics['by_type'] = $byType;

                usort($filesWithMeta, fn ($a, $b) => $b['size'] <=> $a['size']);
                $topFiles = array_slice($filesWithMeta, 0, 10);
                foreach ($topFiles as &$f) {
                    $f['size_formatted'] = $this->formatBytes($f['size']);
                    $f['lastModifiedFormatted'] = date('Y-m-d H:i:s', $f['lastModified']);
                }
                $analytics['top_files'] = $topFiles;

                usort($filesWithMeta, fn ($a, $b) => $b['lastModified'] <=> $a['lastModified']);
                $recentFiles = array_slice($filesWithMeta, 0, 10);
                foreach ($recentFiles as &$f) {
                    $f['size_formatted'] = $this->formatBytes($f['size']);
                    $f['lastModifiedFormatted'] = date('Y-m-d H:i:s', $f['lastModified']);
                }
                $analytics['recent_files'] = $recentFiles;
            } else {
                $analytics['note'] = 'Analytics available for local storage only';
            }

            return response()->json($analytics);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Unable to retrieve storage analytics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get storage usage statistics.
     */
    public function stats(): JsonResponse
    {
        try {
            $driver = SystemSetting::get('driver', 'local', 'storage');
            $stats = [
                'driver' => $driver,
                'total_size' => 0,
                'file_count' => 0,
            ];

            if ($driver === 'local') {
                $files = Storage::disk('local')->allFiles();
                $stats['file_count'] = count($files);

                foreach ($files as $file) {
                    $stats['total_size'] += Storage::disk('local')->size($file);
                }

                $breakdown = [];
                $directories = ['app', 'app/public', 'app/backups', 'framework/cache', 'framework/sessions', 'logs'];

                foreach ($directories as $dir) {
                    $fullPath = storage_path($dir);
                    if (is_dir($fullPath)) {
                        $size = $this->getDirectorySize($fullPath);
                        $breakdown[$dir] = [
                            'size' => $size,
                            'size_formatted' => $this->formatBytes($size),
                        ];
                    }
                }
                $stats['breakdown'] = $breakdown;
            } elseif (in_array($driver, ['s3', 'gcs', 'azure', 'do_spaces', 'minio', 'b2'], true)) {
                $stats['note'] = 'Cloud storage statistics require provider SDK integration';
            }

            // Format size
            $stats['total_size_formatted'] = $this->formatBytes($stats['total_size']);

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unable to retrieve storage statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get total size of a directory recursively (bytes).
     */
    private function getDirectorySize(string $path): int
    {
        $size = 0;

        if (! is_dir($path)) {
            return 0;
        }

        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }

    private function countFilesInDir(string $path): int
    {
        $count = 0;
        if (! is_dir($path)) {
            return 0;
        }
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            if ($file->isFile()) {
                $count++;
            }
        }
        return $count;
    }

    /**
     * @return array{int, int} [count, total_size]
     */
    private function getOldFilesInDir(string $path, int $cutoffTimestamp): array
    {
        $count = 0;
        $size = 0;
        if (! is_dir($path)) {
            return [0, 0];
        }
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            if ($file->isFile() && $file->getMTime() < $cutoffTimestamp) {
                $count++;
                $size += $file->getSize();
            }
        }
        return [$count, $size];
    }

    private function deleteDirectoryContents(string $path): void
    {
        if (! is_dir($path)) {
            return;
        }
        foreach (new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS | \RecursiveDirectoryIterator::CATCH_GET_CHILD),
            \RecursiveIteratorIterator::CHILD_FIRST
        ) as $file) {
            if ($file->isDir()) {
                rmdir($file->getRealPath());
            } else {
                unlink($file->getRealPath());
            }
        }
    }

    /**
     * @return array{int, int} [count, bytes_freed]
     */
    private function deleteOldFilesInDir(string $path, int $cutoffTimestamp): array
    {
        $count = 0;
        $freed = 0;
        if (! is_dir($path)) {
            return [0, 0];
        }
        foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($path, \RecursiveDirectoryIterator::SKIP_DOTS)) as $file) {
            if ($file->isFile() && $file->getMTime() < $cutoffTimestamp) {
                $freed += $file->getSize();
                unlink($file->getRealPath());
                $count++;
            }
        }
        return [$count, $freed];
    }

    /**
     * Format bytes to human-readable format.
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}

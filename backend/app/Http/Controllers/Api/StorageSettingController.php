<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
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

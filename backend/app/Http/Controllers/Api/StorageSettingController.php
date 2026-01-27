<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
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
     * Update storage settings.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'driver' => ['required', 'string', 'in:local,s3'],
            'max_upload_size' => ['required', 'integer', 'min:1'],
            'allowed_file_types' => ['required', 'array'],
            's3_bucket' => ['required_if:driver,s3', 'nullable', 'string'],
            's3_region' => ['required_if:driver,s3', 'nullable', 'string'],
            's3_key' => ['required_if:driver,s3', 'nullable', 'string'],
            's3_secret' => ['required_if:driver,s3', 'nullable', 'string'],
        ]);

        $user = $request->user();

        foreach ($validated as $key => $value) {
            SystemSetting::set($key, $value, 'storage', $user->id, false);
        }

        return response()->json([
            'message' => 'Storage settings updated successfully',
        ]);
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
            } elseif ($driver === 's3') {
                // S3 stats would require AWS SDK calls
                // This is a placeholder - implement based on your needs
                $stats['note'] = 'S3 statistics require AWS SDK integration';
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

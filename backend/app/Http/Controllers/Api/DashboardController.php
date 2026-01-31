<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Get dashboard stats for the stats widget.
     */
    public function stats(Request $request): JsonResponse
    {
        $storagePath = storage_path();
        $diskTotal = disk_total_space($storagePath);
        $diskFree = disk_free_space($storagePath);
        $diskTotal = $diskTotal !== false ? (int) $diskTotal : 0;
        $diskFree = $diskFree !== false ? (int) $diskFree : 0;
        $storageUsed = $diskTotal - $diskFree;

        $metrics = [
            ['label' => 'Total Users', 'value' => User::count()],
            ['label' => 'Storage Used', 'value' => $this->formatBytes($storageUsed)],
        ];

        return response()->json(['metrics' => $metrics]);
    }

    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }
}

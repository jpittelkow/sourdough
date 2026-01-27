<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

class JobController extends Controller
{
    /**
     * Get scheduled tasks.
     */
    public function scheduled(): JsonResponse
    {
        try {
            // Run schedule:list command and capture output
            Artisan::call('schedule:list');
            $output = Artisan::output();

            // Parse the output (this is a simplified version)
            // In production, you might want to parse this more carefully
            $tasks = [];
            $lines = explode("\n", trim($output));
            
            foreach ($lines as $line) {
                if (empty(trim($line)) || strpos($line, 'Command') !== false) {
                    continue;
                }
                
                // Basic parsing - adjust based on actual Laravel schedule:list output format
                if (preg_match('/^(.+?)\s+(\d+.*?)\s+(.+)$/', $line, $matches)) {
                    $tasks[] = [
                        'command' => trim($matches[1] ?? ''),
                        'schedule' => trim($matches[2] ?? ''),
                        'description' => trim($matches[3] ?? ''),
                    ];
                }
            }

            return response()->json([
                'tasks' => $tasks,
                'raw_output' => $output, // Include raw output for debugging
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'tasks' => [],
                'error' => 'Unable to retrieve scheduled tasks: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Get queue status.
     */
    public function queueStatus(): JsonResponse
    {
        try {
            $stats = [
                'pending' => DB::table('jobs')->count(),
                'failed' => DB::table('failed_jobs')->count(),
            ];

            // Try to get queue size if using Redis/database queue
            try {
                $stats['queues'] = [];
                $queues = ['default', 'high', 'low']; // Common queue names
                
                foreach ($queues as $queue) {
                    $stats['queues'][$queue] = DB::table('jobs')
                        ->where('queue', $queue)
                        ->count();
                }
            } catch (\Exception $e) {
                // Queue stats might not be available
            }

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unable to retrieve queue status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get failed jobs.
     */
    public function failedJobs(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 20);

        $jobs = DB::table('failed_jobs')
            ->orderBy('failed_at', 'desc')
            ->paginate($perPage);

        return response()->json($jobs);
    }

    /**
     * Retry a failed job.
     */
    public function retryJob(int $id): JsonResponse
    {
        try {
            $job = DB::table('failed_jobs')->where('id', $id)->first();

            if (!$job) {
                return response()->json([
                    'message' => 'Failed job not found',
                ], 404);
            }

            Artisan::call('queue:retry', ['id' => $id]);

            return response()->json([
                'message' => 'Job queued for retry',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retry job: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a failed job.
     */
    public function deleteJob(int $id): JsonResponse
    {
        try {
            $deleted = DB::table('failed_jobs')->where('id', $id)->delete();

            if ($deleted) {
                return response()->json([
                    'message' => 'Failed job deleted',
                ]);
            }

            return response()->json([
                'message' => 'Failed job not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete job: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Retry all failed jobs.
     */
    public function retryAllFailed(): JsonResponse
    {
        try {
            Artisan::call('queue:retry', ['id' => 'all']);

            return response()->json([
                'message' => 'All failed jobs queued for retry',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to retry jobs: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Clear all failed jobs.
     */
    public function clearFailed(): JsonResponse
    {
        try {
            Artisan::call('queue:flush');

            return response()->json([
                'message' => 'All failed jobs cleared',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to clear jobs: ' . $e->getMessage(),
            ], 500);
        }
    }
}

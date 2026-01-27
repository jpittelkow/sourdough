<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    /**
     * Get paginated audit logs with filters.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 50);
        $userId = $request->input('user_id');
        $action = $request->input('action');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = AuditLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($action) {
            $query->where('action', 'like', "%{$action}%");
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $logs = $query->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Export audit logs as CSV.
     */
    public function export(Request $request)
    {
        $userId = $request->input('user_id');
        $action = $request->input('action');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = AuditLog::with('user');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($action) {
            $query->where('action', 'like', "%{$action}%");
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $logs = $query->get();

        $filename = 'audit_logs_' . date('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');

            // Header row
            fputcsv($file, [
                'ID',
                'Date',
                'User',
                'Action',
                'IP Address',
                'User Agent',
            ]);

            // Data rows
            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->user ? $log->user->email : 'System',
                    $log->action,
                    $log->ip_address ?? '',
                    $log->user_agent ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get audit log statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $dateFrom = $request->input('date_from', now()->subDays(30)->format('Y-m-d'));
        $dateTo = $request->input('date_to', now()->format('Y-m-d'));

        $stats = [
            'total_actions' => AuditLog::whereBetween('created_at', [$dateFrom, $dateTo . ' 23:59:59'])->count(),
            'actions_by_type' => AuditLog::whereBetween('created_at', [$dateFrom, $dateTo . ' 23:59:59'])
                ->select('action', DB::raw('count(*) as count'))
                ->groupBy('action')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->pluck('count', 'action'),
            'actions_by_user' => AuditLog::whereBetween('created_at', [$dateFrom, $dateTo . ' 23:59:59'])
                ->whereNotNull('user_id')
                ->select('user_id', DB::raw('count(*) as count'))
                ->groupBy('user_id')
                ->orderByDesc('count')
                ->limit(10)
                ->with('user:id,name,email')
                ->get()
                ->map(function ($item) {
                    return [
                        'user' => $item->user,
                        'count' => $item->count,
                    ];
                }),
        ];

        return response()->json($stats);
    }
}

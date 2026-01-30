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
        $perPage = $request->input('per_page', config('app.pagination.audit_log'));
        $userId = $request->input('user_id');
        $action = $request->input('action');
        $severity = $request->input('severity');
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

        if ($severity) {
            $query->where('severity', $severity);
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
        $severity = $request->input('severity');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = AuditLog::with('user');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($action) {
            $query->where('action', 'like', "%{$action}%");
        }

        if ($severity) {
            $query->where('severity', $severity);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

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
                'Severity',
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
                    $log->severity ?? 'info',
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
        $baseQuery = AuditLog::whereBetween('created_at', [$dateFrom, $dateTo . ' 23:59:59']);

        $stats = [
            'total_actions' => (clone $baseQuery)->count(),
            'actions_by_type' => (clone $baseQuery)
                ->select('action', DB::raw('count(*) as count'))
                ->groupBy('action')
                ->orderByDesc('count')
                ->limit(10)
                ->get()
                ->pluck('count', 'action'),
            'actions_by_user' => (clone $baseQuery)
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
            'by_severity' => (clone $baseQuery)
                ->select('severity', DB::raw('count(*) as count'))
                ->groupBy('severity')
                ->get()
                ->pluck('count', 'severity'),
            'daily_trends' => (clone $baseQuery)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get()
                ->pluck('count', 'date'),
            'recent_warnings' => (clone $baseQuery)
                ->whereIn('severity', ['warning', 'error', 'critical'])
                ->with('user:id,name,email')
                ->orderByDesc('created_at')
                ->limit(5)
                ->get()
                ->map(fn ($log) => [
                    'id' => $log->id,
                    'action' => $log->action,
                    'severity' => $log->severity,
                    'created_at' => $log->created_at->toIso8601String(),
                    'user' => $log->user,
                ]),
        ];

        return response()->json($stats);
    }
}

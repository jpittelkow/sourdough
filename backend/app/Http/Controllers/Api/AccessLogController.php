<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AccessLog;
use App\Models\AuditLog;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AccessLogController extends Controller
{
    public function __construct(
        private AuditService $auditService
    ) {}

    /**
     * Get paginated access logs with filters (HIPAA).
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', config('app.pagination.audit_log', 50));
        $userId = $request->input('user_id');
        $action = $request->input('action');
        $resourceType = $request->input('resource_type');
        $correlationId = $request->input('correlation_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = AccessLog::with('user')
            ->orderBy('created_at', 'desc');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($action) {
            $query->where('action', $action);
        }

        if ($resourceType) {
            $query->where('resource_type', $resourceType);
        }

        if ($correlationId !== null && $correlationId !== '') {
            $query->where('correlation_id', $correlationId);
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
     * Export access logs as CSV.
     */
    public function export(Request $request)
    {
        $userId = $request->input('user_id');
        $action = $request->input('action');
        $resourceType = $request->input('resource_type');
        $correlationId = $request->input('correlation_id');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $query = AccessLog::with('user');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($action) {
            $query->where('action', $action);
        }

        if ($resourceType) {
            $query->where('resource_type', $resourceType);
        }

        if ($correlationId !== null && $correlationId !== '') {
            $query->where('correlation_id', $correlationId);
        }

        if ($dateFrom) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $logs = $query->orderBy('created_at', 'desc')->get();

        $filename = 'access_logs_' . date('Y-m-d_His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');

            fputcsv($file, [
                'ID',
                'Date',
                'User',
                'Action',
                'Resource Type',
                'Resource ID',
                'Correlation ID',
                'Fields',
                'IP Address',
                'User Agent',
            ]);

            foreach ($logs as $log) {
                fputcsv($file, [
                    $log->id,
                    $log->created_at->format('Y-m-d H:i:s'),
                    $log->user ? $log->user->email : '',
                    $log->action,
                    $log->resource_type,
                    $log->resource_id ?? '',
                    $log->correlation_id ?? '',
                    $log->fields_accessed ? implode(',', $log->fields_accessed) : '',
                    $log->ip_address ?? '',
                    $log->user_agent ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get access log statistics.
     */
    public function stats(Request $request): JsonResponse
    {
        $dateFrom = $request->input('date_from', now()->subDays(30)->format('Y-m-d'));
        $dateTo = $request->input('date_to', now()->format('Y-m-d'));
        $baseQuery = AccessLog::whereBetween('created_at', [$dateFrom, $dateTo . ' 23:59:59']);

        $stats = [
            'total' => (clone $baseQuery)->count(),
            'by_action' => (clone $baseQuery)
                ->select('action', DB::raw('count(*) as count'))
                ->groupBy('action')
                ->orderByDesc('count')
                ->get()
                ->pluck('count', 'action'),
            'by_resource_type' => (clone $baseQuery)
                ->select('resource_type', DB::raw('count(*) as count'))
                ->groupBy('resource_type')
                ->orderByDesc('count')
                ->get()
                ->pluck('count', 'resource_type'),
            'by_user' => (clone $baseQuery)
                ->select('user_id', DB::raw('count(*) as count'))
                ->groupBy('user_id')
                ->orderByDesc('count')
                ->limit(10)
                ->with('user:id,name,email')
                ->get()
                ->map(fn ($item) => [
                    'user' => $item->user,
                    'count' => $item->count,
                ]),
            'daily_trends' => (clone $baseQuery)
                ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
                ->groupByRaw('DATE(created_at)')
                ->orderBy('date')
                ->get()
                ->pluck('count', 'date'),
        ];

        return response()->json($stats);
    }

    /**
     * Delete all access logs. Allowed only when HIPAA access logging is disabled.
     * Violates HIPAA 6-year retention; audit log records the action.
     */
    public function deleteAll(Request $request): JsonResponse
    {
        if (config('logging.hipaa_access_logging_enabled', true)) {
            return response()->json([
                'message' => 'HIPAA access logging is enabled. Disable it in Log retention settings to delete all access logs.',
            ], 422);
        }

        $count = AccessLog::count();
        AccessLog::truncate();

        $this->auditService->log(
            'access_logs.delete_all',
            null,
            [],
            ['deleted_count' => $count],
            $request->user()?->id,
            $request,
            AuditLog::SEVERITY_WARNING
        );

        return response()->json([
            'message' => 'All access logs deleted.',
            'deleted_count' => $count,
        ]);
    }
}

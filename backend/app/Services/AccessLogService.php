<?php

namespace App\Services;

use App\Models\AccessLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class AccessLogService
{
    /**
     * Log access to a protected resource (PHI) for HIPAA compliance.
     *
     * @param  string  $action  view, create, update, delete, export
     * @param  string  $resourceType  User, Setting, etc.
     * @param  array<string>|null  $fieldsAccessed  Which fields were returned or modified (optional)
     */
    public function log(
        string $action,
        string $resourceType,
        ?int $resourceId = null,
        ?array $fieldsAccessed = null,
        ?Request $request = null
    ): void {
        if (! config('logging.hipaa_access_logging_enabled', true)) {
            return;
        }

        $request ??= request();
        $user = $request->user();

        if (! $user) {
            return;
        }

        try {
            AccessLog::create([
                'user_id' => $user->id,
                'action' => $action,
                'resource_type' => $resourceType,
                'resource_id' => $resourceId,
                'fields_accessed' => $fieldsAccessed,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'correlation_id' => app()->bound('correlation_id') ? app('correlation_id') : null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Access log write failed', [
                'action' => $action,
                'resource_type' => $resourceType,
                'error' => $e->getMessage(),
            ]);
        }
    }
}

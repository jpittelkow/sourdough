<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditService
{
    /**
     * Log an action to the audit log.
     */
    public function log(
        string $action,
        ?Model $auditable = null,
        array $oldValues = [],
        array $newValues = [],
        ?int $userId = null,
        ?Request $request = null
    ): AuditLog {
        $ipAddress = $request?->ip();
        $userAgent = $request?->userAgent();

        if (!$userId && auth()->check()) {
            $userId = auth()->id();
        }

        return AuditLog::create([
            'user_id' => $userId,
            'action' => $action,
            'auditable_type' => $auditable ? get_class($auditable) : null,
            'auditable_id' => $auditable?->id,
            'old_values' => !empty($oldValues) ? $oldValues : null,
            'new_values' => !empty($newValues) ? $newValues : null,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
        ]);
    }

    /**
     * Log a user action.
     */
    public function logUserAction(string $action, ?int $userId = null, ?Request $request = null): AuditLog
    {
        return $this->log($action, null, [], [], $userId, $request);
    }

    /**
     * Log a model change.
     */
    public function logModelChange(
        Model $model,
        string $action,
        array $oldValues = [],
        array $newValues = [],
        ?Request $request = null
    ): AuditLog {
        return $this->log($action, $model, $oldValues, $newValues, null, $request);
    }
}

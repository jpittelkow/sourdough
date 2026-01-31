<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Services\AuditService;
use App\Services\Search\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchAdminController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private SearchService $searchService,
        private AuditService $auditService
    ) {}

    /**
     * Get index statistics (document counts per index).
     */
    public function stats(): JsonResponse
    {
        $stats = $this->searchService->getIndexStats();

        return $this->dataResponse(['stats' => $stats]);
    }

    /**
     * Reindex search (single model or all).
     */
    public function reindex(Request $request): JsonResponse
    {
        $request->validate([
            'model' => ['nullable', 'string', 'in:pages,users,user_groups,notifications,email_templates,notification_templates,api_tokens,ai_providers,webhooks'],
        ]);

        $model = $request->input('model');
        $user = $request->user();

        if ($model !== null) {
            if ($model === 'pages') {
                $result = $this->searchService->syncPagesToIndex();
                if (! ($result['success'] ?? false)) {
                    return $this->errorResponse('Pages sync failed', 422);
                }
                $this->auditService->logUserAction('search.reindex', $user->id, null, 'info', [
                    'model' => 'pages',
                ]);

                return $this->successResponse("Pages index synced ({$result['count']} pages).", [
                    'model' => 'pages',
                    'count' => $result['count'],
                ]);
            }

            $result = $this->searchService->reindexModel($model);
            if (! $result['success']) {
                return $this->errorResponse($result['error'] ?? 'Reindex failed', 422);
            }
            $this->auditService->logUserAction('search.reindex', $user->id, null, 'info', [
                'model' => $model,
            ]);

            return $this->successResponse('Index reindexed successfully.', [
                'model' => $model,
                'output' => $result['output'] ?? null,
            ]);
        }

        $results = $this->searchService->reindexAll();
        $failed = array_filter($results, fn (array $r) => ! ($r['success'] ?? false));
        if ($failed !== []) {
            $messages = array_map(fn (array $r) => $r['error'] ?? 'Unknown error', $failed);
            return $this->errorResponse('Reindex failed: ' . implode('; ', $messages), 422);
        }

        $pagesResult = $this->searchService->syncPagesToIndex();
        if ($pagesResult['success']) {
            $results['pages'] = ['success' => true, 'output' => "Synced {$pagesResult['count']} pages"];
        }

        $this->auditService->logUserAction('search.reindex_all', $user->id, null, 'info', [
            'models' => array_keys($results),
        ]);

        return $this->successResponse('All indexes reindexed successfully.', [
            'models' => array_keys($results),
        ]);
    }
}

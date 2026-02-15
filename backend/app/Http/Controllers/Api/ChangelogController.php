<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponseTrait;
use App\Services\ChangelogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChangelogController extends Controller
{
    use ApiResponseTrait;

    public function __construct(
        private ChangelogService $changelogService
    ) {}

    /**
     * Get paginated changelog entries.
     */
    public function index(Request $request): JsonResponse
    {
        $page = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 10);

        // Clamp per_page to reasonable bounds
        $perPage = max(1, min($perPage, 50));

        $result = $this->changelogService->getEntries($page, $perPage);

        return $this->dataResponse($result);
    }
}

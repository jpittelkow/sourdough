<?php

namespace App\Http\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponseTrait
{
    protected function successResponse(string $message, array $data = [], int $status = 200): JsonResponse
    {
        return response()->json(array_merge(['message' => $message], $data), $status);
    }

    protected function createdResponse(string $message, array $data = []): JsonResponse
    {
        return $this->successResponse($message, $data, 201);
    }

    protected function errorResponse(string $message, int $status = 400): JsonResponse
    {
        return response()->json(['message' => $message], $status);
    }

    protected function dataResponse(mixed $data, int $status = 200): JsonResponse
    {
        return response()->json($data, $status);
    }
}

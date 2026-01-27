<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Webhook;
use App\Models\WebhookDelivery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class WebhookController extends Controller
{
    /**
     * Get all webhooks.
     */
    public function index(): JsonResponse
    {
        $webhooks = Webhook::orderBy('created_at', 'desc')->get();

        return response()->json([
            'webhooks' => $webhooks,
        ]);
    }

    /**
     * Create a new webhook.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'url' => ['required', 'url'],
            'secret' => ['sometimes', 'nullable', 'string'],
            'events' => ['required', 'array'],
            'events.*' => ['string'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $webhook = Webhook::create($validated);

        return response()->json([
            'message' => 'Webhook created successfully',
            'webhook' => $webhook,
        ], 201);
    }

    /**
     * Update a webhook.
     */
    public function update(Request $request, Webhook $webhook): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'url' => ['sometimes', 'url'],
            'secret' => ['sometimes', 'nullable', 'string'],
            'events' => ['sometimes', 'array'],
            'events.*' => ['string'],
            'active' => ['sometimes', 'boolean'],
        ]);

        $webhook->update($validated);

        return response()->json([
            'message' => 'Webhook updated successfully',
            'webhook' => $webhook->fresh(),
        ]);
    }

    /**
     * Delete a webhook.
     */
    public function destroy(Webhook $webhook): JsonResponse
    {
        $webhook->delete();

        return response()->json([
            'message' => 'Webhook deleted successfully',
        ]);
    }

    /**
     * Get webhook deliveries.
     */
    public function deliveries(Webhook $webhook, Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 20);

        $deliveries = $webhook->deliveries()
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return response()->json($deliveries);
    }

    /**
     * Test a webhook.
     */
    public function test(Webhook $webhook): JsonResponse
    {
        try {
            $payload = [
                'event' => 'webhook.test',
                'timestamp' => now()->toIso8601String(),
                'data' => [
                    'message' => 'This is a test webhook',
                ],
            ];

            $response = Http::timeout(10)->post($webhook->url, $payload);

            // Log the delivery
            $webhook->deliveries()->create([
                'event' => 'webhook.test',
                'payload' => $payload,
                'response_code' => $response->status(),
                'response_body' => $response->body(),
                'success' => $response->successful(),
            ]);

            $webhook->update(['last_triggered_at' => now()]);

            return response()->json([
                'message' => 'Webhook test completed',
                'success' => $response->successful(),
                'status_code' => $response->status(),
            ]);
        } catch (\Exception $e) {
            // Log failed delivery
            $webhook->deliveries()->create([
                'event' => 'webhook.test',
                'payload' => $payload ?? [],
                'response_code' => null,
                'response_body' => $e->getMessage(),
                'success' => false,
            ]);

            return response()->json([
                'message' => 'Webhook test failed: ' . $e->getMessage(),
                'success' => false,
            ], 500);
        }
    }
}

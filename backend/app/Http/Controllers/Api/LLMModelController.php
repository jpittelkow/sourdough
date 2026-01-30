<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LLMModelDiscoveryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LLMModelController extends Controller
{
    public function __construct(
        private LLMModelDiscoveryService $discovery
    ) {}

    /**
     * Validate API key (or Ollama host) for a provider.
     * POST /llm-settings/test-key
     */
    public function testKey(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', 'in:openai,claude,gemini,ollama'],
            'api_key' => ['required_unless:provider,ollama', 'nullable', 'string'],
            'host' => ['required_if:provider,ollama', 'nullable', 'string'],
        ]);

        $credentials = $this->credentialsFromRequest($validated);

        try {
            $valid = $this->discovery->validateCredentials($validated['provider'], $credentials);
            return response()->json([
                'valid' => $valid,
                'error' => $valid ? null : 'No models returned. Check your API key or host.',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'valid' => false,
                'error' => $this->sanitizeErrorMessage($e->getMessage()),
            ]);
        }
    }

    /**
     * Discover available models for a provider using the given credentials.
     * POST /llm-settings/discover-models
     */
    public function discover(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'provider' => ['required', 'string', 'in:openai,claude,gemini,ollama'],
            'api_key' => ['required_unless:provider,ollama', 'nullable', 'string'],
            'host' => ['required_if:provider,ollama', 'nullable', 'string'],
        ]);

        $credentials = $this->credentialsFromRequest($validated);

        try {
            $models = $this->discovery->discoverModels($validated['provider'], $credentials);
            return response()->json([
                'models' => $models,
                'provider' => $validated['provider'],
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'error' => 'Invalid request',
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Throwable $e) {
            return response()->json([
                'error' => 'Failed to fetch models',
                'message' => $this->sanitizeErrorMessage($e->getMessage()),
            ], 400);
        }
    }

    /**
     * @param array{provider: string, api_key?: string, host?: string} $validated
     * @return array{api_key?: string, host?: string}
     */
    private function credentialsFromRequest(array $validated): array
    {
        $credentials = [];
        if (isset($validated['api_key']) && $validated['api_key'] !== null && $validated['api_key'] !== '') {
            $credentials['api_key'] = $validated['api_key'];
        }
        if (isset($validated['host']) && $validated['host'] !== null && $validated['host'] !== '') {
            $credentials['host'] = $validated['host'];
        }
        if ($validated['provider'] === 'ollama' && empty($credentials['host'])) {
            $credentials['host'] = 'http://localhost:11434';
        }
        return $credentials;
    }

    private function sanitizeErrorMessage(string $message): string
    {
        if (str_contains($message, 'api.openai.com')) {
            return 'OpenAI API error. Check your API key.';
        }
        if (str_contains($message, 'api.anthropic.com')) {
            return 'Anthropic API error. Check your API key.';
        }
        if (str_contains($message, 'generativelanguage.googleapis.com')) {
            return 'Gemini API error. Check your API key.';
        }
        if (str_contains($message, 'Connection') || str_contains($message, 'timed out')) {
            return 'Connection failed. Check host (e.g. http://localhost:11434 for Ollama).';
        }
        return strlen($message) > 200 ? substr($message, 0, 197) . '...' : $message;
    }
}

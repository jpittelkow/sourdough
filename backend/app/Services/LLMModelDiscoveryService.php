<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class LLMModelDiscoveryService
{
    private const CACHE_TTL_SECONDS = 3600;

    /**
     * Discover available models for a provider using the given credentials.
     *
     * @return array<int, array{id: string, name: string, provider: string, capabilities?: array<string>}>
     */
    public function discoverModels(string $provider, array $credentials): array
    {
        $cacheKey = $this->cacheKey($provider, $credentials);
        return Cache::remember($cacheKey, self::CACHE_TTL_SECONDS, function () use ($provider, $credentials) {
            return $this->fetchModelsFromProvider($provider, $credentials);
        });
    }

    /**
     * Validate that the given credentials work for the provider (e.g. API key is valid).
     * Uses discovery; valid = at least one model returned.
     */
    public function validateCredentials(string $provider, array $credentials): bool
    {
        try {
            $models = $this->fetchModelsFromProvider($provider, $credentials);
            return count($models) > 0;
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Fetch models from provider API without cache.
     *
     * @return array<int, array{id: string, name: string, provider: string, capabilities?: array<string>}>
     */
    private function fetchModelsFromProvider(string $provider, array $credentials): array
    {
        return match ($provider) {
            'openai' => $this->discoverOpenAIModels($credentials['api_key'] ?? ''),
            'claude' => $this->discoverAnthropicModels($credentials['api_key'] ?? ''),
            'gemini' => $this->discoverGeminiModels($credentials['api_key'] ?? ''),
            'ollama' => $this->discoverOllamaModels($credentials['host'] ?? 'http://localhost:11434'),
            default => throw new \InvalidArgumentException("Unknown or unsupported provider: {$provider}"),
        };
    }

    private function cacheKey(string $provider, array $credentials): string
    {
        $key = $credentials['api_key'] ?? $credentials['host'] ?? '';
        $hash = strlen($key) > 8 ? md5($key) : $key;
        return "llm_models:{$provider}:{$hash}";
    }

    /**
     * @return array<int, array{id: string, name: string, provider: string, capabilities?: array<string>}>
     */
    private function discoverOpenAIModels(string $apiKey): array
    {
        $response = Http::timeout(15)
            ->withToken($apiKey)
            ->get('https://api.openai.com/v1/models');

        if (! $response->successful()) {
            $body = $response->json();
            $message = $body['error']['message'] ?? $response->body();
            throw new \RuntimeException('OpenAI API error: ' . $message);
        }

        $data = $response->json('data', []);
        $models = [];

        foreach ($data as $m) {
            $id = $m['id'] ?? '';
            if ($id === '' || ! str_starts_with($id, 'gpt-')) {
                continue;
            }
            $models[] = [
                'id' => $id,
                'name' => $this->formatOpenAIModelName($id),
                'provider' => 'openai',
                'capabilities' => $this->openAICapabilities($id),
            ];
        }

        usort($models, fn ($a, $b) => strcmp($b['id'], $a['id']));
        return array_values($models);
    }

    private function formatOpenAIModelName(string $id): string
    {
        $map = [
            'gpt-4o' => 'GPT-4o',
            'gpt-4o-mini' => 'GPT-4o Mini',
            'gpt-4-turbo' => 'GPT-4 Turbo',
            'gpt-4-turbo-preview' => 'GPT-4 Turbo Preview',
            'gpt-4' => 'GPT-4',
            'gpt-3.5-turbo' => 'GPT-3.5 Turbo',
        ];
        return $map[$id] ?? preg_replace('/^gpt-/', 'GPT-', ucfirst(str_replace(['-', '_'], ' ', $id)));
    }

    /**
     * @return array<string>
     */
    private function openAICapabilities(string $id): array
    {
        $capabilities = ['chat'];
        if (str_contains($id, 'vision') || str_contains($id, '4o')) {
            $capabilities[] = 'vision';
        }
        return $capabilities;
    }

    /**
     * @return array<int, array{id: string, name: string, provider: string, capabilities?: array<string>}>
     */
    private function discoverAnthropicModels(string $apiKey): array
    {
        $response = Http::timeout(15)
            ->withHeaders([
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
            ])
            ->get('https://api.anthropic.com/v1/models');

        if (! $response->successful()) {
            $body = $response->json();
            $message = $body['error']['message'] ?? $response->body();
            throw new \RuntimeException('Anthropic API error: ' . $message);
        }

        $data = $response->json('data') ?? $response->json('models') ?? $response->json();
        if (! is_array($data)) {
            $data = [];
        }

        $models = [];
        foreach ($data as $m) {
            $id = $m['id'] ?? $m['name'] ?? '';
            if ($id === '' || ! str_starts_with($id, 'claude-')) {
                continue;
            }
            $name = $m['display_name'] ?? $m['displayName'] ?? $this->formatAnthropicModelName($id);
            $models[] = [
                'id' => $id,
                'name' => $name,
                'provider' => 'claude',
                'capabilities' => ['chat', 'vision'],
            ];
        }

        usort($models, fn ($a, $b) => strcmp($b['id'], $a['id']));
        return array_values($models);
    }

    private function formatAnthropicModelName(string $id): string
    {
        return preg_replace('/^claude-/', 'Claude ', ucfirst(str_replace(['-', '_'], ' ', $id)));
    }

    /**
     * @return array<int, array{id: string, name: string, provider: string, capabilities?: array<string>}>
     */
    private function discoverGeminiModels(string $apiKey): array
    {
        $response = Http::timeout(15)
            ->get('https://generativelanguage.googleapis.com/v1beta/models', [
                'key' => $apiKey,
            ]);

        if (! $response->successful()) {
            $body = $response->json();
            $message = $body['error']['message'] ?? $response->body();
            throw new \RuntimeException('Gemini API error: ' . $message);
        }

        $items = $response->json('models', []);
        $models = [];

        foreach ($items as $m) {
            $nameWithPrefix = $m['name'] ?? '';
            if ($nameWithPrefix === '' || ! str_contains($nameWithPrefix, 'gemini')) {
                continue;
            }
            $id = str_starts_with($nameWithPrefix, 'models/') ? substr($nameWithPrefix, 7) : $nameWithPrefix;
            $displayName = $m['displayName'] ?? $this->formatGeminiModelName($id);
            $methods = $m['supportedGenerationMethods'] ?? [];
            $hasGenerate = in_array('generateContent', $methods, true);
            if (! $hasGenerate) {
                continue;
            }
            $models[] = [
                'id' => $id,
                'name' => $displayName,
                'provider' => 'gemini',
                'capabilities' => ['chat', 'vision'],
            ];
        }

        usort($models, fn ($a, $b) => strcmp($b['id'], $a['id']));
        return array_values($models);
    }

    private function formatGeminiModelName(string $id): string
    {
        return preg_replace('/^gemini-/', 'Gemini ', ucfirst(str_replace(['-', '_'], ' ', $id)));
    }

    /**
     * @return array<int, array{id: string, name: string, provider: string, capabilities?: array<string>}>
     */
    private function discoverOllamaModels(string $host): array
    {
        $baseUrl = rtrim($host, '/');
        if ($baseUrl === '') {
            $baseUrl = 'http://localhost:11434';
        }

        $response = Http::timeout(10)
            ->get("{$baseUrl}/api/tags");

        if (! $response->successful()) {
            throw new \RuntimeException('Ollama API error: ' . $response->body());
        }

        $items = $response->json('models', []);
        $models = [];

        foreach ($items as $m) {
            $name = $m['name'] ?? '';
            if ($name === '') {
                continue;
            }
            $models[] = [
                'id' => $name,
                'name' => $this->formatOllamaModelName($name),
                'provider' => 'ollama',
            ];
        }

        usort($models, fn ($a, $b) => strcmp($a['name'], $b['name']));
        return array_values($models);
    }

    private function formatOllamaModelName(string $name): string
    {
        if (str_contains($name, ':')) {
            $name = explode(':', $name)[0];
        }
        return ucfirst(str_replace(['-', '_'], ' ', $name));
    }
}

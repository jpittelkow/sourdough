# Recipe: Add LLM Provider

Step-by-step guide to add a new LLM (Large Language Model) provider.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/Services/LLM/Providers/{Name}Provider.php` | Create | Provider implementation |
| `backend/config/llm.php` | Modify | Register provider |
| `backend/.env.example` | Modify | Add environment variables |
| `frontend/app/(dashboard)/settings/llm/page.tsx` | Modify | Add configuration UI (if needed) |

## Step 1: Create the Provider Class

```php
<?php
// backend/app/Services/LLM/Providers/ExampleProvider.php

namespace App\Services\LLM\Providers;

use App\Services\LLM\Contracts\LLMProviderInterface;
use App\Services\LLM\DTOs\LLMRequest;
use App\Services\LLM\DTOs\LLMResponse;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExampleProvider implements LLMProviderInterface
{
    protected string $apiKey;
    protected string $baseUrl;
    protected string $model;

    public function __construct()
    {
        $this->apiKey = config('llm.providers.example.api_key');
        $this->baseUrl = config('llm.providers.example.base_url', 'https://api.example.com/v1');
        $this->model = config('llm.providers.example.model', 'example-model-v1');
    }

    /**
     * Send a request to the LLM provider.
     */
    public function complete(LLMRequest $request): LLMResponse
    {
        $startTime = microtime(true);

        try {
            $response = Http::timeout(120)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json',
                ])
                ->post("{$this->baseUrl}/chat/completions", [
                    'model' => $request->model ?? $this->model,
                    'messages' => $this->formatMessages($request),
                    'temperature' => $request->temperature ?? 0.7,
                    'max_tokens' => $request->maxTokens ?? 2048,
                    'stream' => false,
                ]);

            $elapsed = microtime(true) - $startTime;

            if (!$response->successful()) {
                Log::error('ExampleProvider: Request failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return new LLMResponse(
                    success: false,
                    content: null,
                    error: "API error: {$response->status()}",
                    provider: 'example',
                    model: $this->model,
                    latencyMs: (int)($elapsed * 1000),
                );
            }

            $data = $response->json();

            return new LLMResponse(
                success: true,
                content: $data['choices'][0]['message']['content'] ?? '',
                error: null,
                provider: 'example',
                model: $data['model'] ?? $this->model,
                latencyMs: (int)($elapsed * 1000),
                inputTokens: $data['usage']['prompt_tokens'] ?? null,
                outputTokens: $data['usage']['completion_tokens'] ?? null,
                totalTokens: $data['usage']['total_tokens'] ?? null,
            );

        } catch (\Exception $e) {
            $elapsed = microtime(true) - $startTime;

            Log::error('ExampleProvider: Exception', [
                'error' => $e->getMessage(),
            ]);

            return new LLMResponse(
                success: false,
                content: null,
                error: $e->getMessage(),
                provider: 'example',
                model: $this->model,
                latencyMs: (int)($elapsed * 1000),
            );
        }
    }

    /**
     * Check if the provider is available/configured.
     */
    public function isAvailable(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * Get the provider name.
     */
    public function getName(): string
    {
        return 'example';
    }

    /**
     * Get available models for this provider.
     */
    public function getModels(): array
    {
        return [
            'example-model-v1' => 'Example Model v1',
            'example-model-v2' => 'Example Model v2 (Advanced)',
        ];
    }

    /**
     * Format messages for the provider's API format.
     */
    protected function formatMessages(LLMRequest $request): array
    {
        $messages = [];

        // Add system message if provided
        if ($request->systemPrompt) {
            $messages[] = [
                'role' => 'system',
                'content' => $request->systemPrompt,
            ];
        }

        // Add conversation history
        foreach ($request->messages as $message) {
            $messages[] = [
                'role' => $message['role'],
                'content' => $message['content'],
            ];
        }

        // Add current prompt
        if ($request->prompt) {
            $messages[] = [
                'role' => 'user',
                'content' => $request->prompt,
            ];
        }

        return $messages;
    }
}
```

## Step 2: Create DTOs (if not existing)

```php
<?php
// backend/app/Services/LLM/DTOs/LLMRequest.php

namespace App\Services\LLM\DTOs;

class LLMRequest
{
    public function __construct(
        public ?string $prompt = null,
        public ?string $systemPrompt = null,
        public array $messages = [],
        public ?string $model = null,
        public float $temperature = 0.7,
        public int $maxTokens = 2048,
    ) {}
}
```

```php
<?php
// backend/app/Services/LLM/DTOs/LLMResponse.php

namespace App\Services\LLM\DTOs;

class LLMResponse
{
    public function __construct(
        public bool $success,
        public ?string $content,
        public ?string $error,
        public string $provider,
        public string $model,
        public int $latencyMs,
        public ?int $inputTokens = null,
        public ?int $outputTokens = null,
        public ?int $totalTokens = null,
    ) {}
}
```

## Step 3: Register in Configuration

```php
// backend/config/llm.php

return [
    // Default provider
    'default' => env('LLM_DEFAULT_PROVIDER', 'openai'),

    // Orchestration mode: single, failover, consensus, council
    'mode' => env('LLM_MODE', 'single'),

    'providers' => [
        'openai' => [
            'class' => \App\Services\LLM\Providers\OpenAIProvider::class,
            'api_key' => env('OPENAI_API_KEY'),
            'model' => env('OPENAI_MODEL', 'gpt-4'),
            'enabled' => env('LLM_OPENAI_ENABLED', true),
        ],

        'anthropic' => [
            'class' => \App\Services\LLM\Providers\AnthropicProvider::class,
            'api_key' => env('ANTHROPIC_API_KEY'),
            'model' => env('ANTHROPIC_MODEL', 'claude-3-sonnet'),
            'enabled' => env('LLM_ANTHROPIC_ENABLED', false),
        ],

        // Add the new provider
        'example' => [
            'class' => \App\Services\LLM\Providers\ExampleProvider::class,
            'api_key' => env('EXAMPLE_LLM_API_KEY'),
            'base_url' => env('EXAMPLE_LLM_BASE_URL', 'https://api.example.com/v1'),
            'model' => env('EXAMPLE_LLM_MODEL', 'example-model-v1'),
            'enabled' => env('LLM_EXAMPLE_ENABLED', false),
        ],
    ],

    // Fallback order for failover mode
    'failover_order' => ['openai', 'anthropic', 'example'],
];
```

## Step 4: Add Environment Variables

```env
# .env.example

# Example LLM Provider
LLM_EXAMPLE_ENABLED=false
EXAMPLE_LLM_API_KEY=
EXAMPLE_LLM_BASE_URL=https://api.example.com/v1
EXAMPLE_LLM_MODEL=example-model-v1
```

## Step 5: Add to Frontend Settings (if user-configurable)

```tsx
// frontend/app/(dashboard)/settings/llm/page.tsx
// Add to the provider list:

{/* Example Provider */}
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <CardTitle className="text-base">Example LLM</CardTitle>
          <CardDescription>Use Example's language models</CardDescription>
        </div>
      </div>
      <Switch
        checked={settings.example_enabled}
        onCheckedChange={(checked) =>
          setSettings({ ...settings, example_enabled: checked })
        }
      />
    </div>
  </CardHeader>
  {settings.example_enabled && (
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="example_api_key">API Key</Label>
        <Input
          id="example_api_key"
          type="password"
          value={settings.example_api_key}
          onChange={(e) =>
            setSettings({ ...settings, example_api_key: e.target.value })
          }
          placeholder="Enter your Example API key"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="example_model">Model</Label>
        <Select
          value={settings.example_model}
          onValueChange={(value) =>
            setSettings({ ...settings, example_model: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="example-model-v1">Example Model v1</SelectItem>
            <SelectItem value="example-model-v2">Example Model v2</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </CardContent>
  )}
</Card>
```

## Provider Interface Reference

```php
interface LLMProviderInterface
{
    /**
     * Send a completion request to the LLM.
     */
    public function complete(LLMRequest $request): LLMResponse;

    /**
     * Check if the provider is properly configured and available.
     */
    public function isAvailable(): bool;

    /**
     * Get the provider identifier name.
     */
    public function getName(): string;

    /**
     * Get available models for this provider.
     */
    public function getModels(): array;
}
```

## Checklist

- [ ] Provider class created implementing `LLMProviderInterface`
- [ ] `complete()` method handles API communication
- [ ] `isAvailable()` checks for required configuration
- [ ] `getModels()` returns available model options
- [ ] Error handling and logging implemented
- [ ] Provider registered in `config/llm.php`
- [ ] Environment variables added to `.env.example`
- [ ] Frontend settings UI added (if user-configurable)
- [ ] Token counting implemented (if API provides it)
- [ ] Latency tracking implemented
- [ ] ADR reference: `docs/adr/006-llm-orchestration-modes.md`

## Existing Providers for Reference

Look at these files for patterns:
- `backend/app/Services/LLM/Providers/OpenAIProvider.php`
- `backend/app/Services/LLM/Providers/AnthropicProvider.php`
- `backend/app/Services/LLM/Providers/OllamaProvider.php`

## Orchestrator Integration Notes

The `LLMOrchestrator` automatically discovers enabled providers from config. Provider-specific logic is handled by the orchestrator based on the selected mode:

- **single**: Uses the default provider only
- **failover**: Tries providers in order until one succeeds
- **consensus**: Sends to multiple providers, returns majority answer
- **council**: All providers "vote" on the response

No orchestrator changes needed unless you need custom behavior for this provider.

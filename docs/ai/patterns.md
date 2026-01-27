# Code Patterns

Follow these patterns for consistency across the codebase.

## Backend Patterns

### Controller Pattern

```php
<?php
// backend/app/Http/Controllers/Api/ExampleController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExampleRequest;
use App\Http\Requests\UpdateExampleRequest;
use App\Http\Resources\ExampleResource;
use App\Models\Example;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ExampleController extends Controller
{
    /**
     * List all examples for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $examples = Example::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json([
            'data' => ExampleResource::collection($examples),
            'meta' => [
                'current_page' => $examples->currentPage(),
                'last_page' => $examples->lastPage(),
                'total' => $examples->total(),
            ],
        ]);
    }

    /**
     * Store a new example.
     */
    public function store(StoreExampleRequest $request): JsonResponse
    {
        $example = Example::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return response()->json([
            'data' => new ExampleResource($example),
            'message' => 'Example created successfully.',
        ], 201);
    }

    /**
     * Show a single example.
     */
    public function show(Request $request, Example $example): JsonResponse
    {
        // Policy check (if using policies)
        $this->authorize('view', $example);

        return response()->json([
            'data' => new ExampleResource($example),
        ]);
    }

    /**
     * Update an example.
     */
    public function update(UpdateExampleRequest $request, Example $example): JsonResponse
    {
        $this->authorize('update', $example);

        $example->update($request->validated());

        return response()->json([
            'data' => new ExampleResource($example),
            'message' => 'Example updated successfully.',
        ]);
    }

    /**
     * Delete an example.
     */
    public function destroy(Request $request, Example $example): JsonResponse
    {
        $this->authorize('delete', $example);

        $example->delete();

        return response()->json([
            'message' => 'Example deleted successfully.',
        ]);
    }
}
```

### Form Request Pattern

```php
<?php
// backend/app/Http/Requests/StoreExampleRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreExampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth handled by route middleware
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => ['required', 'in:typeA,typeB,typeC'],
            'settings' => ['nullable', 'array'],
            'settings.key' => ['required_with:settings', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Please provide a name.',
            'type.in' => 'Invalid type selected.',
        ];
    }
}
```

### Resource Pattern

```php
<?php
// backend/app/Http/Resources/ExampleResource.php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExampleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'type' => $this->type,
            'settings' => $this->settings,
            'created_at' => $this->created_at->toISOString(),
            'updated_at' => $this->updated_at->toISOString(),
        ];
    }
}
```

### Service Pattern

```php
<?php
// backend/app/Services/Example/ExampleService.php

namespace App\Services\Example;

use App\Models\Example;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class ExampleService
{
    /**
     * Process an example with business logic.
     */
    public function process(Example $example, array $options = []): ProcessResult
    {
        try {
            // Business logic here
            $result = $this->doSomething($example, $options);

            Log::info('Example processed', [
                'example_id' => $example->id,
                'result' => $result,
            ]);

            return new ProcessResult(success: true, data: $result);
        } catch (\Exception $e) {
            Log::error('Example processing failed', [
                'example_id' => $example->id,
                'error' => $e->getMessage(),
            ]);

            return new ProcessResult(success: false, error: $e->getMessage());
        }
    }

    private function doSomething(Example $example, array $options): array
    {
        // Implementation
        return [];
    }
}
```

### Channel/Provider Pattern (for pluggable implementations)

```php
<?php
// backend/app/Services/Notifications/Channels/ExampleChannel.php

namespace App\Services\Notifications\Channels;

use App\Models\Notification;
use App\Services\Notifications\Contracts\NotificationChannelInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExampleChannel implements NotificationChannelInterface
{
    public function send(Notification $notification, array $config): bool
    {
        if (!$this->validateConfig($config)) {
            Log::warning('ExampleChannel: Invalid config', ['config' => $config]);
            return false;
        }

        try {
            $response = Http::post($config['webhook_url'], [
                'title' => $notification->title,
                'message' => $notification->message,
                'type' => $notification->type,
            ]);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('ExampleChannel: Send failed', [
                'notification_id' => $notification->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    public function validateConfig(array $config): bool
    {
        return isset($config['webhook_url']) && filter_var($config['webhook_url'], FILTER_VALIDATE_URL);
    }

    public function getRequiredConfig(): array
    {
        return [
            'webhook_url' => [
                'type' => 'url',
                'label' => 'Webhook URL',
                'required' => true,
            ],
        ];
    }
}
```

### Route Definition Pattern

```php
// backend/routes/api.php

use App\Http\Controllers\Api\ExampleController;

// Public routes (no auth)
Route::post('/auth/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Resource routes (CRUD)
    Route::apiResource('examples', ExampleController::class);

    // Custom routes
    Route::post('/examples/{example}/process', [ExampleController::class, 'process']);

    // Settings routes
    Route::prefix('settings')->group(function () {
        Route::get('/example', [SettingController::class, 'getExample']);
        Route::put('/example', [SettingController::class, 'updateExample']);
    });
});

// Admin-only routes
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'users']);
});
```

## Frontend Patterns

### Page Component Pattern

```tsx
// frontend/app/(dashboard)/example/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Example {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export default function ExamplePage() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExamples();
  }, []);

  const fetchExamples = async () => {
    try {
      setLoading(true);
      const response = await api.get('/examples');
      setExamples(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load examples');
      toast.error('Failed to load examples');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={fetchExamples}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Examples</h1>
          <p className="text-muted-foreground">Manage your examples here.</p>
        </div>
        <Button>Create Example</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {examples.map((example) => (
          <Card key={example.id}>
            <CardHeader>
              <CardTitle>{example.name}</CardTitle>
              <CardDescription>{example.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(example.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {examples.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No examples yet.</p>
            <Button>Create your first example</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

### Settings Page Pattern

```tsx
// frontend/app/(dashboard)/settings/example/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ExampleSettings {
  enabled: boolean;
  api_key: string;
  webhook_url: string;
}

const defaultSettings: ExampleSettings = {
  enabled: false,
  api_key: '',
  webhook_url: '',
};

export default function ExampleSettingsPage() {
  const [settings, setSettings] = useState<ExampleSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/example');
      setSettings({ ...defaultSettings, ...response.data });
    } catch (err) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/example', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Example Settings</h1>
        <p className="text-muted-foreground">Configure example integration.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Set up your example integration.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Integration</Label>
              <p className="text-sm text-muted-foreground">
                Turn on example integration features.
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={settings.api_key}
              onChange={(e) =>
                setSettings({ ...settings, api_key: e.target.value })
              }
              placeholder="Enter your API key"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              type="url"
              value={settings.webhook_url}
              onChange={(e) =>
                setSettings({ ...settings, webhook_url: e.target.value })
              }
              placeholder="https://example.com/webhook"
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### API Utility Pattern

```typescript
// frontend/lib/api.ts
const API_BASE = '/api';

class ApiClient {
  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include', // Include cookies for Sanctum
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }
}

export const api = new ApiClient();
```

### Form with Validation Pattern

```tsx
// Using react-hook-form + zod
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address'),
  type: z.enum(['typeA', 'typeB', 'typeC']),
});

type FormData = z.infer<typeof formSchema>;

export function ExampleForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      type: 'typeA',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* More fields... */}
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
```

### Reusable Component Pattern

Components with multiple variants, sizes, and fallback behavior:

```tsx
// frontend/components/example-component.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// 1. Define typed props interface with JSDoc comments
export interface ExampleComponentProps {
  /** Display variant */
  variant?: 'full' | 'compact' | 'minimal';
  /** Size preset */
  size?: 'sm' | 'md' | 'lg';
  /** Image source (optional - falls back to text) */
  src?: string | null;
  /** Display text */
  label: string;
  /** Additional CSS classes */
  className?: string;
}

// 2. Define size configuration object for consistency
const sizeConfig = {
  sm: {
    container: 'h-6 w-6',
    text: 'text-sm',
    gap: 'gap-1.5',
  },
  md: {
    container: 'h-8 w-8',
    text: 'text-base',
    gap: 'gap-2',
  },
  lg: {
    container: 'h-10 w-10',
    text: 'text-lg',
    gap: 'gap-2.5',
  },
};

// 3. Export the component with sensible defaults
export function ExampleComponent({
  variant = 'full',
  size = 'md',
  src,
  label,
  className,
}: ExampleComponentProps) {
  // 4. Track image load errors for fallback behavior
  const [imageError, setImageError] = useState(false);
  const sizes = sizeConfig[size];
  const hasImage = src && !imageError;

  // 5. Handle different variants
  if (variant === 'minimal') {
    return (
      <span className={cn('font-medium', sizes.text, className)}>
        {label}
      </span>
    );
  }

  // 6. Use cn() to merge conditional classes
  return (
    <div className={cn('flex items-center', sizes.gap, className)}>
      {hasImage ? (
        <div className={cn(sizes.container, 'relative')}>
          <Image
            src={src}
            alt={label}
            fill
            className="object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        // 7. Provide styled fallback when no image
        <div
          className={cn(
            sizes.container,
            'flex items-center justify-center rounded-md',
            'bg-primary text-primary-foreground font-bold'
          )}
        >
          {label.slice(0, 2).toUpperCase()}
        </div>
      )}
      {variant === 'full' && (
        <span className={cn('font-medium', sizes.text)}>{label}</span>
      )}
    </div>
  );
}
```

**Key principles:**
- TypeScript interface with JSDoc for props
- Size configuration object for consistent sizing
- `cn()` utility for conditional class merging
- Image `onError` handler for graceful fallbacks
- Sensible defaults for optional props

**Real example:** See `frontend/components/logo.tsx`

## Error Handling Patterns

### Backend Error Response Format

```php
// Consistent error response structure
return response()->json([
    'message' => 'Human-readable error message.',
    'errors' => [
        'field_name' => ['Specific field error.'],
    ],
], 422);

// Common error responses
return response()->json(['message' => 'Unauthenticated.'], 401);
return response()->json(['message' => 'Forbidden.'], 403);
return response()->json(['message' => 'Not found.'], 404);
return response()->json(['message' => 'Server error.'], 500);

// Using Laravel's abort helper
abort(404, 'Example not found.');
abort(403, 'You do not have permission to access this resource.');
```

### Backend Exception Handling in Services

```php
<?php
// backend/app/Services/Example/ExampleService.php

use Illuminate\Support\Facades\Log;

class ExampleService
{
    public function process(Example $example, array $options = []): ProcessResult
    {
        try {
            $result = $this->doProcessing($example, $options);

            return new ProcessResult(success: true, data: $result);
        } catch (ValidationException $e) {
            // Re-throw validation exceptions (let Laravel handle)
            throw $e;
        } catch (ExternalApiException $e) {
            // Log external failures, return graceful error
            Log::warning('External API failed', [
                'example_id' => $example->id,
                'error' => $e->getMessage(),
            ]);

            return new ProcessResult(
                success: false,
                error: 'External service temporarily unavailable.'
            );
        } catch (\Exception $e) {
            // Log unexpected errors
            Log::error('Unexpected error in ExampleService', [
                'example_id' => $example->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return new ProcessResult(
                success: false,
                error: 'An unexpected error occurred.'
            );
        }
    }
}
```

### Frontend Error Handling Pattern

```tsx
// Handling API errors with proper user feedback
const handleSubmit = async (data: FormData) => {
  try {
    setSubmitting(true);
    setError(null);

    await api.post('/examples', data);
    toast.success('Example created successfully');
    router.push('/examples');
  } catch (err: any) {
    // Handle validation errors (422)
    if (err.response?.status === 422 && err.response?.data?.errors) {
      const errors = err.response.data.errors;
      Object.entries(errors).forEach(([field, messages]) => {
        form.setError(field as any, {
          message: (messages as string[])[0],
        });
      });
      toast.error('Please fix the validation errors');
    }
    // Handle authentication errors (401)
    else if (err.response?.status === 401) {
      toast.error('Session expired. Please log in again.');
      router.push('/login');
    }
    // Handle forbidden errors (403)
    else if (err.response?.status === 403) {
      toast.error('You do not have permission to perform this action');
    }
    // Handle not found errors (404)
    else if (err.response?.status === 404) {
      toast.error('The requested resource was not found');
    }
    // Handle all other errors
    else {
      const message = err.response?.data?.message || 'Something went wrong';
      toast.error(message);
      setError(message);
    }
  } finally {
    setSubmitting(false);
  }
};
```

### Frontend Error Boundary Pattern

```tsx
// frontend/components/error-boundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="max-w-md mx-auto mt-8">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              An unexpected error occurred. Please try again.
            </p>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

### API Response Status Codes

| Code | Meaning | When to Use |
|------|---------|-------------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST that creates a resource |
| 204 | No Content | Successful DELETE with no response body |
| 400 | Bad Request | Malformed request (invalid JSON, etc.) |
| 401 | Unauthorized | Not authenticated (missing/invalid session) |
| 403 | Forbidden | Authenticated but not allowed |
| 404 | Not Found | Resource doesn't exist or user doesn't own it |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected backend error |

## Naming Conventions Summary

| Type | Pattern | Example |
|------|---------|---------|
| Controller | `{Feature}Controller.php` | `ExampleController.php` |
| Service | `{Feature}Service.php` | `ExampleService.php` |
| Model | `{Singular}.php` | `Example.php` |
| FormRequest | `{Action}{Model}Request.php` | `StoreExampleRequest.php` |
| Resource | `{Model}Resource.php` | `ExampleResource.php` |
| Channel | `{Provider}Channel.php` | `TelegramChannel.php` |
| Provider | `{Provider}Provider.php` | `OpenAIProvider.php` |
| Frontend page | `page.tsx` in route folder | `app/(dashboard)/example/page.tsx` |
| Frontend component | `kebab-case.tsx` | `example-card.tsx` |
| Migration | `{timestamp}_create_{table}_table.php` | `2024_01_01_000000_create_examples_table.php` |

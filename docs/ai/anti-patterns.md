# Anti-Patterns

What NOT to do when developing on Sourdough.

## Backend Anti-Patterns

### Don't: Put Business Logic in Controllers

```php
// BAD - logic in controller
public function store(Request $request): JsonResponse
{
    $data = $request->all();
    // 50 lines of business logic, API calls, calculations...
    $result = $this->processComplexLogic($data);
    return response()->json(['data' => $result], 201);
}

// GOOD - delegate to service
public function store(StoreExampleRequest $request): JsonResponse
{
    $result = $this->exampleService->create(
        $request->validated(),
        $request->user()
    );

    return response()->json([
        'data' => new ExampleResource($result),
        'message' => 'Example created successfully.',
    ], 201);
}
```

### Don't: Forget User Scoping

```php
// BAD - returns ALL records (security issue!)
$examples = Example::all();
$examples = Example::where('type', 'active')->get();

// GOOD - scoped to authenticated user
$examples = Example::where('user_id', $request->user()->id)->get();
$examples = Example::where('user_id', $request->user()->id)
    ->where('type', 'active')
    ->get();
```

### Don't: Skip Form Request Validation

```php
// BAD - manual validation in controller
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'name' => 'required|string|max:255',
    ]);
    // ...
}

// GOOD - dedicated FormRequest class
public function store(StoreExampleRequest $request): JsonResponse
{
    // $request->validated() is already clean and validated
    $example = Example::create([
        ...$request->validated(),
        'user_id' => $request->user()->id,
    ]);
    // ...
}
```

### Don't: Return Inconsistent Response Formats

```php
// BAD - inconsistent formats
return response()->json($example);                    // Just the model
return response()->json(['example' => $example]);    // Different key
return response()->json(['success' => true, 'item' => $example]);

// GOOD - consistent format
return response()->json([
    'data' => new ExampleResource($example),
    'message' => 'Example created successfully.',
], 201);
```

### Don't: Forget to Add Indexes on Foreign Keys

```php
// BAD - foreign key without index (slow queries)
Schema::create('examples', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('user_id');
    $table->timestamps();
});

// GOOD - constrained foreign key with index
Schema::create('examples', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    $table->timestamps();

    $table->index('user_id');
});
```

### Don't: Create Providers/Channels Without Implementing Interface

```php
// BAD - provider without interface (won't work with orchestrator)
class NewLLMProvider
{
    public function ask(string $question): string { /* ... */ }
}

// GOOD - implements the interface
class NewLLMProvider implements LLMProviderInterface
{
    public function query(string $prompt, array $options = []): array { /* ... */ }
    public function isConfigured(): bool { /* ... */ }
    public function getIdentifier(): string { /* ... */ }
    // ... all interface methods
}
```

## Frontend Anti-Patterns

### Don't: Fetch Without Error Handling

```tsx
// BAD - no error handling
useEffect(() => {
  const fetchData = async () => {
    const response = await api.get('/examples');
    setExamples(response.data);
  };
  fetchData();
}, []);

// GOOD - proper error handling and loading state
useEffect(() => {
  const fetchData = async () => {
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
  fetchData();
}, []);
```

### Don't: Forget Loading States

```tsx
// BAD - no loading indicator (confusing UX)
return <div>{examples.map(e => <Card key={e.id}>{e.name}</Card>)}</div>;

// GOOD - show loading state
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

return <div>{examples.map(e => <Card key={e.id}>{e.name}</Card>)}</div>;
```

### Don't: Hardcode API URLs

```tsx
// BAD - hardcoded URL (breaks in different environments)
const response = await fetch('http://localhost:8080/api/examples');
const response = await fetch('https://myapp.com/api/examples');

// GOOD - use relative path (Nginx proxies to backend)
const response = await api.get('/examples');
// or
const response = await fetch('/api/examples', {
  credentials: 'include',
});
```

### Don't: Forget `credentials: 'include'` for Auth

```tsx
// BAD - auth cookies not sent (401 errors)
const response = await fetch('/api/examples');

// GOOD - include cookies for Sanctum session auth
const response = await fetch('/api/examples', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// BEST - use the api utility which handles this
import { api } from '@/lib/api';
const response = await api.get('/examples');
```

### Don't: Add shadcn/ui Components via npm

```bash
# BAD - shadcn components are not npm packages
npm install @shadcn/button

# GOOD - use the shadcn CLI (run from frontend/)
cd frontend
npx shadcn@latest add button

# Replace existing component
npx shadcn@latest add dialog --overwrite

# Config is in frontend/components.json; components live in frontend/components/ui/
```

### Don't: Create Components Without TypeScript Interfaces

```tsx
// BAD - no type safety
function ExampleCard({ title, description, onClick }) {
  return <Card>...</Card>;
}

// GOOD - typed props
interface ExampleCardProps {
  title: string;
  description?: string;
  onClick?: () => void;
}

function ExampleCard({ title, description, onClick }: ExampleCardProps) {
  return <Card>...</Card>;
}
```

## Database Anti-Patterns

### Don't: Use Raw SQL for Simple Queries

```php
// BAD - raw SQL (harder to maintain, potential SQL injection)
$examples = DB::select('SELECT * FROM examples WHERE user_id = ?', [$userId]);

// GOOD - Eloquent ORM
$examples = Example::where('user_id', $userId)->get();
```

### Don't: N+1 Query Problems

```php
// BAD - N+1 queries (1 query + N queries for relations)
$examples = Example::where('user_id', $userId)->get();
foreach ($examples as $example) {
    echo $example->user->name; // Query per iteration!
}

// GOOD - eager loading
$examples = Example::where('user_id', $userId)
    ->with('user')
    ->get();
```

### Don't: Assume SQLite Features Work Everywhere

```php
// BAD - SQLite-specific syntax
DB::statement('PRAGMA foreign_keys = ON');

// GOOD - database-agnostic approach
// Use Laravel's schema builder and query builder
// Test with MySQL/PostgreSQL if targeting production
```

## Architecture Anti-Patterns

### Don't: Add Admin Routes Without Middleware

```php
// BAD - admin route without protection
Route::get('/admin/users', [AdminController::class, 'users']);
Route::get('/users/all', [AdminController::class, 'index']);

// GOOD - protected with auth AND admin middleware
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'users']);
});
```

### Don't: Store Secrets in Code

```php
// BAD - secrets in code
$apiKey = 'sk-1234567890abcdef';
Http::withHeaders(['Authorization' => 'Bearer sk-1234567890abcdef']);

// GOOD - use environment variables
$apiKey = config('services.example.api_key');
// In .env: EXAMPLE_API_KEY=sk-1234567890abcdef
// In config/services.php: 'example' => ['api_key' => env('EXAMPLE_API_KEY')]
```

### Don't: Mix User Settings with System Settings

```php
// BAD - using wrong model
$systemSetting = Setting::where('key', 'app_name')->first(); // User-scoped!

// GOOD - use the correct model
$systemSetting = SystemSetting::where('key', 'app_name')->first();

// User settings (has user_id)
$userSetting = Setting::where('user_id', $userId)
    ->where('key', 'theme')
    ->first();
```

## Testing Anti-Patterns

### Don't: Test Without Authentication

```php
// BAD - test will fail (401)
it('lists examples', function () {
    $this->getJson('/api/examples')
        ->assertOk();
});

// GOOD - authenticate the request
it('lists examples', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->getJson('/api/examples')
        ->assertOk();
});
```

### Don't: Skip Testing User Isolation

```php
// BAD - only tests happy path
it('returns examples', function () {
    $user = User::factory()->create();
    Example::factory()->count(3)->create(['user_id' => $user->id]);

    $this->actingAs($user)
        ->getJson('/api/examples')
        ->assertOk()
        ->assertJsonCount(3, 'data');
});

// GOOD - also test user can't see other users' data
it('only returns current user examples', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Example::factory()->count(3)->create(['user_id' => $user->id]);
    Example::factory()->count(5)->create(['user_id' => $otherUser->id]);

    $this->actingAs($user)
        ->getJson('/api/examples')
        ->assertOk()
        ->assertJsonCount(3, 'data'); // Not 8!
});
```

## Summary Checklist

Before submitting code, verify:

- [ ] Business logic is in Services, not Controllers
- [ ] All queries are user-scoped where appropriate
- [ ] FormRequest classes used for validation
- [ ] Response format is consistent (`data`, `message`, `meta`)
- [ ] Foreign keys have indexes
- [ ] Frontend has loading and error states
- [ ] Using `api` utility, not raw fetch
- [ ] No hardcoded URLs or secrets
- [ ] Admin routes have proper middleware
- [ ] Tests verify user isolation

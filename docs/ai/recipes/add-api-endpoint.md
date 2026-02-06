# Recipe: Add API Endpoint

Step-by-step guide to add a new REST API endpoint.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `backend/routes/api.php` | Modify | Add route definition |
| `backend/app/Http/Controllers/Api/{Name}Controller.php` | Create | Handle requests |
| `backend/app/Http/Requests/{Name}Request.php` | Create | Validate input (if POST/PUT) |
| `backend/app/Http/Resources/{Name}Resource.php` | Create | Format response (optional) |
| `backend/app/Models/{Name}.php` | Create | Data model (if new entity) |
| `backend/database/migrations/` | Create | Database table (if new entity) |

## Step 1: Define the Route

```php
// backend/routes/api.php

use App\Http\Controllers\Api\ExampleController;

Route::middleware('auth:sanctum')->group(function () {
    // Option A: Full resource routes (index, store, show, update, destroy)
    Route::apiResource('examples', ExampleController::class);

    // Option B: Individual routes
    Route::get('/examples', [ExampleController::class, 'index']);
    Route::post('/examples', [ExampleController::class, 'store']);
    Route::get('/examples/{example}', [ExampleController::class, 'show']);
    Route::put('/examples/{example}', [ExampleController::class, 'update']);
    Route::delete('/examples/{example}', [ExampleController::class, 'destroy']);

    // Option C: Custom action
    Route::post('/examples/{example}/process', [ExampleController::class, 'process']);
});
```

## Step 2: Create the Controller

Use `ApiResponseTrait` for consistent responses and `config('app.pagination.default')` for pagination. Use `$this->authorize()` for ownership checks (requires a Policy).

```php
<?php
// backend/app/Http/Controllers/Api/ExampleController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreExampleRequest;
use App\Http\Requests\UpdateExampleRequest;
use App\Http\Resources\ExampleResource;
use App\Http\Traits\ApiResponseTrait;
use App\Models\Example;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExampleController extends Controller
{
    use ApiResponseTrait;

    /**
     * List all examples for authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $examples = Example::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', config('app.pagination.default')));

        return $this->dataResponse([
            'data' => ExampleResource::collection($examples),
            'meta' => [
                'current_page' => $examples->currentPage(),
                'last_page' => $examples->lastPage(),
                'total' => $examples->total(),
            ],
        ]);
    }

    /**
     * Create a new example.
     */
    public function store(StoreExampleRequest $request): JsonResponse
    {
        $example = Example::create([
            ...$request->validated(),
            'user_id' => $request->user()->id,
        ]);

        return $this->createdResponse('Example created successfully.', [
            'data' => new ExampleResource($example),
        ]);
    }

    /**
     * Get a single example.
     */
    public function show(Request $request, Example $example): JsonResponse
    {
        $this->authorize('view', $example);

        return $this->dataResponse([
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

        return $this->successResponse('Example updated successfully.', [
            'data' => new ExampleResource($example),
        ]);
    }

    /**
     * Delete an example.
     */
    public function destroy(Request $request, Example $example): JsonResponse
    {
        $this->authorize('delete', $example);

        $example->delete();

        return $this->deleteResponse('Example deleted successfully.');
    }
}
```

## Step 3: Create Form Request (for validation)

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
            'config' => ['nullable', 'array'],
        ];
    }
}
```

```php
<?php
// backend/app/Http/Requests/UpdateExampleRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExampleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => ['sometimes', 'in:typeA,typeB,typeC'],
            'config' => ['nullable', 'array'],
        ];
    }
}
```

## Step 4: Create Model and Migration (if new entity)

```php
<?php
// backend/app/Models/Example.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Example extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'type',
        'config',
    ];

    protected $casts = [
        'config' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
```

```php
<?php
// backend/database/migrations/2024_01_01_000000_create_examples_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('examples', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type');
            $table->json('config')->nullable();
            $table->timestamps();

            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('examples');
    }
};
```

## Step 5: Run Migration

```bash
# Inside Docker container
docker-compose exec app php /var/www/html/backend/artisan migrate
```

## Step 6: Verify Routes

```bash
# List routes to confirm
docker-compose exec app php /var/www/html/backend/artisan route:list --path=examples
```

## Checklist

- [ ] Route added to `backend/routes/api.php`
- [ ] Controller created with proper namespace
- [ ] FormRequest(s) created for validation
- [ ] Model created (if new entity)
- [ ] Migration created and run (if new entity)
- [ ] User scoping applied (`user_id` checks)
- [ ] Auth middleware applied (`auth:sanctum`)
- [ ] Routes verified with `route:list`
- [ ] Tested with API client (Postman, curl, etc.)

For admin endpoints that modify or delete users (e.g. delete user, toggle admin, disable user), use `AdminAuthorizationTrait` to prevent removing the last admin. See [Add admin-protected action](add-admin-protected-action.md).

## Common Variations

### Admin-Only Endpoint

```php
// backend/routes/api.php
Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/examples', [AdminExampleController::class, 'index']);
});
```

### Public Endpoint (No Auth)

```php
// backend/routes/api.php
Route::get('/public/examples', [PublicExampleController::class, 'index']);
```

### Nested Resource

```php
// backend/routes/api.php
Route::apiResource('projects.examples', ProjectExampleController::class);
// Creates: /projects/{project}/examples, /projects/{project}/examples/{example}
```

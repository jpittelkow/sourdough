# Recipe: Add Searchable Model

Step-by-step guide to add a new model to full-text search (Meilisearch/Scout) so it appears in global search (Cmd+K), suggestions, and admin index stats.

## Architecture Overview

Search uses **Laravel Scout** with the Meilisearch driver. Searchable models implement the `Searchable` trait and define `toSearchableArray()` and `searchableAs()`. The **SearchService** centralizes search logic, result transformation, and index stats. The **SearchReindexCommand** and **SearchAdminController** reindex from CLI or admin UI.

```
Model (Searchable) → Scout/Meilisearch
SearchService → globalSearch(), getSuggestions(), getIndexStats()
SearchController → GET /search, GET /search/suggestions
SearchAdminController → GET /admin/search/stats, POST /admin/search/reindex
```

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/Models/{Model}.php` | Modify | Add Searchable trait, toSearchableArray(), searchableAs() |
| `backend/app/Console/Commands/SearchReindexCommand.php` | Modify | Add model to `$searchableModels` |
| `backend/app/Services/Search/SearchService.php` | Modify | Add type handling in globalSearch(), transform method (with XSS-safe escaping), getIndexStats() |
| `backend/config/scout.php` | Modify | Optional: Meilisearch index settings (filterable/sortable) |
| `backend/routes/api.php` | Modify | If the new type returns user/PHI data: add `log.access:User` (or appropriate) to search/suggestions routes (see [Logging Compliance](../../../.cursor/rules/logging-compliance.mdc)) |
| `frontend/components/search/search-result-icon.tsx` | Modify | Add icon for new result type |
| `frontend/app/(dashboard)/configuration/search/page.tsx` | Modify | No change if stats are driven by SearchService (auto) |

## Step 1: Add Searchable Trait to Model

In your Eloquent model, use the Scout `Searchable` trait and implement the required methods.

```php
<?php
// backend/app/Models/Example.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Laravel\Scout\Searchable;

class Example extends Model
{
    use Searchable;

    /**
     * Get the indexable data array for the model (Scout/Meilisearch).
     */
    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'created_at' => $this->created_at?->timestamp,
        ];
    }

    /**
     * Get the name of the index associated with the model.
     */
    public function searchableAs(): string
    {
        return 'examples';
    }
}
```

- **Index name**: Use a plural, lowercase name (e.g. `examples`, `users`). It becomes the Meilisearch index name (with optional `SCOUT_PREFIX`).
- **toSearchableArray()**: Include only fields that should be searchable and returned in results. Avoid sensitive data.

## Step 2: Add to SearchReindexCommand

Register the model in the reindex command so `php artisan search:reindex` and `php artisan search:reindex examples` work.

```php
// backend/app/Console/Commands/SearchReindexCommand.php

protected static array $searchableModels = [
    'users' => User::class,
    'examples' => Example::class,  // add this
];
```

Use the same key as `searchableAs()` (without prefix): e.g. `examples` for index name `examples`.

## Scoping (user-scoped vs admin-only)

- **User-scoped models** (e.g. Notification, ApiToken, AIProvider): Include `user_id` in `toSearchableArray()`. In the search method, when `$scopeUserId !== null` (non-admin), call `$builder->where('user_id', $scopeUserId)`. In `globalSearch()`, pass `$scopeUserId` to the search method so non-admins only see their own records.
- **Admin-only models** (e.g. EmailTemplate, Webhook): In `globalSearch()`, when `$scopeUserId !== null` (non-admin), set `$total = 0` and `$allResults = []` for that type so non-admins get no results. Do not pass `$scopeUserId` to the search method.

## Step 3: Add to SearchService

Update **SearchService** in three places: model map, globalSearch type handling, and result transformation.

**3a. Add to `$searchableModels`:**

```php
// backend/app/Services/Search/SearchService.php

protected static array $searchableModels = [
    'users' => User::class,
    'examples' => Example::class,
];
```

**3b. Add type branch in `globalSearch()`:**

In the `foreach ($types as $modelType)` loop, add a branch for the new type (e.g. `examples`). Call a dedicated search method (e.g. `searchExamples()`) and transform each result with a method like `transformExampleToResult()`.

**3c. Add transform method and URL:**

Create a method that returns the unified result shape. **Escape all user-provided text** (title, subtitle) with `htmlspecialchars()` before returning, so the API response is safe to render with `dangerouslySetInnerHTML` for highlights. Use `highlightMatch()` which escapes text before wrapping the query in `<mark>`.

```php
protected function transformExampleToResult(Example $example, string $query): array
{
    $title = $example->title;
    $subtitle = $example->body ? Str::limit($example->body, 60) : null;
    $highlight = null;
    if ($query !== '') {
        $highlight = [
            'title' => $this->highlightMatch($title, $query),
            'subtitle' => $subtitle ? $this->highlightMatch($subtitle, $query) : null,
        ];
    }
    $safeTitle = htmlspecialchars($title, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $safeSubtitle = $subtitle !== null ? htmlspecialchars($subtitle, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') : null;
    return [
        'id' => $example->id,
        'type' => 'example',
        'title' => $safeTitle,
        'subtitle' => $safeSubtitle,
        'url' => '/examples/' . $example->id,
        'highlight' => $highlight,
    ];
}
```

**3d. Implement search method (optional pagination):**

Add a method similar to `searchUsers()` that returns a paginator or collection, then use it in `globalSearch()` and pass items through the transform method.

## Step 4: Optional Meilisearch Index Settings

In `backend/config/scout.php`, under `meilisearch.index-settings`, you can add filterable and sortable attributes for the new index:

```php
'meilisearch' => [
    'host' => env('MEILISEARCH_HOST', 'http://127.0.0.1:7700'),
    'key' => env('MEILISEARCH_KEY'),
    'index-settings' => [
        'users' => [
            'filterableAttributes' => ['id'],
            'sortableAttributes' => ['created_at'],
        ],
        'examples' => [
            'filterableAttributes' => ['id'],
            'sortableAttributes' => ['created_at'],
        ],
    ],
],
```

Apply settings via Meilisearch dashboard or Scout’s index configuration if your app syncs them.

## Step 5: Add Result Icon (Frontend)

In `frontend/components/search/search-result-icon.tsx`, add an icon for the new result type so the global search modal shows the correct icon.

```tsx
// frontend/components/search/search-result-icon.tsx

import { User, FileText, Settings, BookOpen } from "lucide-react";

const TYPE_ICONS: Record<string, LucideIcon> = {
  user: User,
  example: BookOpen,
  document: FileText,
  setting: Settings,
};
```

Use the same `type` string as in the backend transform (e.g. `example`).

## Step 6: Run Initial Index

After adding the model, index existing records:

```bash
# All indexes
php artisan search:reindex

# Only the new model
php artisan search:reindex examples
```

Or use **Configuration > Search** in the admin UI and click **Reindex** for the new model or **Reindex all**.

## Checklist

### Backend

- [ ] Model uses `Searchable` trait and implements `toSearchableArray()` and `searchableAs()`
- [ ] SearchReindexCommand: model added to `$searchableModels`
- [ ] SearchService: model added to `$searchableModels`, type branch in `globalSearch()`, transform method with **HTML-escaped** title/subtitle (and `highlightMatch()` for highlights)
- [ ] Routes: if results include user/PHI data, ensure `log.access:User` (or appropriate) middleware on search/suggestions routes
- [ ] SearchController: add new type to validation `type` rule if filtered by type (e.g. `'type' => ['nullable', 'string', 'in:users,examples']`); SearchAdminController reindex validation `'model' => ['nullable', 'string', 'in:users,examples']`
- [ ] Optional: scout.php index-settings for filterable/sortable
- [ ] Run `search:reindex` (or reindex from admin UI)

### Frontend

- [ ] search-result-icon.tsx: icon added for the new result type

### Testing

- [ ] Unit/feature test: model is searchable and reindex runs
- [ ] Manual: global search (Cmd+K) returns the new type; admin Search page shows stats and reindex works

## Compliance

- **XSS:** All `title` and `subtitle` (and any user-provided text in results) must be escaped with `htmlspecialchars(..., ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')` before returning from the API. Use `highlightMatch()` for highlight text (it escapes before wrapping the query in `<mark>`). The frontend renders highlights with `dangerouslySetInnerHTML`.
- **Access logging (HIPAA):** If the new searchable type is user/PHI data, ensure `GET /api/search` and `GET /api/search/suggestions` use `log.access:User` (or the appropriate resource type) middleware. See [Logging Compliance](../../../.cursor/rules/logging-compliance.mdc) and [Recipe: Add access logging](add-access-logging.md).

## Example: UserGroup (Admin-Only)

UserGroup is an admin-only searchable model. Non-admins do not see group results.

- **Model:** Add `Searchable` trait; `toSearchableArray()` returns `id`, `name`, `slug`, `description`; `searchableAs()` returns `'user_groups'`.
- **SearchService:** Add `user_groups` to `$searchableModels`. In `globalSearch()`, when `$modelType === 'user_groups'`, if `$scopeUserId !== null` set `$total = 0` (admin-only); otherwise call `UserGroup::search($query)->paginate(...)` and transform with `transformUserGroupToResult()`.
- **getSuggestions:** For admin users, call `searchUserGroups($query, $limit)` and merge page + group + user results. Non-admins skip groups.
- **URL:** Results link to `/configuration/groups?highlight={id}`.
- **Icon:** Add `group: Users` in `search-result-icon.tsx`.

See `backend/app/Models/UserGroup.php` and `SearchService::searchUserGroups()` for the implementation.

## Related Documentation

- [SearchService Pattern](../patterns.md#searchservice-pattern)
- [Add Searchable Page](add-searchable-page.md) — For static navigation pages (not Eloquent models)
- [Meilisearch Integration Roadmap](../../plans/meilisearch-integration-roadmap.md)
- [Laravel Scout](https://laravel.com/docs/scout)
- [Meilisearch](https://www.meilisearch.com/docs)

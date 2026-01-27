# Meilisearch Integration Roadmap

Full-text search implementation using Meilisearch and Laravel Scout.

## Overview

Integrate Meilisearch as the search engine for Sourdough, providing fast full-text search across all searchable content. Uses Laravel Scout for backend integration and provides a unified search experience in the frontend.

**Why Meilisearch:**
- Typo-tolerant, instant search results
- Easy to deploy (single binary or Docker container)
- Great Laravel Scout integration
- Low resource usage compared to Elasticsearch
- Built-in filtering, faceting, and highlighting

## Prerequisites

- Docker setup complete (ADR-009)
- Database migrations stable

## Phase 1: Docker Setup

Add Meilisearch container to Docker Compose.

- [ ] Add Meilisearch service to `docker-compose.yml`
- [ ] Add Meilisearch service to `docker-compose.prod.yml`
- [ ] Add Meilisearch volume for data persistence
- [ ] Configure environment variables (`MEILI_MASTER_KEY`, `MEILI_ENV`)
- [ ] Add health check for Meilisearch service
- [ ] Update `docs/docker.md` with Meilisearch configuration
- [ ] Test container startup and connectivity

**Key files:**
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `.env.example`

## Phase 2: Backend Integration

Install and configure Laravel Scout with Meilisearch driver.

- [ ] Install Laravel Scout: `composer require laravel/scout`
- [ ] Install Meilisearch driver: `composer require meilisearch/meilisearch-php`
- [ ] Publish Scout config: `php artisan vendor:publish --provider="Laravel\Scout\ScoutServiceProvider"`
- [ ] Configure Scout for Meilisearch in `config/scout.php`
- [ ] Add Scout environment variables to `.env.example`
- [ ] Create `SearchService` for centralized search logic
- [ ] Add search configuration to settings system (admin-configurable)

**Environment variables:**
```env
SCOUT_DRIVER=meilisearch
MEILISEARCH_HOST=http://meilisearch:7700
MEILISEARCH_KEY=your-master-key
```

**Key files:**
- `backend/config/scout.php`
- `backend/app/Services/Search/SearchService.php`
- `backend/composer.json`

## Phase 3: Model Configuration

Make models searchable with Scout.

- [ ] Add `Searchable` trait to User model
- [ ] Configure searchable attributes for User
- [ ] Add `Searchable` trait to any other content models
- [ ] Configure index settings (filterable attributes, sortable attributes)
- [ ] Create artisan command for bulk indexing: `php artisan scout:import`
- [ ] Add model observers for automatic index updates
- [ ] Test search index synchronization

**Example model configuration:**
```php
use Laravel\Scout\Searchable;

class User extends Authenticatable
{
    use Searchable;

    public function toSearchableArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at->timestamp,
        ];
    }

    public function searchableAs(): string
    {
        return 'users';
    }
}
```

**Key files:**
- `backend/app/Models/User.php`
- `backend/app/Models/*.php` (other searchable models)

## Phase 4: API Endpoints

Create search API for frontend consumption.

- [ ] Create `SearchController` with global search endpoint
- [ ] Add endpoint for searching specific model types
- [ ] Implement search filters (date range, type, etc.)
- [ ] Add pagination support for search results
- [ ] Implement search highlighting in results
- [ ] Add search suggestions/autocomplete endpoint
- [ ] Create API tests for search endpoints
- [ ] Document search API in `docs/api-reference.md`

**API endpoints:**
```
GET /api/search?q={query}&type={type}&page={page}
GET /api/search/suggestions?q={query}
```

**Key files:**
- `backend/app/Http/Controllers/Api/SearchController.php`
- `backend/routes/api.php`
- `backend/tests/Feature/SearchTest.php`

## Phase 5: Frontend Integration

Build search UI components.

- [ ] Create `SearchService` in frontend for API calls
- [ ] Build `SearchInput` component with debounced input
- [ ] Build `SearchResults` component with highlighting
- [ ] Build `SearchModal` (Cmd+K) for global search
- [ ] Add search to header/navigation
- [ ] Implement search result type icons/badges
- [ ] Add keyboard navigation for search results
- [ ] Add recent searches (localStorage)
- [ ] Add "no results" state with suggestions
- [ ] Test search UX across different screen sizes

**Key files:**
- `frontend/lib/search.ts`
- `frontend/components/search/search-input.tsx`
- `frontend/components/search/search-results.tsx`
- `frontend/components/search/search-modal.tsx`
- `frontend/components/header.tsx`

## Phase 6: Admin Configuration

Add admin settings for search configuration.

- [ ] Add search settings to admin panel
- [ ] Configure which models are searchable (toggle)
- [ ] Set search result limits
- [ ] Rebuild index button in admin
- [ ] View index statistics
- [ ] Configure search synonyms (optional)

**Key files:**
- `frontend/app/(dashboard)/admin/search/page.tsx`
- `backend/app/Http/Controllers/Api/Admin/SearchAdminController.php`

## Success Criteria

- [ ] Meilisearch runs in Docker alongside app
- [ ] Models indexed automatically on create/update/delete
- [ ] Search returns results in < 50ms
- [ ] Cmd+K opens global search modal
- [ ] Search supports typo tolerance
- [ ] Admin can rebuild indexes from UI
- [ ] Search documented in API reference

## Future Enhancements

- Federated search across multiple indexes
- Search analytics (popular queries, zero-result queries)
- Advanced filters (faceted search)
- Search result ranking customization
- Multi-tenancy support (scoped indexes)

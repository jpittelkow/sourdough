# Meilisearch Configuration Roadmap

Admin-configurable Meilisearch settings with external instance support and search toggle.

## Overview

Refactor Meilisearch integration to allow administrators to configure the Meilisearch instance URL and keys through the admin UI rather than environment variables only. Additionally, provide a toggle to disable search entirely, which removes the search bar from the header.

**Why this enhancement:**
- Allows using external/hosted Meilisearch instances (Meilisearch Cloud, dedicated server)
- Enables switching between embedded and external search without container rebuild
- Provides option to disable search for deployments that don't need it
- Reduces attack surface when search is not required

## Prerequisites

- Meilisearch Integration complete (2026-01-30)
- Settings system in place (SettingService)

## Phase 1: Database Settings

Add Meilisearch configuration to the settings system.

- [ ] Add search settings to `config/settings-schema.php`:
  - `search.enabled` (boolean, default: true)
  - `search.host` (string, default: `http://127.0.0.1:7700`)
  - `search.api_key` (string, encrypted, default: from `MEILI_MASTER_KEY` env)
  - `search.use_embedded` (boolean, default: true) - hint for UI
- [ ] Create migration to seed default values from environment
- [ ] Update `SearchService` to read from SettingService instead of direct env
- [ ] Add validation for Meilisearch URL format

**Key files:**
- `backend/config/settings-schema.php`
- `backend/app/Services/Search/SearchService.php`

## Phase 2: Admin Configuration UI

Update Configuration > Search page with instance settings.

- [ ] Add "Search Instance" section to search configuration page
- [ ] Add toggle: "Enable Search" (when disabled, hides search UI globally)
- [ ] Add radio/select: "Use embedded instance" vs "Use external instance"
- [ ] When external selected, show:
  - Meilisearch URL input
  - API Key input (masked/password field)
  - "Test Connection" button
- [ ] Show connection status indicator (connected/error)
- [ ] Add health check endpoint for testing external connections

**Key files:**
- `frontend/app/(dashboard)/configuration/search/page.tsx`
- `backend/app/Http/Controllers/Api/Admin/SearchAdminController.php`

## Phase 3: Search Toggle Integration

Hide search UI when disabled.

- [ ] Add `search.enabled` to app config API response
- [ ] Update `AppConfigProvider` to include search enabled state
- [ ] Conditionally render search button in Header based on setting
- [ ] Conditionally register Cmd+K shortcut based on setting
- [ ] Update SearchProvider to check enabled state before rendering modal
- [ ] Hide Configuration > Search admin link when search is disabled (optional)

**Key files:**
- `frontend/lib/app-config.tsx`
- `frontend/components/header.tsx`
- `frontend/components/search/search-provider.tsx`

## Phase 4: Connection Management

Handle connection switching and validation.

- [ ] Add endpoint to test Meilisearch connection with provided credentials
- [ ] Show warning when switching from embedded to external (data won't migrate)
- [ ] Add "Reindex All" prompt when switching instances
- [ ] Handle graceful degradation if external instance is unavailable
- [ ] Add health check to system status/monitoring

**Key files:**
- `backend/app/Http/Controllers/Api/Admin/SearchAdminController.php`
- `backend/app/Services/Search/SearchService.php`

## Success Criteria

- [ ] Admin can enable/disable search from Configuration > Search
- [ ] When search is disabled, search bar and Cmd+K shortcut are hidden
- [ ] Admin can configure external Meilisearch instance (URL + API key)
- [ ] "Test Connection" validates external instance before saving
- [ ] Embedded instance remains the default for new installations
- [ ] Settings stored in database, not requiring env changes

## Future Enhancements

- Automatic failover from external to embedded instance
- Multiple index configuration (different instances per model type)
- Search analytics dashboard integration
- Meilisearch Cloud wizard/integration

# AI Development Guide

Quick-start guide for AI assistants developing on Sourdough.

## Quick Context Loading

**Before doing anything else, identify your task type and load these files:**

| Task Type | Read First |
|-----------|------------|
| **New Project Setup** | Say **"Get cooking"** — [setup-new-project](recipes/setup-new-project.md) (master index), [Tier 1](recipes/setup-identity-branding.md), [Tier 2](recipes/setup-features-auth.md), [Tier 3](recipes/setup-infrastructure-repo.md), `FORK-ME.md`, `docs/customization-checklist.md` |
| Frontend UI | `frontend/app/(dashboard)/`, `frontend/components/`, `frontend/lib/api.ts` |
| Backend API | `backend/routes/api.php`, `backend/app/Http/Controllers/Api/` |
| Branding/UI | `frontend/config/app.ts`, `frontend/components/logo.tsx`, [branding roadmap](../plans/branding-ui-consistency-roadmap.md) |
| Mobile/Responsive | [ADR-013](../adr/013-responsive-mobile-first-design.md), `frontend/lib/use-mobile.ts`, [responsive recipe](recipes/make-component-responsive.md) |
| Notifications | [ADR-005](../adr/005-notification-system-architecture.md), [ADR-017](../adr/017-notification-template-system.md), [ADR-025](../adr/025-novu-notification-integration.md), `backend/app/Services/Notifications/`, `backend/app/Services/NovuService.php`, [trigger-notifications](recipes/trigger-notifications.md), [add-notification-template](recipes/add-notification-template.md), [configure-novu](recipes/configure-novu.md) |
| LLM | [ADR-006](../adr/006-llm-orchestration-modes.md), `backend/app/Services/LLM/` |
| Settings | [ADR-012](../adr/012-admin-only-settings.md), [ADR-014](../adr/014-database-settings-env-fallback.md), `backend/app/Services/SettingService.php`, `backend/config/settings-schema.php`, `frontend/app/(dashboard)/configuration/` |
| Backup & Restore | [ADR-007](../adr/007-backup-system-design.md), `backend/app/Services/Backup/BackupService.php`, `backend/config/settings-schema.php` (backup group), [add-backup-destination](recipes/add-backup-destination.md), [extend-backup-restore](recipes/extend-backup-restore.md) |
| Auth | [ADR-002](../adr/002-authentication-architecture.md), `backend/app/Http/Controllers/Api/AuthController.php` |
| Logging | [Logging](../logging.md), `backend/config/logging.php`, `frontend/lib/error-logger.ts`, [extend-logging](recipes/extend-logging.md), [add-access-logging](recipes/add-access-logging.md) |
| Search | `backend/app/Services/Search/SearchService.php`, `frontend/lib/search.ts`, [add-searchable-model](recipes/add-searchable-model.md), [context-loading: Search Work](context-loading.md#search-work) |
| Help/Documentation | `frontend/lib/help/help-content.ts`, `frontend/components/help/`, [add-help-article](recipes/add-help-article.md), [context-loading: Help/Documentation](context-loading.md#help--documentation-work) |
| Docker | [ADR-009](../adr/009-docker-single-container.md), `docker/Dockerfile`, `docker-compose.yml` |
| Testing | [ADR-008](../adr/008-testing-strategy.md), `e2e/`, `backend/tests/` |
| PWA | [PWA roadmap](../plans/pwa-roadmap.md), `frontend/public/sw.js`, `frontend/lib/use-install-prompt.ts`, [add-pwa-install-prompt](recipes/add-pwa-install-prompt.md), [context-loading: PWA Work](context-loading.md#pwa-work) |
| Security | [ADR-024](../adr/024-security-hardening.md), [Security roadmap](../plans/security-compliance-roadmap.md), `backend/app/Services/UrlValidationService.php`, `backend/app/Providers/AppServiceProvider.php` |
| Release/Deploy | `VERSION`, `frontend/public/sw.js`, `.github/workflows/release.yml`, [commit-and-release recipe](recipes/commit-and-release.md), [context-loading: Release Work](context-loading.md#release--deployment-work) |

**Full context loading details:** [context-loading.md](context-loading.md)

## Development Workflow

```
                     ┌──────────────┐
                     │ 1. Check     │
                     │ Roadmaps     │
                     └──────┬───────┘
                            ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 2. Load      │────▶│ 3. Plan      │────▶│ 4. Work      │
│ Context      │     │ (+ recipes/  │     │ (follow      │
│ (read files) │     │  patterns)   │     │  the plan)   │
└──────────────┘     └──────────────┘     └──────────────┘
```

## Planning Requirements

When creating a plan for implementation:

1. **Identify applicable recipes** - Check the recipes table below; name the specific recipes in your plan
2. **Reference patterns** - Note which patterns from [patterns/README.md](patterns/README.md) apply
3. **Link to ADRs** - Include relevant architectural decisions
4. **Include context loading** - Reference which files from [context-loading.md](context-loading.md) will be read

Example plan reference:

> This implementation will follow [add-config-page.md](recipes/add-config-page.md) recipe and use the SettingService pattern from patterns/setting-service.md. Relevant ADR: [ADR-014](../adr/014-database-settings-env-fallback.md).

## Quick Links - Recipes

| Task | Recipe |
|------|--------|
| **Set Up New Project** | [setup-new-project.md](recipes/setup-new-project.md) (master index) |
| — Tier 1: Identity & Branding | [setup-identity-branding.md](recipes/setup-identity-branding.md) |
| — Tier 2: Features & Auth | [setup-features-auth.md](recipes/setup-features-auth.md) |
| — Tier 3: Infrastructure & Repo | [setup-infrastructure-repo.md](recipes/setup-infrastructure-repo.md) |
| Commit, Push & Release | [commit-and-release.md](recipes/commit-and-release.md) |
| Code Review | [code-review.md](recipes/code-review.md) |
| Add API Endpoint | [add-api-endpoint.md](recipes/add-api-endpoint.md) |
| Add Admin-Protected Action | [add-admin-protected-action.md](recipes/add-admin-protected-action.md) |
| Add Config Page | [add-config-page.md](recipes/add-config-page.md) |
| Add Settings Page | [add-settings-page.md](recipes/add-settings-page.md) |
| Add UI Component | [add-ui-component.md](recipes/add-ui-component.md) |
| Add Collapsible Section | [add-collapsible-section.md](recipes/add-collapsible-section.md) |
| Add Provider Icon | [add-provider-icon.md](recipes/add-provider-icon.md) |
| Add Notification Channel | [add-notification-channel.md](recipes/add-notification-channel.md) |
| Configure Novu | [configure-novu.md](recipes/configure-novu.md) |
| Trigger Notifications | [trigger-notifications.md](recipes/trigger-notifications.md) |
| Add Dashboard Widget | [add-dashboard-widget.md](recipes/add-dashboard-widget.md) |
| Add LLM Provider | [add-llm-provider.md](recipes/add-llm-provider.md) |
| Add SSO Provider | [add-sso-provider.md](recipes/add-sso-provider.md) |
| Add Backup Destination | [add-backup-destination.md](recipes/add-backup-destination.md) |
| Extend Backup & Restore | [extend-backup-restore.md](recipes/extend-backup-restore.md) |
| Add Storage Provider | [add-storage-provider.md](recipes/add-storage-provider.md) |
| Add Email Template | [add-email-template.md](recipes/add-email-template.md) |
| Add Notification Template | [add-notification-template.md](recipes/add-notification-template.md) |
| Keep Notification Template Variables Up to Date | [keep-notification-template-variables-up-to-date.md](recipes/keep-notification-template-variables-up-to-date.md) |
| Extend Logging | [extend-logging.md](recipes/extend-logging.md) |
| Add Access Logging (HIPAA) | [add-access-logging.md](recipes/add-access-logging.md) |
| Add Searchable Model | [add-searchable-model.md](recipes/add-searchable-model.md) |
| Add Tests | [add-tests.md](recipes/add-tests.md) |
| Make Responsive | [make-component-responsive.md](recipes/make-component-responsive.md) |
| Assign User to Groups | [assign-user-to-groups.md](recipes/assign-user-to-groups.md) |
| Create Custom Group | [create-custom-group.md](recipes/create-custom-group.md) |
| Add New Permission | [add-new-permission.md](recipes/add-new-permission.md) |
| Add Auditable Action | [add-auditable-action.md](recipes/add-auditable-action.md) |
| Trigger Audit Logging | [trigger-audit-logging.md](recipes/trigger-audit-logging.md) |
| Add Searchable Page | [add-searchable-page.md](recipes/add-searchable-page.md) |
| Add Help Article | [add-help-article.md](recipes/add-help-article.md) |
| Add Configuration Menu Item | [add-configuration-menu-item.md](recipes/add-configuration-menu-item.md) |
| Add PWA Install Prompt | [add-pwa-install-prompt.md](recipes/add-pwa-install-prompt.md) |

## Common Gotchas

- **Global components** - NEVER duplicate logic across pages. Use shared components from `frontend/components/` and utilities from `frontend/lib/`. See [Components Pattern](patterns/components.md).
- **User scoping** - Most tables have `user_id`. Always filter by `$request->user()->id`
- **User password** - The User model uses the `hashed` cast. Pass plaintext when creating/updating; do not use `Hash::make()` in controllers or you will double-hash.
- **SQLite default** - Dev uses SQLite but code supports MySQL/PostgreSQL. Test array/JSON columns carefully.
- **API prefix** - All backend routes are under `/api/`. Frontend calls go through Nginx proxy.
- **Settings models** - User settings use `Setting` model; system settings use `SystemSetting` model
- **Schema-backed settings** - For settings in `backend/config/settings-schema.php` (e.g. mail), use **SettingService** (env fallback, encryption, cache); do not use `SystemSetting::get`/`set` directly. See [ADR-014](../adr/014-database-settings-env-fallback.md) and [SettingService pattern](patterns/setting-service.md).
- **Sanctum cookies** - Auth uses session cookies, not Bearer tokens. Include `credentials: 'include'` in fetch.
- **shadcn/ui** - Components in `frontend/components/ui/` are CLI-managed. Use `npx shadcn@latest add <component>` from `frontend/`; config in `frontend/components.json`. See [Quick Reference](../quick-reference.md) for commands.
- **Service layer** - Business logic goes in `Services/`, not controllers. Controllers just validate and route.
- **Form fields optional by default** - Config pages should make fields optional unless explicitly required. Use `z.string().optional()` and `.refine()` for format validation that allows empty. See [add-config-page recipe](recipes/add-config-page.md).
- **Mobile-first CSS** - Write base styles for mobile (no prefix), add `md:`, `lg:` for larger screens. Use `useIsMobile()` hook for conditional rendering. See [Responsive Pattern](patterns/responsive.md).
- **Admin is group-based** - Admin status is determined by membership in the `admin` group, not an `is_admin` column. Use `$user->isAdmin()` or `$user->inGroup('admin')` on backend; use `isAdminUser(user)` from `frontend/lib/auth.ts` on frontend. The API returns a computed `is_admin` attribute for compatibility.
- **Audit actions** - Use `AuditService` for logging user actions (auth events, settings changes, admin operations). Use `{resource}.{action}` naming (e.g. `user.created`, `settings.updated`). Sensitive data is auto-masked.

See also: [Anti-Patterns](anti-patterns/README.md) - Common mistakes to avoid

## Adding Tools & Dependencies

When adding new external tools or dependencies:
1. **Check [OpenAlternative.co](https://openalternative.co/)** for open-source alternatives
2. Prefer open-source tools that align with the project's self-hosted philosophy
3. Document the tool choice in the relevant ADR or journal entry

## Key Architectural Concepts

- **Single Docker container** - Nginx + PHP-FPM + Next.js via Supervisor
- **API-first** - Frontend calls backend via `/api/` proxy
- **User-scoped data** - Most tables have `user_id` column
- **Service layer** - Business logic in `Services/`, not controllers
- **Channel/Provider pattern** - Notifications, LLM, Backup all use pluggable implementations
- **Global components** - One implementation, used everywhere. No duplicated logic across pages.

## Detailed Guides

| Guide | Purpose |
|-------|---------|
| [Architecture Map](architecture-map.md) | How data flows through the application |
| [Context Loading](context-loading.md) | Full list of files to read per task type |
| [Patterns](patterns/README.md) | Code patterns with copy-paste examples |
| [Anti-Patterns](anti-patterns/README.md) | Common mistakes to avoid |
| [Recipes](recipes/) | Step-by-step guides for common tasks |

## Related Documentation

- [Quick Reference](../quick-reference.md) - Commands, structure, naming conventions
- [Architecture ADRs](../architecture.md) - Design decisions
- [Features](../features.md) - What's implemented
- [Roadmaps](../roadmaps.md) - What's planned

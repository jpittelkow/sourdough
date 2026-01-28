# AI Development Guide

Quick-start guide for AI assistants developing on Sourdough.

## Quick Context Loading

**Before doing anything else, identify your task type and load these files:**

| Task Type | Read First |
|-----------|------------|
| Frontend UI | `frontend/app/(dashboard)/`, `frontend/components/`, `frontend/lib/api.ts` |
| Backend API | `backend/routes/api.php`, `backend/app/Http/Controllers/Api/` |
| Branding/UI | `frontend/config/app.ts`, `frontend/components/logo.tsx`, [branding roadmap](../plans/branding-ui-consistency-roadmap.md) |
| Mobile/Responsive | [ADR-013](../adr/013-responsive-mobile-first-design.md), `frontend/lib/use-mobile.ts`, [responsive recipe](recipes/make-component-responsive.md) |
| Notifications | [ADR-005](../adr/005-notification-system-architecture.md), `backend/app/Services/Notifications/` |
| LLM | [ADR-006](../adr/006-llm-orchestration-modes.md), `backend/app/Services/LLM/` |
| Settings | [ADR-012](../adr/012-admin-only-settings.md), `frontend/app/(dashboard)/settings/` |
| Auth | [ADR-002](../adr/002-authentication-architecture.md), `backend/app/Http/Controllers/Api/AuthController.php` |
| Docker | [ADR-009](../adr/009-docker-single-container.md), `docker/Dockerfile`, `docker-compose.yml` |
| Testing | [ADR-008](../adr/008-testing-strategy.md), `e2e/`, `backend/tests/` |

**Full context loading details:** [context-loading.md](context-loading.md)

## Development Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Check     │────▶│ 2. Load      │────▶│ 3. Follow    │
│ Roadmaps     │     │ Context      │     │ Patterns     │
│ (planned?)   │     │ (read files) │     │ (consistent) │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
┌──────────────┐     ┌──────────────┐            │
│ 6. Journal   │◀────│ 5. Update    │◀───────────┤
│ (if major)   │     │ Docs         │            │
└──────────────┘     └──────────────┘            ▼
                                          ┌──────────────┐
                                          │ 4. Use       │
                                          │ Recipe       │
                                          └──────────────┘
```

## Quick Links - Recipes

| Task | Recipe |
|------|--------|
| Add API Endpoint | [add-api-endpoint.md](recipes/add-api-endpoint.md) |
| Add Config Page | [add-config-page.md](recipes/add-config-page.md) |
| Add Settings Page | [add-settings-page.md](recipes/add-settings-page.md) |
| Add UI Component | [add-ui-component.md](recipes/add-ui-component.md) |
| Add Notification Channel | [add-notification-channel.md](recipes/add-notification-channel.md) |
| Trigger Notifications | [trigger-notifications.md](recipes/trigger-notifications.md) |
| Add Dashboard Widget | [add-dashboard-widget.md](recipes/add-dashboard-widget.md) |
| Add LLM Provider | [add-llm-provider.md](recipes/add-llm-provider.md) |
| Add Backup Destination | [add-backup-destination.md](recipes/add-backup-destination.md) |
| Add Tests | [add-tests.md](recipes/add-tests.md) |
| Make Responsive | [make-component-responsive.md](recipes/make-component-responsive.md) |

## Common Gotchas

- **Global components** - NEVER duplicate logic across pages. Use shared components from `frontend/components/` and utilities from `frontend/lib/`. See [Cursor rule](../../.cursor/rules/global-components.mdc).
- **User scoping** - Most tables have `user_id`. Always filter by `$request->user()->id`
- **SQLite default** - Dev uses SQLite but code supports MySQL/PostgreSQL. Test array/JSON columns carefully.
- **API prefix** - All backend routes are under `/api/`. Frontend calls go through Nginx proxy.
- **Settings models** - User settings use `Setting` model; system settings use `SystemSetting` model
- **Sanctum cookies** - Auth uses session cookies, not Bearer tokens. Include `credentials: 'include'` in fetch.
- **shadcn/ui** - Components in `frontend/components/ui/` are CLI-managed. Use `npx shadcn@latest add <component>` from `frontend/`; config in `frontend/components.json`. See [Quick Reference](../quick-reference.md) for commands.
- **Service layer** - Business logic goes in `Services/`, not controllers. Controllers just validate and route.
- **Form fields optional by default** - Config pages should make fields optional unless explicitly required. Use `z.string().optional()` and `.refine()` for format validation that allows empty. See [add-config-page recipe](recipes/add-config-page.md).
- **Mobile-first CSS** - Write base styles for mobile (no prefix), add `md:`, `lg:` for larger screens. Use `useIsMobile()` hook for conditional rendering. See [Cursor rule](../../.cursor/rules/responsive-mobile-first.mdc).

See also: [Anti-Patterns](anti-patterns.md) - Common mistakes to avoid

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
| [Patterns](patterns.md) | Code patterns with copy-paste examples |
| [Anti-Patterns](anti-patterns.md) | Common mistakes to avoid |
| [Recipes](recipes/) | Step-by-step guides for common tasks |

## Related Documentation

- [Quick Reference](../quick-reference.md) - Commands, structure, naming conventions
- [Architecture ADRs](../architecture.md) - Design decisions
- [Features](../features.md) - What's implemented
- [Roadmaps](../roadmaps.md) - What's planned

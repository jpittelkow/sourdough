# Roadmaps & Plans

Development roadmaps and implementation history.

## Active Development

Currently in progress. Complete these before starting new work.

_No items. Documentation Audit complete._

## Next Up

Ready to start. These are unblocked and can begin immediately.

_No items._

## Planned Features

Requires foundation work or longer-term planning.

| Roadmap | Priority | Status |
|---------|----------|--------|
| [In-App Documentation & Onboarding](plans/in-app-documentation-roadmap.md) | MEDIUM | ✅ Phases 1-3 complete (Wizard, Tooltips, Help Center) |
| [Database Options](plans/database-options-roadmap.md) | LOW | ✅ Env to Database (complete) |

## Pre-Release Checklist

After completing Planned Features, complete these final tasks before release:

- [ ] **Final Code Review** - Review all modified files for bugs, debug code, hardcoded values, and adherence to patterns (see [Code Review recipe](ai/recipes/code-review.md))
- [ ] **Roadmap Cleanup** - Archive completed roadmaps, verify all links work, update stale entries (see Roadmap Maintenance below)
- [ ] **User Build Verification** - Manually verify the Docker build works end-to-end (see Build Verification below)

## Completed (Core Done)

High-priority work complete. Only optional/lower-priority items remain.

| Roadmap | Completed | Remaining Work |
|---------|-----------|----------------|
| [Progressive Web App (PWA)](plans/pwa-roadmap.md) | 2026-01-31 | Optional: periodic sync, protocol handlers, rich notifications |
| [Storage Settings Enhancement](plans/storage-settings-roadmap.md) | 2026-01-31 | Optional: usage-over-time chart, orphaned/duplicate file detection |
| [Web Push Notifications](plans/web-push-notifications-roadmap.md) | 2026-01-31 | Merged into PWA roadmap; core complete |
| [Auth UI Redesign](plans/auth-ui-redesign-roadmap.md) | 2026-01-29 | Optional: illustrations, page transitions |
| [Logging](plans/logging-roadmap.md) | 2026-01-29 | Optional: archival, aggregation, scheduled export |
| [Audit Logs & Logging](plans/audit-logs-roadmap.md) | 2026-01-29 | Optional: external storage, aggregation |
| [LLM Model Discovery](plans/llm-model-discovery-roadmap.md) | 2026-01-29 | Optional: troubleshooting E2E, additional regions for Bedrock |
| [Notifications](plans/notifications-roadmap.md) | 2026-01-27 | Optional: user docs |
| [Versioning System](plans/versioning-system-roadmap.md) | 2026-01-30 | Optional: Phase 4 (version check, update notification) |
| [Mobile Responsiveness](plans/mobile-responsive-roadmap.md) | 2026-01-27 | Optional: QA/testing items |
| [SSO Settings Enhancement](plans/sso-settings-enhancement-roadmap.md) | 2026-01-30 | Optional: Phase 4 branded logos, Phase 9 screenshots |
| [Admin Features](plans/admin-features-roadmap.md) | 2026-01-30 | Optional: Per-type notification templates, notification digest settings |

## Completed (Fully Done)

All tasks complete.

| Roadmap | Completed |
|---------|-----------|
| [Documentation Audit](plans/documentation-audit-roadmap.md) | 2026-01-31 |
| [Configurable Auth Features](plans/configurable-auth-features-roadmap.md) | 2026-01-30 |
| [Dashboard Improvements](plans/dashboard-improvements-roadmap.md) | 2026-01-30 |
| [User Groups](plans/user-groups-roadmap.md) | 2026-01-30 |
| [Meilisearch Integration](plans/meilisearch-integration-roadmap.md) | 2026-01-30 |
| [Meilisearch Configuration](plans/meilisearch-configuration-roadmap.md) | 2026-01-30 |
| [Integration Settings](plans/integration-settings-roadmap.md) | 2026-01-29 |
| [Email Configuration Dependencies](plans/email-configuration-dependencies-roadmap.md) | 2026-01-29 |
| [Env to Database Migration](plans/env-to-database-roadmap.md) | 2026-01-29 |
| [Global Components Audit](plans/global-components-audit-roadmap.md) | 2026-01-28 |
| [Branding & UI Consistency](plans/branding-ui-consistency-roadmap.md) | 2026-01-27 |
| [Settings Restructure](plans/settings-restructure-roadmap.md) | 2026-01-27 |
| [Critical Fixes](plans/critical-fixes-roadmap.md) | 2026-01-27 |
| [shadcn/ui CLI Setup](plans/shadcn-cli-setup-roadmap.md) | 2026-01-27 |
| [Configuration Navigation Redesign](plans/config-navigation-redesign-roadmap.md) | 2026-01-29 |
| [Collapsible Settings UI](plans/collapsible-settings-ui-roadmap.md) | 2026-01-29 |
| [Branded Iconography](plans/branded-iconography-roadmap.md) | 2026-01-29 |
| [Docker Container Audit](plans/docker-audit-roadmap.md) | 2026-02-05 |
| [Security Compliance Review](plans/security-compliance-roadmap.md) | 2026-02-05 |
| Page Title Fixing | 2026-02-04 |
| PWA Review | 2026-02-05 |
| Login Testing & Review | 2026-02-05 |

## Roadmap Maintenance

When adding or updating roadmaps:

1. **New roadmaps**: Add to appropriate section (Active, Next Up, or Planned) with priority
2. **Completing work**: Move to Completed section with date, note any remaining optional work
3. **Verify links**: Ensure all roadmap file links resolve correctly
4. **Journal entries**: Add implementation notes to the Journal Entries table

## Build Verification

To verify the build works end-to-end:

1. Clean rebuild: `docker-compose down -v && docker-compose up -d --build`
2. Wait for startup, then access http://localhost:8080
3. Test: login flow, dashboard loads, configuration pages work
4. Check browser console for errors

## Journal Entries

Implementation history and development notes in `journal/`:

| Date | Entry |
|------|-------|
| 2026-02-05 | [Page Titles App Name Fix](journal/2026-02-05-page-titles-app-name-fix.md) |
| 2026-02-05 | [Docker Build Optimization & Security Updates](journal/2026-02-05-docker-optimization-and-security-updates.md) |
| 2026-02-05 | [In-App Documentation & Onboarding (Phases 1-3)](journal/2026-02-05-in-app-documentation-phases-1-3.md) |
| 2026-02-05 | [Security Compliance Documentation Completion](journal/2026-02-05-security-compliance-documentation-completion.md) |
| 2026-02-05 | [Compliance Templates](journal/2026-02-05-compliance-templates.md) |
| 2026-02-05 | [Docker Container Audit](journal/2026-02-05-docker-container-audit.md) |
| 2026-02-05 | [Login Testing & Review](journal/2026-02-05-login-testing-review.md) |
| 2026-02-05 | [PWA Review and Code Audit](journal/2026-02-05-pwa-review.md) |
| 2026-02-04 | [Security Page Architecture Cleanup](journal/2026-02-04-security-page-cleanup.md) |
| 2026-02-02 | [Security SAST Automation](journal/2026-02-02-security-sast-automation.md) |
| 2026-02-02 | [Security Review Phase 1: Security Headers & CORS Hardening](journal/2026-02-02-security-review-phase-1.md) |
| 2026-01-31 | [Documentation Audit Phase 8: Cross-Reference & Completeness](journal/2026-01-31-documentation-audit-phase-8.md) |
| 2026-01-31 | [Documentation Audit Phase 4: ADR & Architecture](journal/2026-01-31-documentation-audit-phase-4-adr.md) |
| 2026-01-31 | [Documentation Audit Phase 3: Patterns & Anti-Patterns](journal/2026-01-31-documentation-audit-phase-3.md) |
| 2026-01-31 | [Documentation Audit Phase 2: AI Recipes](journal/2026-01-31-documentation-audit-phase-2.md) |
| 2026-01-31 | [Documentation Audit Phase 1: Cursor Rules](journal/2026-01-31-documentation-audit-phase-1.md) |
| 2026-01-31 | [PWA Phase 4 and 5: Install Experience and Advanced Features](journal/2026-01-31-pwa-phase-4-5-install-and-advanced.md) |
| 2026-01-31 | [PWA Phase 3: Offline Experience](journal/2026-01-31-pwa-phase-3-offline-experience.md) |
| 2026-01-31 | [PWA Phase 2: Push Notifications](journal/2026-01-31-pwa-push-notifications.md) |
| 2026-01-30 | [Notification Templates Implementation](journal/2026-01-30-notification-templates.md) |
| 2026-01-30 | [Meilisearch Embedded in Container](journal/2026-01-30-meilisearch-embedded.md) |
| 2026-01-30 | [Remove is_admin, Admin Group Only](journal/2026-01-30-remove-is-admin-group-only.md) |
| 2026-01-30 | [Meilisearch Configuration](journal/2026-01-30-meilisearch-configuration.md) |
| 2026-01-30 | [Dashboard Static Simplification](journal/2026-01-30-dashboard-static-simplification.md) |
| 2026-01-30 | [Alpine to Debian Migration for Meilisearch](journal/2026-01-30-alpine-to-debian-meilisearch.md) |
| 2026-01-30 | [User Groups Phase 4: Admin UI](journal/2026-01-30-user-groups-phase-4-admin-ui.md) |
| 2026-01-30 | [Search documentation update](journal/2026-01-30-search-documentation-update.md) |
| 2026-01-30 | [Meilisearch Integration (Phases 4–6)](journal/2026-01-30-meilisearch-phases-4-6.md) |
| 2026-01-30 | [Meilisearch Integration (Phases 1–3)](journal/2026-01-30-meilisearch-phases-1-3.md) |
| 2026-01-30 | [Configurable Auth Features](journal/2026-01-30-configurable-auth-features.md) |
| 2026-01-30 | [Storage Phase 4: Analytics & Monitoring](journal/2026-01-30-storage-phase-4-analytics.md) |
| 2026-01-30 | [Storage Settings Phase 2 (Additional Providers)](journal/2026-01-30-storage-providers-phase-2.md) |
| 2026-01-30 | [Storage Settings Phase 1 (Local Storage Transparency)](journal/2026-01-30-storage-settings-phase-1.md) |
| 2026-01-30 | [SSO Settings Enhancement](journal/2026-01-30-sso-settings-enhancement.md) |
| 2026-01-29 | [Configuration Navigation Redesign](journal/2026-01-29-config-nav-redesign.md) |
| 2026-01-29 | [Scheduled Tasks/Jobs UI (Run Now & History)](journal/2026-01-29-scheduled-jobs-ui.md) |
| 2026-01-29 | [Live Console Logs & HIPAA Access Logging](journal/2026-01-29-live-logs-hipaa-logging.md) |
| 2026-01-29 | [Access Logs Field Tracking](journal/2026-01-29-access-logs-field-tracking.md) |
| 2026-01-29 | [HIPAA Access Logging Toggle](journal/2026-01-29-hipaa-logging-toggle.md) |
| 2026-01-29 | [Console and Application Logging](journal/2026-01-29-console-app-logging.md) |
| 2026-01-29 | [Audit Dashboard Analytics (Phase 2)](journal/2026-01-29-audit-dashboard-analytics.md) |
| 2026-01-29 | [Audit Extended Features (Real-time Streaming & Structured Logging)](journal/2026-01-29-audit-extended-features.md) |
| 2026-01-29 | [Audit Logging Implementation](journal/2026-01-29-audit-logging-implementation.md) |
| 2026-01-29 | [LLM Settings Page Consolidation](journal/2026-01-29-llm-settings-consolidation.md) |
| 2026-01-29 | [LLM Model Discovery](journal/2026-01-29-llm-model-discovery.md) |
| 2026-01-29 | [User Management Admin (HIGH Priority)](journal/2026-01-29-user-management-admin.md) |
| 2026-01-29 | [Email Template Integration (Chunk D)](journal/2026-01-29-email-template-integration-chunk-d.md) |
| 2026-01-29 | [Email Template Infrastructure (Chunk B)](journal/2026-01-29-email-template-infrastructure.md) |
| 2026-01-29 | [Backup Settings Migration (Env to DB Phase 6)](journal/2026-01-29-backup-settings-migration.md) |
| 2026-01-28 | [SSO Settings Migration (Env to DB Phase 5)](journal/2026-01-28-sso-settings-migration.md) |
| 2026-01-28 | [Notification & LLM Settings Migration (Env to DB Phase 3–4)](journal/2026-01-28-notification-llm-settings-migration.md) |
| 2026-01-28 | [SettingService Implementation (Env to DB Phase 1–2)](journal/2026-01-28-setting-service-implementation.md) |
| 2026-01-28 | [Notification Config Split (Global vs Per-User)](journal/2026-01-28-notification-config-split.md) |
| 2026-01-27 | [Notifications Implementation](journal/2026-01-27-notifications-implementation.md) |
| 2026-01-27 | [Mobile Responsiveness Implementation](journal/2026-01-27-mobile-responsiveness-implementation.md) |
| 2026-01-27 | [shadcn/ui CLI Migration](journal/2026-01-27-shadcn-cli-migration.md) |
| 2026-01-26 | [AI Documentation Optimization](journal/2026-01-26-ai-documentation-optimization.md) |
| 2026-01-26 | [Docker Next.js Volume Fix](journal/2026-01-26-docker-nextjs-volume-fix.md) |
| 2026-01-26 | [Navigation Refactor](journal/2026-01-26-navigation-refactor.md) |
| 2026-01-26 | [Section 2 Settings Implementation](journal/2026-01-26-section-2-settings-implementation.md) |
| 2026-01-26 | [Documentation Restructure](journal/2026-01-26-documentation-restructure.md) |

# Roadmaps & Plans

Development roadmaps and implementation history.

## Active Development

Currently in progress. Complete these before starting new work.

_None._

## Next Up

Ready to start. These are unblocked and can begin immediately.

| Item | Priority | Source | Notes |
|------|----------|--------|-------|
| Log Storage & Archival | MEDIUM | [Audit Logs](plans/audit-logs-roadmap.md) | Evaluate storage options, implement archival, add indexes |
| Suspicious Activity Alerting | LOW | [Audit Logs](plans/audit-logs-roadmap.md) | Alert on suspicious patterns |
| Scheduled Tasks/Jobs UI | MEDIUM | [Admin Features](plans/admin-features-roadmap.md) | Jobs monitoring, backup schedule config, digest settings |
| Additional Notification Providers | MEDIUM | [Notifications](plans/notifications-roadmap.md) | ntfy channel, Novu integration |
| LLM Provider Expansion | LOW | [LLM Model Discovery](plans/llm-model-discovery-roadmap.md) | Azure OpenAI, AWS Bedrock discovery |
| Version Automation | LOW | [Versioning System](plans/versioning-system-roadmap.md) | Bump scripts, GitHub Actions, auto-release |

## Planned Features

Requires foundation work or longer-term planning.

| Roadmap | Priority | Dependencies |
|---------|----------|--------------|
| [Configuration Navigation Redesign](plans/config-navigation-redesign-roadmap.md) | MEDIUM | None |
| [Web Push Notifications](plans/web-push-notifications-roadmap.md) | MEDIUM | None |
| [SSO Settings Enhancement](plans/sso-settings-enhancement-roadmap.md) | MEDIUM | None |
| [Configurable Auth Features](plans/configurable-auth-features-roadmap.md) | MEDIUM | ✅ Email Config (complete) |
| [Security Compliance Review](plans/security-compliance-roadmap.md) | MEDIUM | ✅ Audit Logs (complete) |
| [Meilisearch Integration](plans/meilisearch-integration-roadmap.md) | MEDIUM | None |
| [Documentation Audit](plans/documentation-audit-roadmap.md) | MEDIUM | None |
| [In-App Documentation & Onboarding](plans/in-app-documentation-roadmap.md) | MEDIUM | None |
| [Branded Iconography](plans/branded-iconography-roadmap.md) | LOW | None |
| [Database Options](plans/database-options-roadmap.md) | LOW | ✅ Env to Database (complete) |
| [Collapsible Settings UI](plans/collapsible-settings-ui-roadmap.md) | LOW | None |

## Completed (Core Done)

High-priority work complete. Some optional/lower-priority items remain—see "Next Up" or individual roadmaps.

| Roadmap | Completed | Remaining Work |
|---------|-----------|----------------|
| [Audit Logs & Logging](plans/audit-logs-roadmap.md) | 2026-01-29 | Log storage/archival, alerting |
| [Admin Features](plans/admin-features-roadmap.md) | 2026-01-29 | Scheduled Tasks UI, Message Templates |
| [LLM Model Discovery](plans/llm-model-discovery-roadmap.md) | 2026-01-29 | Azure/Bedrock providers, client caching |
| [Notifications](plans/notifications-roadmap.md) | 2026-01-27 | ntfy/Novu providers, user docs |
| [Versioning System](plans/versioning-system-roadmap.md) | 2026-01-27 | Phases 2-4 (automation, scripts, actions) |
| [Mobile Responsiveness](plans/mobile-responsive-roadmap.md) | 2026-01-27 | QA/testing items (optional) |

## Completed (Fully Done)

All tasks complete.

| Roadmap | Completed |
|---------|-----------|
| [Integration Settings](plans/integration-settings-roadmap.md) | 2026-01-29 |
| [Email Configuration Dependencies](plans/email-configuration-dependencies-roadmap.md) | 2026-01-29 |
| [Env to Database Migration](plans/env-to-database-roadmap.md) | 2026-01-29 |
| [Global Components Audit](plans/global-components-audit-roadmap.md) | 2026-01-28 |
| [Branding & UI Consistency](plans/branding-ui-consistency-roadmap.md) | 2026-01-27 |
| [Settings Restructure](plans/settings-restructure-roadmap.md) | 2026-01-27 |
| [Critical Fixes](plans/critical-fixes-roadmap.md) | 2026-01-27 |
| [shadcn/ui CLI Setup](plans/shadcn-cli-setup-roadmap.md) | 2026-01-27 |

## Journal Entries

Implementation history and development notes in `journal/`:

| Date | Entry |
|------|-------|
| 2026-01-29 | [Console and Application Logging](journal/2026-01-29-console-app-logging.md) |
| 2026-01-29 | [Audit Dashboard Analytics (Phase 2)](journal/2026-01-29-audit-dashboard-analytics.md) |
| 2026-01-29 | [Audit Extended Features (Real-time Streaming & Structured Logging)](journal/2026-01-29-audit-extended-features.md) |
| 2026-01-29 | [Audit Logging Implementation](journal/2026-01-29-audit-logging-implementation.md) |
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

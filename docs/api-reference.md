# API Reference

REST API documentation:

- [API Documentation](api/README.md) - Complete API reference with endpoints, authentication, examples
- [OpenAPI Specification](api/openapi.yaml) - OpenAPI 3.0 spec for API tooling integration

The REST API is available at `/api`. Key endpoints:

```
Authentication:
  POST   /api/auth/check-email   Check email availability for signup (body: email; rate limited)
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/user

Profile:
  GET    /api/profile
  PUT    /api/profile
  PUT    /api/profile/password

Settings:
  GET    /api/settings
  PUT    /api/settings

Notifications:
  GET    /api/notifications
  POST   /api/notifications/mark-read

LLM:
  GET    /api/llm/providers
  POST   /api/llm/query
  POST   /api/llm/query/vision

LLM Settings (Admin) – model discovery and key validation:
  POST   /api/llm-settings/test-key       Validate API key (body: provider, api_key?, host?)
  POST   /api/llm-settings/discover-models Fetch models (body: provider, api_key?, host?)

Backup (Admin):
  GET    /api/backup                      List backups
  POST   /api/backup/create               Create backup (body: include_database, include_files, include_settings)
  GET    /api/backup/download/{filename}  Download backup file
  POST   /api/backup/restore              Restore (body: filename or multipart backup file)
  DELETE /api/backup/{filename}           Delete backup

Backup Settings (Admin):
  GET    /api/backup-settings             Get all backup settings
  PUT    /api/backup-settings             Update backup settings
  POST   /api/backup-settings/reset/{key} Reset one setting to env default
  POST   /api/backup-settings/test/{dest} Test connection (dest: s3, sftp, google_drive)

Search (authenticated; access logged when returning user data — log.access:User):
  GET    /api/search                        Global search (query: q, type, page, per_page). Returns data (id, type, title, subtitle, url, highlight) and meta (query, total, page, per_page). Admin sees all users; non-admin scoped to self.
  GET    /api/search/suggestions            Autocomplete (query: q, limit). Returns data array of same shape.

Search Admin (Admin):
  GET    /api/admin/search/stats            Index statistics (document counts per model)
  POST   /api/admin/search/reindex          Reindex (body: optional model). Omit model to reindex all.

User Management (Admin):
  GET    /api/users                        List users (paginated, searchable)
  POST   /api/users                        Create user
  GET    /api/users/{user}                 Get user
  PUT    /api/users/{user}                 Update user
  DELETE /api/users/{user}                 Delete user
  POST   /api/users/{user}/toggle-admin   Toggle admin group membership
  POST   /api/users/{user}/reset-password Reset password
  POST   /api/users/{user}/disable        Toggle disabled status
  POST   /api/users/{user}/resend-verification Resend verification email

User Groups (Admin):
  GET    /api/permissions                   List available permissions (categories for UI)
  GET    /api/groups                        List groups (with members_count)
  POST   /api/groups                        Create group (body: name, slug, description?, is_default?)
  GET    /api/groups/{group}                Get group
  PUT    /api/groups/{group}                Update group (system group: slug immutable)
  DELETE /api/groups/{group}                Delete group (system groups forbidden)
  GET    /api/groups/{group}/members        List members (paginated)
  POST   /api/groups/{group}/members        Add members (body: user_ids[])
  DELETE /api/groups/{group}/members/{user} Remove member
  GET    /api/groups/{group}/permissions    Get group permissions
  PUT    /api/groups/{group}/permissions    Update permissions (body: permissions[] with permission, resource_type?, resource_id?)

Audit Logs (Admin):
  GET    /api/audit-logs                   List audit logs (query: page, per_page, user_id, action, severity, date_from, date_to)
  GET    /api/audit-logs/export            Export as CSV (query: same filters)
  GET    /api/audit-logs/stats             Stats (query: date_from, date_to; default last 30 days). Response: total_actions, by_severity, daily_trends, recent_warnings, actions_by_type, actions_by_user.

Email Templates (Admin):
  GET    /api/email-templates              List all templates
  GET    /api/email-templates/{key}        Get single template
  PUT    /api/email-templates/{key}       Update template
  POST   /api/email-templates/{key}/preview Preview with variables (body: optional variables; optional subject, body_html, body_text for live preview of unsaved content)
  POST   /api/email-templates/{key}/test   Send test email (body: optional to)
  POST   /api/email-templates/{key}/reset  Reset to default (system templates only)
  (Templates power password reset, email verification, and notification emails; see [ADR-016](adr/016-email-template-system.md), [Patterns](ai/patterns.md#emailtemplateservice-pattern).)

Notification Templates (Admin):
  GET    /api/notification-templates           List all templates
  GET    /api/notification-templates/{id}      Get single template
  PUT    /api/notification-templates/{id}      Update template
  POST   /api/notification-templates/{id}/preview  Preview with variables (body: optional variables; optional title, body for live preview)
  POST   /api/notification-templates/{id}/reset   Reset to default (system templates only)
  (Per-type templates for push, inapp, chat; see [ADR-017](adr/017-notification-template-system.md), [Patterns](ai/patterns.md#notificationtemplateservice-pattern).)

Full backup API and developer docs: [Backup & Restore](backup.md), [API README – Backup](api/README.md#backup--restore-admin).

Version:
  GET    /api/version
```

# Sourdough API Documentation

This document provides an overview of the Sourdough REST API. For complete API specification, see [openapi.yaml](./openapi.yaml).

## Base URL

- **Development**: `http://localhost:8080/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Sourdough uses Laravel Sanctum for session-based authentication. Include credentials with every request:

```javascript
const response = await fetch('/api/auth/user', {
  credentials: 'include',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/check-email` | Check email availability for signup (body: `email`; rate limited) |
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/logout` | Logout current user |
| GET | `/auth/user` | Get current user |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/verify-email` | Verify email address |
| POST | `/auth/resend-verification` | Resend verification email |

### Single Sign-On (SSO)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/sso/providers` | List available SSO providers |
| GET | `/auth/sso/{provider}` | Redirect to SSO provider |
| GET | `/auth/callback/{provider}` | SSO callback handler |
| POST | `/auth/sso/{provider}/link` | Link SSO to existing account |
| DELETE | `/auth/sso/{provider}/unlink` | Unlink SSO provider |

**Supported providers**: Google, GitHub, Microsoft, Apple, Discord, GitLab, Generic OIDC

### Two-Factor Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/2fa/status` | Get 2FA status |
| POST | `/auth/2fa/enable` | Start 2FA setup |
| POST | `/auth/2fa/confirm` | Confirm 2FA with TOTP code |
| POST | `/auth/2fa/disable` | Disable 2FA |
| POST | `/auth/2fa/verify` | Verify 2FA during login |
| GET | `/auth/2fa/recovery-codes` | Get recovery codes |
| POST | `/auth/2fa/recovery-codes/regenerate` | Regenerate recovery codes |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| PUT | `/profile/password` | Update password |
| DELETE | `/profile` | Delete account |

### User Management (Admin)

Requires `admin` ability. Admin CRUD for users; disabled users cannot log in.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users (query: `page`, `per_page`, `search`) |
| POST | `/users` | Create user (body: name, email, password, is_admin, skip_verification) |
| GET | `/users/{user}` | Get user |
| PUT | `/users/{user}` | Update user (body: name, email, password, is_admin) |
| DELETE | `/users/{user}` | Delete user |
| POST | `/users/{user}/toggle-admin` | Toggle admin status |
| POST | `/users/{user}/reset-password` | Reset password (body: password) |
| POST | `/users/{user}/disable` | Toggle disabled status |
| POST | `/users/{user}/resend-verification` | Resend verification email (rate limited: 1 per 5 min per user) |

### Audit Logs (Admin)

Requires `admin` ability. See [Audit Logs roadmap](../plans/audit-logs-roadmap.md), [Recipe: Trigger audit logging](../ai/recipes/trigger-audit-logging.md).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/audit-logs` | List audit logs (paginated). Query: `page`, `per_page`, `user_id`, `action` (search), `severity`, `date_from`, `date_to`. Response: Laravel pagination (`data`, `current_page`, `last_page`, `per_page`, `total`). |
| GET | `/audit-logs/export` | Export as CSV. Query: same filters as list. |
| GET | `/audit-logs/stats` | Statistics. Query: `date_from`, `date_to` (default last 30 days). Response: `total_actions`, `by_severity` (severity→count), `daily_trends` (date→count), `recent_warnings` (latest 5 warning/error/critical with user), `actions_by_type`, `actions_by_user`. |

### Access Logs (Admin, HIPAA)

Requires `admin` ability. Tracks PHI access for compliance. See [Logging](logging.md#hipaa-access-logging), [Recipe: Add access logging](../ai/recipes/add-access-logging.md).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/access-logs` | List access logs (paginated). Query: `page`, `per_page`, `user_id`, `action`, `resource_type`, `date_from`, `date_to`. Response: Laravel pagination (`data`, `current_page`, `last_page`, `per_page`, `total`). |
| GET | `/access-logs/export` | Export as CSV. Query: same filters as list. |
| GET | `/access-logs/stats` | Statistics. Query: `date_from`, `date_to` (default last 30 days). Response: `total`, `by_action`, `by_resource_type`, `by_user`, `daily_trends`. |
| DELETE | `/access-logs` | Delete all access logs. **Only when HIPAA logging disabled** (Configuration > Log retention). Returns 422 if enabled. On success: `{ message, deleted_count }`. |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get all settings |
| PUT | `/settings` | Update settings |
| GET | `/settings/{group}` | Get settings by group |
| PUT | `/settings/{group}` | Update settings group |

### Mail Settings (Admin)

Settings are stored in the database with env fallback (see [ADR-014](../adr/014-database-settings-env-fallback.md)). Response/request keys use frontend names (e.g. `provider`, `host`, `port`); storage uses schema keys (e.g. `mailer`, `smtp_host`, `smtp_port`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/mail-settings` | Get mail settings (provider, host, port, from_address, etc.) |
| PUT | `/mail-settings` | Update mail settings (same keys as GET) |
| POST | `/mail-settings/test` | Send test email (body: `{ "to": "email@example.com" }`) |
| DELETE | `/mail-settings/keys/{key}` | Reset one setting to env default. `{key}` must be the **schema key** (e.g. `smtp_password`, `mailer`, `from_address`), not the frontend key. |

### Email Templates (Admin)

Requires `manage-settings` ability. Templates are stored in the database; default content is seeded from `EmailTemplateSeeder`. See [ADR-016: Email Template System](../adr/016-email-template-system.md) and [Recipe: Add Email Template](../ai/recipes/add-email-template.md).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/email-templates` | List all templates (key, name, description, is_system, is_active, updated_at) |
| GET | `/email-templates/{key}` | Get single template (full content: subject, body_html, body_text, variables, etc.) |
| PUT | `/email-templates/{key}` | Update template (body: optional subject, body_html, body_text, is_active) |
| POST | `/email-templates/{key}/preview` | Preview with variables. Body: optional `variables` (object); optional `subject`, `body_html`, `body_text` for live preview of unsaved content. Response: subject, html, text. |
| POST | `/email-templates/{key}/test` | Send test email. Body: optional `to` (email; defaults to current user). Returns 503 if email not configured. |
| POST | `/email-templates/{key}/reset` | Reset system template to default content (403 if not system template). |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread-count` | Get unread count |
| POST | `/notifications/mark-read` | Mark specific as read |
| POST | `/notifications/mark-all-read` | Mark all as read |
| DELETE | `/notifications/{id}` | Delete notification |
| POST | `/notifications/test/{channel}` | Send test notification |

### LLM/AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/llm/providers` | List available providers |
| GET | `/llm/config` | Get user LLM config |
| PUT | `/llm/config` | Update LLM config |
| POST | `/llm/test/{provider}` | Test provider connection |
| POST | `/llm/query` | Send text query |
| POST | `/llm/query/vision` | Send vision query |

**LLM Settings (Admin) – model discovery:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/llm-settings/test-key` | Validate API key (body: `provider`, `api_key?`, `host?`). Returns `{ valid, error? }`. |
| POST | `/llm-settings/discover-models` | Fetch available models (body: `provider`, `api_key?`, `host?`). Returns `{ models, provider }`. |

**Supported providers**: Claude (Anthropic), OpenAI, Gemini, Ollama, Azure OpenAI, AWS Bedrock. Model discovery supported for OpenAI, Claude, Gemini, Ollama.

**Operating modes**:
- `single` - Use one provider
- `aggregation` - Query all, primary synthesizes
- `council` - All providers vote, consensus resolution

### Backup & Restore (Admin)

Requires `manage-backups` ability. See [Backup & Restore documentation](../backup.md) for full context.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/backup` | List backups (response: `backups` array with `filename`, `size`, `created_at`) |
| POST | `/backup/create` | Create backup. Body (optional): `include_database`, `include_files`, `include_settings` (all default true). Response: `filename`, `size`, `manifest` |
| GET | `/backup/download/{filename}` | Download backup file (stream) |
| POST | `/backup/restore` | Restore. Body: either `{ "filename": "sourdough-backup-....zip" }` (restore from existing) or multipart form with backup file (restore from upload) |
| DELETE | `/backup/{filename}` | Delete a backup |

### Backup Settings (Admin)

Requires `manage-settings` ability. Backup configuration is stored in the database with env fallback ([ADR-014](../adr/014-database-settings-env-fallback.md)). Keys match the `backup` group in `backend/config/settings-schema.php` (e.g. `disk`, `retention_enabled`, `retention_days`, `schedule_enabled`, `s3_enabled`, `s3_bucket`, `s3_access_key_id`, `s3_secret_access_key`, …). Sensitive fields are encrypted at rest.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/backup-settings` | Get all backup settings (response: `settings` object) |
| PUT | `/backup-settings` | Update backup settings (body: subset of setting keys) |
| POST | `/backup-settings/reset/{key}` | Reset one setting to env default. `{key}` must be a schema key (e.g. `s3_bucket`, `retention_days`) |
| POST | `/backup-settings/test/{destination}` | Test connection. `{destination}`: `s3`, `sftp`, or `google_drive`. Uses currently saved settings. |

### Jobs / Scheduled Tasks (Admin)

Requires `admin` ability. Monitor scheduled tasks and run whitelisted commands manually. See [Features: Scheduled Jobs](../features.md#scheduled-jobs).

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs/scheduled` | List scheduled tasks. Response: `tasks` array with `command`, `schedule`, `description`, `triggerable`, `dangerous`, `last_run` (`{ at, status }` or null), `next_run`. Includes triggerable-only commands (e.g. `log:cleanup`) even if not in schedule. |
| POST | `/jobs/run/{command}` | Run a whitelisted command. Body (optional): `{ "options": { "--dry-run": true } }`. Allowed: `backup:run`, `log:cleanup`, `log:check-suspicious`. Response (200): `success`, `output`, `duration_ms`. Response (422 on failure): same keys. Rate limit: `backup:run` once per 5 minutes. Audited as `scheduled_command_run`. |
| GET | `/jobs/queue` | Queue status. Response: `pending`, `failed`, optional `queues` (queue name → count). |
| GET | `/jobs/failed` | List failed queue jobs (paginated). Query: `per_page`. Response: Laravel pagination. |
| POST | `/jobs/failed/{id}/retry` | Retry one failed job. |
| DELETE | `/jobs/failed/{id}` | Delete one failed job. |
| POST | `/jobs/failed/retry-all` | Retry all failed jobs. |
| DELETE | `/jobs/failed/clear` | Clear all failed jobs. |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/version` | Get app version |
| GET | `/health` | Health check |

## Request/Response Examples

### Register User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword",
    "password_confirmation": "securepassword"
  }'
```

Response:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": null,
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00.000000Z"
  },
  "message": "Registration successful"
}
```

### Send LLM Query

```bash
curl -X POST http://localhost:8080/api/llm/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "prompt": "Explain quantum computing",
    "mode": "single",
    "provider": "claude"
  }'
```

Response:
```json
{
  "success": true,
  "response": "Quantum computing is...",
  "provider": "claude",
  "model": "claude-sonnet-4-20250514",
  "mode": "single",
  "tokens": {
    "input": 15,
    "output": 250,
    "total": 265
  },
  "total_duration_ms": 2500
}
```

### Create Backup

```bash
curl -X POST http://localhost:8080/api/backup/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_token}" \
  -d '{
    "include_database": true,
    "include_files": true,
    "include_settings": true
  }'
```

Response:
```json
{
  "backup": {
    "filename": "sourdough-backup-2024-01-01_12-00-00.zip",
    "size": 1048576,
    "manifest": {
      "version": "2.0",
      "app_version": "0.1.0",
      "created_at": "2024-01-01T12:00:00.000000Z",
      "contents": {
        "database": true,
        "files": true,
        "settings": true
      }
    }
  }
}
```

## Error Responses

### Validation Error (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### Unauthorized (401)

```json
{
  "message": "Unauthenticated."
}
```

### Forbidden (403)

```json
{
  "message": "This action is unauthorized."
}
```

### Not Found (404)

```json
{
  "message": "Resource not found."
}
```

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General API**: 60 requests per minute
- **LLM queries**: 20 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Pagination

List endpoints support pagination:

```
GET /api/notifications?page=1&per_page=20
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 100
  }
}
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- **File**: [openapi.yaml](./openapi.yaml)
- **Swagger UI**: `/api/documentation` (if enabled)

Import the OpenAPI spec into tools like Postman, Insomnia, or Swagger UI for interactive documentation.

# Configure Novu Notification Infrastructure

Optional integration with [Novu](https://novu.co/) for multi-channel notifications, workflow orchestration, and the pre-built notification center UI.

## When to Use

- You want a single dashboard (Novu Cloud or self-hosted) to manage notification workflows.
- You want digest/batching, visual workflow editor, or the Novu React Inbox component.
- You are fine with an external dependency (Novu Cloud) or running Novu self-hosted.

When Novu is **not** configured, Sourdough uses its built-in notification system (see [ADR-005](../../adr/005-notification-system-architecture.md)).

## Configuration Steps

1. **Create a Novu account** (Cloud) or deploy [Novu self-hosted](https://docs.novu.co/community/self-hosting-novu/overview).
2. **Create an Application** in the Novu dashboard and note the **Application Identifier**.
3. **Create an API Key** (Settings → API Keys) and copy it.
4. In Sourdough: **Configuration → Novu**:
   - Enable Novu.
   - Paste **API Key** and **Application Identifier**.
   - For self-hosted: set **API URL** and **WebSocket URL** to your Novu instance.
5. **Test connection** (button on the same page).
6. **Create workflows** in the Novu dashboard for each notification type (see workflow map below).
7. **Sync subscribers**: run `php artisan novu:sync-subscribers` to push existing users to Novu (optional; users are also synced on login/register/update).

## Workflow Map

Sourdough triggers events by **workflow identifier**. Create workflows in Novu with these identifiers and wire channel steps (in-app, email, push, etc.) as needed.

| Notification type       | Novu workflow identifier |
|-------------------------|--------------------------|
| `backup.completed`      | `backup-completed`       |
| `backup.failed`         | `backup-failed`          |
| `auth.login`            | `auth-login`             |
| `auth.password_reset`   | `auth-password-reset`    |
| `system.update`         | `system-update`          |
| `llm.quota_warning`     | `llm-quota-warning`      |
| `storage.warning`       | `storage-warning`        |
| `storage.critical`       | `storage-critical`       |
| `suspicious_activity`   | `suspicious-activity`    |

Payload variables passed to workflows include `user` (name, email), `app_name`, and type-specific fields (e.g. `backup_name`, `error_message`). Define these in your Novu workflow templates.

## Artisan Commands

- `php artisan novu:sync-subscribers` — Sync all users to Novu as subscribers.
- `php artisan novu:test` — Test Novu connection.

## Related

- [ADR-025: Novu Notification Integration](../../adr/025-novu-notification-integration.md)
- [ADR-005: Notification System Architecture](../../adr/005-notification-system-architecture.md)

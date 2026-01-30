# Logging Standards

Application and console logging for Sourdough: backend structured logging, frontend error reporting, and configuration.

## When to Log (and What Level)

| Level | Use for |
|-------|--------|
| **debug** | Detailed flow (development only). Not typically used in application code. |
| **info** | Normal operations: backup created, email sent, LLM query completed, scheduled job finished. |
| **warning** | Recoverable issues: provider failed (others succeeded), password reset failed, backup restore started. |
| **error** | Failures: email send failed, backup failed, client error reported. |
| **critical** | Unrecoverable (reserved for severe system failures). |

Use **structured context** (arrays) with every log: include `user_id`, `provider`, `duration_ms`, `error` (message only), or other relevant identifiers. Do not log secrets, passwords, or full request bodies.

## Backend Logging

### Configuration

- **LOG_CHANNEL**: `stack` (default) – uses channels from LOG_STACK.
- **LOG_STACK**: Comma-separated channels, e.g. `single`, `daily`, or `single,json`.
- **LOG_LEVEL**: `debug` (development), `info` (staging), `warning` (production).
- **LOG_DAILY_DAYS**: Retention in days when using the `daily` channel (default 14).

Add `json` to LOG_STACK for JSON output to stderr (correlation_id, user_id, request_uri in each line). Use for production or containers with log aggregation.

### Structured Logging

All logs go through the default channel(s). The **ContextProcessor** adds to every log record:

- `correlation_id` – from `AddCorrelationId` middleware (or generated per request).
- `user_id` – when authenticated.
- `ip_address` – request IP.
- `request_uri` – request path.

Use the `Log` facade with a message and context array:

```php
use Illuminate\Support\Facades\Log;

Log::info('Backup created', ['filename' => $filename, 'size' => $size]);
Log::warning('LLM provider failed', ['provider' => $name, 'error' => $e->getMessage()]);
Log::error('Email send failed', ['user_id' => $user->id, 'error' => $e->getMessage()]);
```

### Log Rotation

Use the `daily` channel for file logging to get automatic rotation:

- Set `LOG_STACK=daily` or `LOG_STACK=daily,json`.
- Retention is controlled by `LOG_DAILY_DAYS` (default 14).

## Frontend Error Reporting

Use the **errorLogger** utility instead of `console.error` / `console.warn` for errors that should be visible in backend logs.

### errorLogger (frontend/lib/error-logger.ts)

- **report(error, context?)**: Report an `Error` (e.g. from catch or error boundary). Sends to `POST /api/client-errors` with stack and optional context.
- **captureMessage(message, level?, context?)**: Report a message at `info`, `warning`, or `error` (default `error`).

The API client stores `X-Correlation-ID` from response headers; error reports include it when available so backend logs can correlate client errors with requests.

### Error Boundary

The app is wrapped in an **ErrorBoundary** that reports React render errors via `errorLogger.report()` and shows a fallback UI. Global `window.onerror` and `unhandledrejection` are also reported via **ErrorHandlerSetup**.

### Usage

```ts
import { errorLogger } from "@/lib/error-logger";

try {
  await api.get("/something");
} catch (error) {
  errorLogger.report(
    error instanceof Error ? error : new Error("Something failed"),
    { source: "my-page" }
  );
}

errorLogger.captureMessage("No fields to update", "warning");
```

## Key Files

| Area | File |
|------|------|
| Backend config | `backend/config/logging.php` |
| Context (correlation_id, user_id, etc.) | `backend/app/Logging/ContextProcessor.php` |
| Correlation ID middleware | `backend/app/Http/Middleware/AddCorrelationId.php` |
| Client error API | `backend/app/Http/Controllers/Api/ClientErrorController.php` |
| Frontend logger | `frontend/lib/error-logger.ts` |
| Error boundary | `frontend/components/error-boundary.tsx` |
| Global handlers | `frontend/components/error-handler-setup.tsx` |

## Related

- [Audit Logging](plans/audit-logs-roadmap.md) – user actions (auth, settings, backup) are recorded in the audit log; application logging is for operational and diagnostic events.
- [Recipe: Extend Logging](ai/recipes/extend-logging.md) – how to add logging to new features.

# Recipe: Trigger Notifications

Step-by-step guide to send notifications from backend code using the NotificationOrchestrator.

## When to Use

- **User-facing events**: Backup completed, password reset, new login, quota warnings
- **System events**: Job failures, update available, storage limits
- **Multi-channel**: When the same event should go to in-app, email, Telegram, etc.

## Files to Modify

| File | Purpose |
|------|---------|
| Your service, controller, or job | Call the orchestrator |
| `backend/app/Services/Notifications/NotificationOrchestrator.php` | No change unless adding custom channel routing |

## Step 1: Inject the Orchestrator

```php
use App\Services\Notifications\NotificationOrchestrator;

class YourService
{
    public function __construct(
        private NotificationOrchestrator $orchestrator
    ) {}
}
```

In a controller, use method injection:

```php
public function someAction(NotificationOrchestrator $orchestrator): JsonResponse
{
    $orchestrator->send($user, 'info', 'Title', 'Message');
    // ...
}
```

## Step 2: Send a Notification

### Basic send (uses default channels from config)

```php
$this->orchestrator->send(
    $user,
    'info',           // type
    'Backup complete',
    'Your backup finished successfully.',
    ['backup_id' => $backup->id]  // optional data
);
```

### Specific channels only

```php
$this->orchestrator->send(
    $user,
    'warning',
    'Quota warning',
    'You have used 80% of your API quota.',
    ['usage' => 80],
    ['database', 'email']  // channels
);
```

### In-app only (no email/chat)

```php
$this->orchestrator->send(
    $user,
    'info',
    'Update available',
    'A new version is ready to install.',
    [],
    ['database']
);
```

## Step 3: Use Appropriate Types

| Type | Use case |
|------|----------|
| `info` | General updates, success messages |
| `warning` | Quota warnings, expiring data, recommended actions |
| `error` | Failures, security alerts |
| `test` | Reserved for “Send test” flows |

Use semantic types like `backup.completed`, `auth.password_reset`, `llm.quota_warning` when you want to filter or route later. The orchestrator accepts any string.

## Step 4: Add Triggers to Existing Code

### Example: Backup completed

```php
// In BackupService or wherever backup finishes
use App\Services\Notifications\NotificationOrchestrator;

public function __construct(
    private NotificationOrchestrator $notifications
) {}

public function afterBackupComplete(User $user, Backup $backup): void
{
    $this->notifications->send(
        $user,
        'backup.completed',
        'Backup complete',
        "Backup \"{$backup->name}\" finished successfully.",
        ['backup_id' => $backup->id]
    );
}
```

### Example: Password reset

```php
// In AuthController or password reset flow
$this->orchestrator->send(
    $user,
    'auth.password_reset',
    'Password reset',
    'Your password was changed. If this wasn’t you, contact support.',
    []
);
```

### Example: New login

```php
$this->orchestrator->send(
    $user,
    'auth.login',
    'New login',
    "New sign-in from {ip} at " . now()->toDateTimeString(),
    ['ip' => $request->ip()],
    ['database', 'email']
);
```

### Example: Queued job failure

```php
// In a job’s failed() method or failure listener
$this->orchestrator->send(
    $adminUser,
    'error',
    'Job failed',
    "Job \"{$this->job->name}\" failed: {$exception->getMessage()}",
    ['job_id' => $this->job->id],
    ['database', 'email']
);
```

## Step 5: In-App Only via createInAppNotification

When you only need the in-app feed (no other channels):

```php
$this->orchestrator->createInAppNotification(
    $user,
    'info',
    'Reminder',
    'Don’t forget to review pending items.',
    ['link' => '/tasks']
);
```

This writes to the `notifications` table and, when broadcasting is configured, emits real-time events. It does **not** send email, Telegram, etc.

## Checklist

- [ ] Orchestrator injected (constructor or method).
- [ ] `send($user, $type, $title, $message, $data, $channels?)` or `createInAppNotification(...)` used correctly.
- [ ] Type is semantic where useful (`backup.completed`, `auth.*`, etc.).
- [ ] Optional `data` used for links, IDs, or client-side routing.
- [ ] Channels omitted to use config defaults, or explicitly set when needed.

## Reference

- **Orchestrator**: `backend/app/Services/Notifications/NotificationOrchestrator.php`
- **Metadata trait**: `backend/app/Services/Notifications/NotificationChannelMetadata.php`
- **Channels**: `backend/app/Services/Notifications/Channels/`
- **Config**: `backend/config/notifications.php` (`default_channels`, etc.)
- **Admin API**: `backend/app/Http/Controllers/Api/NotificationChannelConfigController.php`
- **User API**: `backend/app/Http/Controllers/Api/UserNotificationSettingsController.php`
- **ADR**: [ADR-005: Notification System Architecture](../../adr/005-notification-system-architecture.md)
- **Add a new channel**: [Recipe: Add Notification Channel](add-notification-channel.md)

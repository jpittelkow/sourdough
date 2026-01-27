# Recipe: Add Notification Channel

Step-by-step guide to add a new notification delivery channel.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/Services/Notifications/Channels/{Name}Channel.php` | Create | Channel implementation |
| `backend/config/notifications.php` | Modify | Register channel |
| `backend/app/Services/Notifications/NotificationOrchestrator.php` | Modify | Add channel mapping (if needed) |
| `frontend/app/(dashboard)/settings/notifications/page.tsx` | Modify | Add configuration UI (if user-configurable) |

## Step 1: Create the Channel Class

```php
<?php
// backend/app/Services/Notifications/Channels/ExampleChannel.php

namespace App\Services\Notifications\Channels;

use App\Models\Notification;
use App\Services\Notifications\Contracts\NotificationChannelInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExampleChannel implements NotificationChannelInterface
{
    /**
     * Send a notification via this channel.
     */
    public function send(Notification $notification, array $config): bool
    {
        // Validate configuration
        if (!$this->validateConfig($config)) {
            Log::warning('ExampleChannel: Invalid configuration', [
                'notification_id' => $notification->id,
            ]);
            return false;
        }

        try {
            // Build the payload
            $payload = $this->buildPayload($notification, $config);

            // Send the request
            $response = Http::timeout(30)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $config['api_key'],
                    'Content-Type' => 'application/json',
                ])
                ->post($config['endpoint'], $payload);

            if ($response->successful()) {
                Log::info('ExampleChannel: Notification sent', [
                    'notification_id' => $notification->id,
                ]);
                return true;
            }

            Log::error('ExampleChannel: Send failed', [
                'notification_id' => $notification->id,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            return false;

        } catch (\Exception $e) {
            Log::error('ExampleChannel: Exception', [
                'notification_id' => $notification->id,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Validate the channel configuration.
     */
    public function validateConfig(array $config): bool
    {
        return isset($config['api_key'])
            && isset($config['endpoint'])
            && !empty($config['api_key'])
            && filter_var($config['endpoint'], FILTER_VALIDATE_URL);
    }

    /**
     * Get required configuration fields.
     */
    public function getRequiredConfig(): array
    {
        return [
            'api_key' => [
                'type' => 'password',
                'label' => 'API Key',
                'required' => true,
                'description' => 'Your Example service API key',
            ],
            'endpoint' => [
                'type' => 'url',
                'label' => 'Endpoint URL',
                'required' => true,
                'description' => 'The API endpoint to send notifications to',
            ],
            'channel_id' => [
                'type' => 'text',
                'label' => 'Channel ID',
                'required' => false,
                'description' => 'Optional channel or room identifier',
            ],
        ];
    }

    /**
     * Build the notification payload.
     */
    protected function buildPayload(Notification $notification, array $config): array
    {
        $payload = [
            'title' => $notification->title,
            'message' => $notification->message,
            'type' => $notification->type,
            'timestamp' => $notification->created_at->toISOString(),
        ];

        // Add optional channel ID
        if (!empty($config['channel_id'])) {
            $payload['channel'] = $config['channel_id'];
        }

        // Add any extra data
        if (!empty($notification->data)) {
            $payload['metadata'] = $notification->data;
        }

        return $payload;
    }
}
```

## Step 2: Register in Configuration

```php
// backend/config/notifications.php

return [
    'channels' => [
        'database' => [
            'class' => \App\Services\Notifications\Channels\DatabaseChannel::class,
            'enabled' => true,
        ],
        'email' => [
            'class' => \App\Services\Notifications\Channels\EmailChannel::class,
            'enabled' => env('NOTIFICATIONS_EMAIL_ENABLED', false),
        ],
        'telegram' => [
            'class' => \App\Services\Notifications\Channels\TelegramChannel::class,
            'enabled' => env('NOTIFICATIONS_TELEGRAM_ENABLED', false),
        ],
        // Add the new channel
        'example' => [
            'class' => \App\Services\Notifications\Channels\ExampleChannel::class,
            'enabled' => env('NOTIFICATIONS_EXAMPLE_ENABLED', false),
        ],
    ],

    // Default channels for different notification types
    'defaults' => [
        'info' => ['database'],
        'warning' => ['database', 'email'],
        'error' => ['database', 'email', 'example'],  // Add to defaults if appropriate
    ],
];
```

## Step 3: Add Environment Variables

```env
# .env.example (add these lines)

# Example Notification Channel
NOTIFICATIONS_EXAMPLE_ENABLED=false
NOTIFICATIONS_EXAMPLE_API_KEY=
NOTIFICATIONS_EXAMPLE_ENDPOINT=https://api.example.com/notify
```

## Step 4: Update Orchestrator (if custom routing needed)

```php
// backend/app/Services/Notifications/NotificationOrchestrator.php

// If you need custom logic for when this channel is used,
// update the getChannelsForNotification method:

protected function getChannelsForNotification(Notification $notification, User $user): array
{
    $channels = [];

    // Example: Always include example channel for critical notifications
    if ($notification->type === 'critical' && $this->isChannelEnabled('example')) {
        $channels[] = 'example';
    }

    // ... existing logic ...

    return $channels;
}
```

## Step 5: Add Frontend Configuration (if user-configurable)

```tsx
// frontend/app/(dashboard)/settings/notifications/page.tsx
// Add to the channel configuration section:

{/* Example Channel */}
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <CardTitle className="text-base">Example</CardTitle>
          <CardDescription>Send notifications to Example service</CardDescription>
        </div>
      </div>
      <Switch
        checked={settings.example_enabled}
        onCheckedChange={(checked) =>
          setSettings({ ...settings, example_enabled: checked })
        }
      />
    </div>
  </CardHeader>
  {settings.example_enabled && (
    <CardContent className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="example_api_key">API Key</Label>
        <Input
          id="example_api_key"
          type="password"
          value={settings.example_api_key}
          onChange={(e) =>
            setSettings({ ...settings, example_api_key: e.target.value })
          }
          placeholder="Enter your API key"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="example_channel_id">Channel ID (optional)</Label>
        <Input
          id="example_channel_id"
          value={settings.example_channel_id}
          onChange={(e) =>
            setSettings({ ...settings, example_channel_id: e.target.value })
          }
          placeholder="Enter channel or room ID"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => testChannel('example')}
        disabled={testing === 'example'}
      >
        {testing === 'example' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-2 h-4 w-4" />
        )}
        Send Test
      </Button>
    </CardContent>
  )}
</Card>
```

## Step 6: Add Test Endpoint (optional but recommended)

```php
// backend/app/Http/Controllers/Api/NotificationController.php

public function testChannel(Request $request): JsonResponse
{
    $validated = $request->validate([
        'channel' => 'required|string|in:email,telegram,discord,example',
        'config' => 'required|array',
    ]);

    $channelClass = config("notifications.channels.{$validated['channel']}.class");

    if (!$channelClass) {
        return response()->json(['message' => 'Invalid channel'], 400);
    }

    $channel = new $channelClass();

    // Create a test notification
    $notification = new Notification([
        'title' => 'Test Notification',
        'message' => 'This is a test notification from Sourdough.',
        'type' => 'info',
        'created_at' => now(),
    ]);

    $success = $channel->send($notification, $validated['config']);

    return response()->json([
        'success' => $success,
        'message' => $success ? 'Test sent successfully' : 'Test failed',
    ]);
}
```

## Checklist

- [ ] Channel class created implementing `NotificationChannelInterface`
- [ ] `send()` method implemented with proper error handling
- [ ] `validateConfig()` method validates required fields
- [ ] `getRequiredConfig()` returns field definitions
- [ ] Channel registered in `config/notifications.php`
- [ ] Environment variables added to `.env.example`
- [ ] Frontend configuration UI added (if user-configurable)
- [ ] Test endpoint working
- [ ] Logging added for debugging
- [ ] ADR reference: `docs/adr/005-notification-system-architecture.md`

## Channel Interface Reference

```php
interface NotificationChannelInterface
{
    /**
     * Send a notification through this channel.
     *
     * @param Notification $notification The notification to send
     * @param array $config Channel-specific configuration
     * @return bool True if sent successfully, false otherwise
     */
    public function send(Notification $notification, array $config): bool;

    /**
     * Validate the channel configuration.
     *
     * @param array $config Configuration to validate
     * @return bool True if valid, false otherwise
     */
    public function validateConfig(array $config): bool;

    /**
     * Get the required configuration fields for this channel.
     *
     * @return array Field definitions with type, label, required, description
     */
    public function getRequiredConfig(): array;
}
```

## Existing Channels for Reference

Look at these files for patterns:
- `backend/app/Services/Notifications/Channels/DatabaseChannel.php`
- `backend/app/Services/Notifications/Channels/EmailChannel.php`
- `backend/app/Services/Notifications/Channels/TelegramChannel.php`
- `backend/app/Services/Notifications/Channels/DiscordChannel.php`

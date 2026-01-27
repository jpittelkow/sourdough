# Recipe: Add Settings Page

Step-by-step guide to add a new settings page in the dashboard.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `frontend/app/(dashboard)/settings/{name}/page.tsx` | Create | Settings page UI |
| `frontend/app/(dashboard)/settings/layout.tsx` | Modify | Add to navigation |
| `backend/routes/api.php` | Modify | Add settings endpoint (if needed) |
| `backend/app/Http/Controllers/Api/SettingController.php` | Modify | Add methods (if needed) |

## Step 1: Create the Frontend Page

```tsx
// frontend/app/(dashboard)/settings/example/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ExampleSettings {
  enabled: boolean;
  mode: string;
  api_key: string;
  webhook_url: string;
}

const defaultSettings: ExampleSettings = {
  enabled: false,
  mode: 'basic',
  api_key: '',
  webhook_url: '',
};

export default function ExampleSettingsPage() {
  const [settings, setSettings] = useState<ExampleSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/settings/example');
      setSettings({ ...defaultSettings, ...response.data });
    } catch (err) {
      // Settings might not exist yet, use defaults
      console.log('Using default settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings/example', settings);
      toast.success('Settings saved successfully');
    } catch (err) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await api.post('/settings/example/test', settings);
      toast.success('Test successful!');
    } catch (err) {
      toast.error('Test failed');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Example Settings</h1>
        <p className="text-muted-foreground">
          Configure your example integration settings.
        </p>
      </div>

      {/* Enable/Disable Card */}
      <Card>
        <CardHeader>
          <CardTitle>Enable Integration</CardTitle>
          <CardDescription>
            Turn on example integration to enable features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enabled</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable the example integration.
              </p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, enabled: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Configuration Card */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure how the example integration works.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Select Field */}
          <div className="space-y-2">
            <Label htmlFor="mode">Mode</Label>
            <Select
              value={settings.mode}
              onValueChange={(value) =>
                setSettings({ ...settings, mode: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Choose the operation mode.
            </p>
          </div>

          {/* Password/Secret Field */}
          <div className="space-y-2">
            <Label htmlFor="api_key">API Key</Label>
            <Input
              id="api_key"
              type="password"
              value={settings.api_key}
              onChange={(e) =>
                setSettings({ ...settings, api_key: e.target.value })
              }
              placeholder="Enter your API key"
            />
            <p className="text-sm text-muted-foreground">
              Your API key for authentication.
            </p>
          </div>

          {/* URL Field */}
          <div className="space-y-2">
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              type="url"
              value={settings.webhook_url}
              onChange={(e) =>
                setSettings({ ...settings, webhook_url: e.target.value })
              }
              placeholder="https://example.com/webhook"
            />
            <p className="text-sm text-muted-foreground">
              The URL to send webhook events to.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={testing || !settings.enabled}
        >
          {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Test Connection
        </Button>
      </div>
    </div>
  );
}
```

## Step 2: Add to Settings Navigation

```tsx
// frontend/app/(dashboard)/settings/layout.tsx
// Find the nav items array and add:

const navItems = [
  { href: '/settings/general', label: 'General' },
  { href: '/settings/profile', label: 'Profile' },
  { href: '/settings/notifications', label: 'Notifications' },
  { href: '/settings/example', label: 'Example' },  // Add this line
];
```

## Step 3: Add Backend Endpoints (if storing new settings)

```php
// backend/routes/api.php

Route::middleware('auth:sanctum')->group(function () {
    // ... existing routes ...

    Route::prefix('settings')->group(function () {
        Route::get('/example', [SettingController::class, 'getExample']);
        Route::put('/example', [SettingController::class, 'updateExample']);
        Route::post('/example/test', [SettingController::class, 'testExample']);
    });
});
```

## Step 4: Add Controller Methods

```php
// backend/app/Http/Controllers/Api/SettingController.php

/**
 * Get example settings for the authenticated user.
 */
public function getExample(Request $request): JsonResponse
{
    $settings = Setting::where('user_id', $request->user()->id)
        ->where('group', 'example')
        ->pluck('value', 'key')
        ->toArray();

    return response()->json([
        'enabled' => (bool) ($settings['enabled'] ?? false),
        'mode' => $settings['mode'] ?? 'basic',
        'api_key' => $settings['api_key'] ?? '',
        'webhook_url' => $settings['webhook_url'] ?? '',
    ]);
}

/**
 * Update example settings.
 */
public function updateExample(Request $request): JsonResponse
{
    $validated = $request->validate([
        'enabled' => 'boolean',
        'mode' => 'in:basic,advanced,custom',
        'api_key' => 'nullable|string|max:255',
        'webhook_url' => 'nullable|url|max:255',
    ]);

    foreach ($validated as $key => $value) {
        Setting::updateOrCreate(
            [
                'user_id' => $request->user()->id,
                'group' => 'example',
                'key' => $key,
            ],
            ['value' => $value]
        );
    }

    return response()->json(['message' => 'Settings saved successfully.']);
}

/**
 * Test example integration.
 */
public function testExample(Request $request): JsonResponse
{
    $settings = $request->validate([
        'api_key' => 'required|string',
        'webhook_url' => 'required|url',
    ]);

    try {
        // Test the connection
        $response = Http::timeout(10)->post($settings['webhook_url'], [
            'test' => true,
        ]);

        if ($response->successful()) {
            return response()->json(['message' => 'Connection successful.']);
        }

        return response()->json(['message' => 'Connection failed.'], 400);
    } catch (\Exception $e) {
        return response()->json(['message' => 'Connection error: ' . $e->getMessage()], 400);
    }
}
```

## Checklist

- [ ] Page created at `frontend/app/(dashboard)/settings/{name}/page.tsx`
- [ ] Navigation updated in `frontend/app/(dashboard)/settings/layout.tsx`
- [ ] Loading state handled
- [ ] Error handling with toast notifications
- [ ] Backend endpoint created (if storing new data)
- [ ] Form validation on both frontend and backend
- [ ] Test functionality (if applicable)
- [ ] Responsive design verified

## Common Variations

### Admin-Only Settings Page

Place under `/admin/` instead of `/settings/`:

```tsx
// frontend/app/(dashboard)/admin/example/page.tsx
```

Add admin check in the page or use middleware.

### Settings with File Upload

```tsx
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    await api.post('/settings/example/upload', formData);
    toast.success('File uploaded');
  } catch (err) {
    toast.error('Upload failed');
  }
};
```

### Grouped Settings (Multiple Sections)

Use Tabs component:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="advanced">Advanced</TabsTrigger>
  </TabsList>
  <TabsContent value="general">
    {/* General settings */}
  </TabsContent>
  <TabsContent value="advanced">
    {/* Advanced settings */}
  </TabsContent>
</Tabs>
```

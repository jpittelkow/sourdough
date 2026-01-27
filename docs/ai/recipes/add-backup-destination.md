# Recipe: Add Backup Destination

Step-by-step guide to add a new backup storage destination.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `backend/app/Services/Backup/Destinations/{Name}Destination.php` | Create | Destination implementation |
| `backend/config/backup.php` | Modify | Register destination |
| `backend/.env.example` | Modify | Add environment variables |
| `frontend/app/(dashboard)/admin/backup/page.tsx` | Modify | Add configuration UI |

## Step 1: Create the Destination Class

```php
<?php
// backend/app/Services/Backup/Destinations/ExampleDestination.php

namespace App\Services\Backup\Destinations;

use App\Services\Backup\Contracts\BackupDestinationInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ExampleDestination implements BackupDestinationInterface
{
    protected string $bucket;
    protected string $accessKey;
    protected string $secretKey;
    protected string $region;
    protected string $endpoint;

    public function __construct()
    {
        $this->bucket = config('backup.destinations.example.bucket');
        $this->accessKey = config('backup.destinations.example.access_key');
        $this->secretKey = config('backup.destinations.example.secret_key');
        $this->region = config('backup.destinations.example.region', 'us-east-1');
        $this->endpoint = config('backup.destinations.example.endpoint');
    }

    /**
     * Upload a backup file to the destination.
     */
    public function upload(string $localPath, string $remotePath): bool
    {
        if (!$this->isConfigured()) {
            Log::error('ExampleDestination: Not configured');
            return false;
        }

        try {
            $disk = $this->getDisk();

            // Read the local file
            $contents = file_get_contents($localPath);

            if ($contents === false) {
                Log::error('ExampleDestination: Could not read local file', [
                    'path' => $localPath,
                ]);
                return false;
            }

            // Upload to remote
            $result = $disk->put($remotePath, $contents);

            if ($result) {
                Log::info('ExampleDestination: Upload successful', [
                    'remote_path' => $remotePath,
                    'size' => filesize($localPath),
                ]);
            }

            return $result;

        } catch (\Exception $e) {
            Log::error('ExampleDestination: Upload failed', [
                'error' => $e->getMessage(),
                'local_path' => $localPath,
                'remote_path' => $remotePath,
            ]);
            return false;
        }
    }

    /**
     * Download a backup file from the destination.
     */
    public function download(string $remotePath, string $localPath): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $disk = $this->getDisk();

            if (!$disk->exists($remotePath)) {
                Log::error('ExampleDestination: Remote file not found', [
                    'path' => $remotePath,
                ]);
                return false;
            }

            $contents = $disk->get($remotePath);
            $result = file_put_contents($localPath, $contents);

            return $result !== false;

        } catch (\Exception $e) {
            Log::error('ExampleDestination: Download failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Delete a backup file from the destination.
     */
    public function delete(string $remotePath): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            return $this->getDisk()->delete($remotePath);
        } catch (\Exception $e) {
            Log::error('ExampleDestination: Delete failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * List backup files at the destination.
     */
    public function list(string $directory = ''): array
    {
        if (!$this->isConfigured()) {
            return [];
        }

        try {
            $disk = $this->getDisk();
            $files = $disk->files($directory);

            return array_map(function ($file) use ($disk) {
                return [
                    'path' => $file,
                    'size' => $disk->size($file),
                    'last_modified' => $disk->lastModified($file),
                ];
            }, $files);

        } catch (\Exception $e) {
            Log::error('ExampleDestination: List failed', [
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Check if the destination is properly configured.
     */
    public function isConfigured(): bool
    {
        return !empty($this->bucket)
            && !empty($this->accessKey)
            && !empty($this->secretKey);
    }

    /**
     * Test the connection to the destination.
     */
    public function testConnection(): bool
    {
        if (!$this->isConfigured()) {
            return false;
        }

        try {
            $disk = $this->getDisk();

            // Try to list files to verify connection
            $disk->files('');

            return true;
        } catch (\Exception $e) {
            Log::error('ExampleDestination: Connection test failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Get the destination identifier.
     */
    public function getName(): string
    {
        return 'example';
    }

    /**
     * Get a configured storage disk for this destination.
     */
    protected function getDisk(): \Illuminate\Contracts\Filesystem\Filesystem
    {
        // Configure a temporary disk for this destination
        config([
            'filesystems.disks.backup_example' => [
                'driver' => 's3',
                'key' => $this->accessKey,
                'secret' => $this->secretKey,
                'region' => $this->region,
                'bucket' => $this->bucket,
                'endpoint' => $this->endpoint,
                'use_path_style_endpoint' => true,
            ],
        ]);

        return Storage::disk('backup_example');
    }
}
```

## Step 2: Register in Configuration

```php
// backend/config/backup.php

return [
    // Default destination
    'default' => env('BACKUP_DESTINATION', 'local'),

    // Backup retention (days)
    'retention_days' => env('BACKUP_RETENTION_DAYS', 30),

    // What to include in backups
    'include' => [
        'database' => true,
        'uploads' => true,
        'config' => false,
    ],

    'destinations' => [
        'local' => [
            'class' => \App\Services\Backup\Destinations\LocalDestination::class,
            'path' => storage_path('backups'),
            'enabled' => true,
        ],

        's3' => [
            'class' => \App\Services\Backup\Destinations\S3Destination::class,
            'bucket' => env('BACKUP_S3_BUCKET'),
            'region' => env('BACKUP_S3_REGION', 'us-east-1'),
            'access_key' => env('BACKUP_S3_ACCESS_KEY'),
            'secret_key' => env('BACKUP_S3_SECRET_KEY'),
            'enabled' => env('BACKUP_S3_ENABLED', false),
        ],

        // Add the new destination
        'example' => [
            'class' => \App\Services\Backup\Destinations\ExampleDestination::class,
            'bucket' => env('BACKUP_EXAMPLE_BUCKET'),
            'access_key' => env('BACKUP_EXAMPLE_ACCESS_KEY'),
            'secret_key' => env('BACKUP_EXAMPLE_SECRET_KEY'),
            'region' => env('BACKUP_EXAMPLE_REGION', 'us-east-1'),
            'endpoint' => env('BACKUP_EXAMPLE_ENDPOINT'),
            'enabled' => env('BACKUP_EXAMPLE_ENABLED', false),
        ],
    ],

    // Schedule settings
    'schedule' => [
        'enabled' => env('BACKUP_SCHEDULE_ENABLED', false),
        'frequency' => env('BACKUP_SCHEDULE_FREQUENCY', 'daily'), // daily, weekly, monthly
        'time' => env('BACKUP_SCHEDULE_TIME', '02:00'),
    ],
];
```

## Step 3: Add Environment Variables

```env
# .env.example

# Example Backup Destination (S3-compatible)
BACKUP_EXAMPLE_ENABLED=false
BACKUP_EXAMPLE_BUCKET=my-backups
BACKUP_EXAMPLE_ACCESS_KEY=
BACKUP_EXAMPLE_SECRET_KEY=
BACKUP_EXAMPLE_REGION=us-east-1
BACKUP_EXAMPLE_ENDPOINT=https://storage.example.com
```

## Step 4: Add Frontend Configuration

```tsx
// frontend/app/(dashboard)/admin/backup/page.tsx
// Add to the destination configuration section:

{/* Example Destination */}
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
          <Cloud className="h-5 w-5 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <CardTitle className="text-base">Example Storage</CardTitle>
          <CardDescription>S3-compatible object storage</CardDescription>
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
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="example_bucket">Bucket Name</Label>
          <Input
            id="example_bucket"
            value={settings.example_bucket}
            onChange={(e) =>
              setSettings({ ...settings, example_bucket: e.target.value })
            }
            placeholder="my-backups"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="example_region">Region</Label>
          <Input
            id="example_region"
            value={settings.example_region}
            onChange={(e) =>
              setSettings({ ...settings, example_region: e.target.value })
            }
            placeholder="us-east-1"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="example_endpoint">Endpoint URL</Label>
        <Input
          id="example_endpoint"
          type="url"
          value={settings.example_endpoint}
          onChange={(e) =>
            setSettings({ ...settings, example_endpoint: e.target.value })
          }
          placeholder="https://storage.example.com"
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="example_access_key">Access Key</Label>
          <Input
            id="example_access_key"
            value={settings.example_access_key}
            onChange={(e) =>
              setSettings({ ...settings, example_access_key: e.target.value })
            }
            placeholder="Access key ID"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="example_secret_key">Secret Key</Label>
          <Input
            id="example_secret_key"
            type="password"
            value={settings.example_secret_key}
            onChange={(e) =>
              setSettings({ ...settings, example_secret_key: e.target.value })
            }
            placeholder="Secret access key"
          />
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => testDestination('example')}
        disabled={testing === 'example'}
      >
        {testing === 'example' ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="mr-2 h-4 w-4" />
        )}
        Test Connection
      </Button>
    </CardContent>
  )}
</Card>
```

## Destination Interface Reference

```php
interface BackupDestinationInterface
{
    /**
     * Upload a backup file to the destination.
     */
    public function upload(string $localPath, string $remotePath): bool;

    /**
     * Download a backup file from the destination.
     */
    public function download(string $remotePath, string $localPath): bool;

    /**
     * Delete a backup file from the destination.
     */
    public function delete(string $remotePath): bool;

    /**
     * List backup files at the destination.
     */
    public function list(string $directory = ''): array;

    /**
     * Check if the destination is properly configured.
     */
    public function isConfigured(): bool;

    /**
     * Test the connection to the destination.
     */
    public function testConnection(): bool;

    /**
     * Get the destination identifier name.
     */
    public function getName(): string;
}
```

## Checklist

- [ ] Destination class created implementing `BackupDestinationInterface`
- [ ] `upload()`, `download()`, `delete()`, `list()` methods implemented
- [ ] `isConfigured()` validates required settings
- [ ] `testConnection()` verifies connectivity
- [ ] Error handling and logging implemented
- [ ] Destination registered in `config/backup.php`
- [ ] Environment variables added to `.env.example`
- [ ] Frontend configuration UI added
- [ ] Connection test functionality working
- [ ] ADR reference: `docs/adr/007-backup-system-design.md`

## Existing Destinations for Reference

Look at these files for patterns:
- `backend/app/Services/Backup/Destinations/LocalDestination.php`
- `backend/app/Services/Backup/Destinations/S3Destination.php`
- `backend/app/Services/Backup/Destinations/SFTPDestination.php`

## Common Destination Types

### SFTP/SSH

```php
// Use phpseclib for SFTP
use phpseclib3\Net\SFTP;

protected function getConnection(): SFTP
{
    $sftp = new SFTP($this->host, $this->port);

    if (!$sftp->login($this->username, $this->password)) {
        throw new \Exception('SFTP login failed');
    }

    return $sftp;
}
```

### WebDAV

```php
// Use sabre/dav client
use Sabre\DAV\Client;

protected function getClient(): Client
{
    return new Client([
        'baseUri' => $this->endpoint,
        'userName' => $this->username,
        'password' => $this->password,
    ]);
}
```

### Backblaze B2

```php
// B2 is S3-compatible, use the S3 driver with B2 endpoint
'endpoint' => 's3.us-west-000.backblazeb2.com',
'use_path_style_endpoint' => true,
```

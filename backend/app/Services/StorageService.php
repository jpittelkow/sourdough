<?php

namespace App\Services;

use App\Models\SystemSetting;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StorageService
{
    public const PROVIDERS = [
        'local' => ['label' => 'Local Filesystem', 'driver' => 'local'],
        's3' => ['label' => 'Amazon S3', 'driver' => 's3'],
        'gcs' => ['label' => 'Google Cloud Storage', 'driver' => 'gcs'],
        'azure' => ['label' => 'Azure Blob Storage', 'driver' => 'azure'],
        'do_spaces' => ['label' => 'DigitalOcean Spaces', 'driver' => 's3'],
        'minio' => ['label' => 'MinIO', 'driver' => 's3'],
        'b2' => ['label' => 'Backblaze B2', 'driver' => 's3'],
    ];

    /**
     * Get provider-specific settings from the storage group.
     */
    public function getProviderConfig(string $provider): array
    {
        $all = SystemSetting::getGroup('storage');
        $prefix = $this->getSettingPrefix($provider);

        if ($prefix === null) {
            return $all;
        }

        $config = [];
        foreach ($all as $key => $value) {
            if ($key === 'driver' || $key === 'max_upload_size' || $key === 'allowed_file_types') {
                $config[$key] = $value;
            } elseif (Str::startsWith($key, $prefix)) {
                $config[Str::after($key, $prefix)] = $value;
            }
        }

        return $config;
    }

    /**
     * List all supported providers with metadata.
     */
    public function getAvailableProviders(): array
    {
        return collect(self::PROVIDERS)->map(function ($meta, $id) {
            return array_merge(['id' => $id], $meta);
        })->values()->all();
    }

    /**
     * Test connectivity for a provider with the given config.
     * Config keys should match request/DB (e.g. s3_bucket, gcs_bucket, etc.).
     */
    public function testConnection(string $provider, array $config): array
    {
        try {
            if ($provider === 'local') {
                return ['success' => true];
            }

            $diskConfig = $this->buildDiskConfig($provider, $config);
            if ($diskConfig === null) {
                return ['success' => false, 'error' => 'Unsupported provider or missing configuration.'];
            }

            $diskName = 'storage-test-'.Str::random(8);
            Config::set("filesystems.disks.{$diskName}", $diskConfig);

            $disk = Storage::disk($diskName);

            $testPath = '.sourdough-storage-test-'.Str::random(8);
            $disk->put($testPath, 'test');
            $disk->delete($testPath);

            Config::set("filesystems.disks.{$diskName}", null);

            return ['success' => true];
        } catch (\Throwable $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Build Laravel disk config array for a provider from flat config (DB/request).
     */
    public function buildDiskConfig(string $provider, array $config): ?array
    {
        $meta = self::PROVIDERS[$provider] ?? null;
        if ($meta === null) {
            return null;
        }

        $driver = $meta['driver'];

        if ($driver === 'local') {
            return [
                'driver' => 'local',
                'root' => storage_path('app'),
                'throw' => false,
            ];
        }

        if ($driver === 's3') {
            $key = $this->getConfigKey($config, $provider, 'key', 's3_key', 'key');
            $secret = $this->getConfigKey($config, $provider, 'secret', 's3_secret', 'secret');
            $bucket = $this->getConfigKey($config, $provider, 'bucket', 's3_bucket', 'bucket');
            $region = $this->getConfigKey($config, $provider, 'region', 's3_region', 'region');

            $diskConfig = [
                'driver' => 's3',
                'key' => $key,
                'secret' => $secret,
                'region' => $region ?? 'us-east-1',
                'bucket' => $bucket,
                'throw' => false,
            ];

            if ($provider === 'do_spaces') {
                $diskConfig['endpoint'] = $config['do_spaces_endpoint'] ?? $config['endpoint'] ?? 'https://'.$region.'.digitaloceanspaces.com';
                $diskConfig['use_path_style_endpoint'] = false;
            } elseif ($provider === 'minio') {
                $diskConfig['endpoint'] = $config['minio_endpoint'] ?? $config['endpoint'] ?? '';
                $diskConfig['use_path_style_endpoint'] = true;
            } elseif ($provider === 'b2') {
                $keyId = $config['b2_key_id'] ?? $config['key_id'] ?? $key;
                $diskConfig['key'] = $keyId;
                $diskConfig['secret'] = $config['b2_application_key'] ?? $config['application_key'] ?? $secret;
                $diskConfig['endpoint'] = $config['b2_endpoint'] ?? 'https://s3.'.($region ?? 'us-west-002').'.backblazeb2.com';
                $diskConfig['use_path_style_endpoint'] = false;
            }

            return $diskConfig;
        }

        if ($driver === 'gcs') {
            $bucket = $config['gcs_bucket'] ?? $config['bucket'] ?? '';
            $projectId = $config['gcs_project_id'] ?? $config['project_id'] ?? '';
            $credentials = $config['gcs_credentials_json'] ?? $config['credentials_json'] ?? $config['credentials'] ?? [];

            if (is_string($credentials)) {
                $decoded = json_decode($credentials, true);
                $credentials = is_array($decoded) ? $decoded : [];
            }

            return [
                'driver' => 'gcs',
                'project_id' => $projectId,
                'bucket' => $bucket,
                'key_file_path' => null,
                'credentials' => $credentials,
                'throw' => false,
            ];
        }

        if ($driver === 'azure') {
            $connectionString = $config['azure_connection_string'] ?? $config['connection_string'] ?? '';
            $container = $config['azure_container'] ?? $config['container'] ?? '';

            return [
                'driver' => 'azure',
                'connection_string' => $connectionString,
                'container' => $container,
                'throw' => false,
            ];
        }

        return null;
    }

    /**
     * Get the default disk for file manager operations.
     */
    public function getDisk(): \Illuminate\Contracts\Filesystem\Filesystem
    {
        return Storage::disk(config('filesystems.default'));
    }

    /**
     * List files and directories in a path with pagination.
     *
     * @return array{items: array<int, array{name: string, path: string, size: int|null, mimeType: string|null, lastModified: int|null, isDirectory: bool}>, total: int}
     */
    public function listFiles(string $path = '', int $page = 1, int $perPage = 50): array
    {
        $disk = $this->getDisk();
        $path = $this->normalizePath($path);

        $directories = $disk->directories($path);
        $files = $disk->files($path);

        $items = [];
        foreach ($directories as $dir) {
            $name = basename($dir);
            $items[] = [
                'name' => $name,
                'path' => $dir,
                'size' => null,
                'mimeType' => null,
                'lastModified' => $this->getLastModified($disk, $dir),
                'isDirectory' => true,
            ];
        }
        foreach ($files as $filePath) {
            $name = basename($filePath);
            $items[] = [
                'name' => $name,
                'path' => $filePath,
                'size' => $disk->size($filePath),
                'mimeType' => $this->getMimeType($disk, $filePath),
                'lastModified' => $disk->lastModified($filePath),
                'isDirectory' => false,
            ];
        }

        usort($items, function ($a, $b) {
            if ($a['isDirectory'] !== $b['isDirectory']) {
                return $a['isDirectory'] ? -1 : 1;
            }
            return strcasecmp($a['name'], $b['name']);
        });

        $total = count($items);
        $offset = ($page - 1) * $perPage;
        $items = array_slice($items, $offset, $perPage);

        return ['items' => $items, 'total' => $total];
    }

    /**
     * Get file or directory metadata.
     */
    public function getFileInfo(string $path): ?array
    {
        $disk = $this->getDisk();
        $path = $this->normalizePath($path);

        if ($disk->exists($path)) {
            $isDir = $disk->directoryExists($path);
            return [
                'name' => basename($path),
                'path' => $path,
                'size' => $isDir ? null : $disk->size($path),
                'mimeType' => $isDir ? null : $this->getMimeType($disk, $path),
                'lastModified' => $this->getLastModified($disk, $path),
                'isDirectory' => $isDir,
            ];
        }

        return null;
    }

    /**
     * Upload a file to the given path.
     *
     * @return array{path: string, name: string, size: int}
     */
    public function uploadFile(UploadedFile $file, string $path): array
    {
        $disk = $this->getDisk();
        $path = $this->normalizePath($path);
        $filename = $file->getClientOriginalName();
        $targetPath = $path === '' ? $filename : $path . '/' . $filename;

        $disk->put($targetPath, File::get($file->getRealPath()));

        return [
            'path' => $targetPath,
            'name' => $filename,
            'size' => $file->getSize(),
        ];
    }

    /**
     * Delete a file or directory (recursive).
     */
    public function deleteFile(string $path): bool
    {
        $disk = $this->getDisk();
        $path = $this->normalizePath($path);

        if ($disk->directoryExists($path)) {
            return $disk->deleteDirectory($path);
        }

        return $disk->delete($path);
    }

    /**
     * Rename a file or directory.
     */
    public function renameFile(string $oldPath, string $newName): bool
    {
        $disk = $this->getDisk();
        $oldPath = $this->normalizePath($oldPath);
        $parent = dirname($oldPath);
        $newPath = ($parent === '.' || $parent === '') ? $newName : $parent . '/' . $newName;

        if ($oldPath === $newPath) {
            return true;
        }

        if ($disk->directoryExists($oldPath)) {
            $disk->makeDirectory($newPath);
            $this->moveDirectoryContents($disk, $oldPath, $newPath);
            return $disk->deleteDirectory($oldPath);
        }

        return $disk->move($oldPath, $newPath);
    }

    /**
     * Move a file or directory to a new path.
     */
    public function moveFile(string $from, string $to): bool
    {
        $disk = $this->getDisk();
        $from = $this->normalizePath($from);
        $to = $this->normalizePath($to);
        $name = basename($from);
        $destinationPath = ($to === '' || $to === '.') ? $name : rtrim($to, '/') . '/' . $name;

        if ($from === $destinationPath) {
            return true;
        }

        if ($disk->directoryExists($from)) {
            $disk->makeDirectory($destinationPath);
            $this->moveDirectoryContents($disk, $from, $destinationPath);
            return $disk->deleteDirectory($from);
        }

        return $disk->move($from, $destinationPath);
    }

    /**
     * Stream a file for download.
     */
    public function downloadFile(string $path): StreamedResponse
    {
        $disk = $this->getDisk();
        $path = $this->normalizePath($path);

        if ($disk->directoryExists($path)) {
            throw new \InvalidArgumentException('Cannot download a directory.');
        }

        if (! $disk->exists($path)) {
            throw new \Illuminate\Contracts\Filesystem\FileNotFoundException($path);
        }

        return $disk->download($path, basename($path));
    }

    /**
     * Get a temporary URL for preview (cloud) or null for local.
     */
    public function getPreviewUrl(string $path): ?string
    {
        $disk = $this->getDisk();
        $path = $this->normalizePath($path);

        if ($disk->directoryExists($path) || ! $disk->exists($path)) {
            return null;
        }

        try {
            if (method_exists($disk, 'temporaryUrl')) {
                return $disk->temporaryUrl($path, now()->addMinutes(5));
            }
        } catch (\Throwable $e) {
            // Fall through
        }

        return null;
    }

    private function normalizePath(string $path): string
    {
        $path = trim($path, '/');
        return $path === '' ? '' : $path;
    }

    private function getLastModified(\Illuminate\Contracts\Filesystem\Filesystem $disk, string $path): ?int
    {
        try {
            return $disk->lastModified($path);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function getMimeType(\Illuminate\Contracts\Filesystem\Filesystem $disk, string $path): ?string
    {
        try {
            if (method_exists($disk, 'mimeType')) {
                return $disk->mimeType($path);
            }
            $fullPath = method_exists($disk, 'path') ? $disk->path($path) : null;
            if ($fullPath && is_file($fullPath)) {
                return File::mimeType($fullPath);
            }
        } catch (\Throwable $e) {
            // Fall through
        }
        return null;
    }

    private function moveDirectoryContents(\Illuminate\Contracts\Filesystem\Filesystem $disk, string $from, string $to): void
    {
        $files = $disk->files($from);
        foreach ($files as $file) {
            $disk->move($file, $to . '/' . basename($file));
        }
        $dirs = $disk->directories($from);
        foreach ($dirs as $dir) {
            $dirName = basename($dir);
            $disk->makeDirectory($to . '/' . $dirName);
            $this->moveDirectoryContents($disk, $dir, $to . '/' . $dirName);
            $disk->deleteDirectory($dir);
        }
    }

    private function getSettingPrefix(string $provider): ?string
    {
        $prefixes = [
            's3' => 's3_',
            'gcs' => 'gcs_',
            'azure' => 'azure_',
            'do_spaces' => 'do_spaces_',
            'minio' => 'minio_',
            'b2' => 'b2_',
        ];

        return $prefixes[$provider] ?? null;
    }

    private function getConfigKey(array $config, string $provider, string ...$keys): mixed
    {
        $prefixes = [$provider.'_', ''];
        foreach ($keys as $key) {
            foreach ($prefixes as $prefix) {
                $k = $prefix.$key;
                if (array_key_exists($k, $config)) {
                    return $config[$k];
                }
            }
        }

        return null;
    }
}

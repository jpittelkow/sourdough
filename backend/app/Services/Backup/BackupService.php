<?php

namespace App\Services\Backup;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\UploadedFile;
use Symfony\Component\HttpFoundation\StreamedResponse;
use ZipArchive;

class BackupService
{
    private string $disk;

    public function __construct()
    {
        $this->disk = config('backup.disk', 'backups');
    }

    /**
     * List all available backups.
     */
    public function listBackups(): array
    {
        $files = Storage::disk($this->disk)->files();

        return collect($files)
            ->filter(fn ($file) => str_ends_with($file, '.zip'))
            ->map(fn ($file) => [
                'filename' => $file,
                'size' => Storage::disk($this->disk)->size($file),
                'created_at' => date('Y-m-d H:i:s', Storage::disk($this->disk)->lastModified($file)),
            ])
            ->sortByDesc('created_at')
            ->values()
            ->all();
    }

    /**
     * Create a new backup.
     */
    public function create(array $options = []): array
    {
        $includeDatabase = $options['include_database'] ?? true;
        $includeFiles = $options['include_files'] ?? true;
        $includeSettings = $options['include_settings'] ?? true;

        Log::info('Backup started', [
            'include_database' => $includeDatabase,
            'include_files' => $includeFiles,
            'include_settings' => $includeSettings,
        ]);

        $timestamp = now()->format('Y-m-d_H-i-s');
        $filename = "sourdough-backup-{$timestamp}.zip";
        $tempPath = storage_path("app/temp/{$filename}");

        // Ensure temp directory exists
        if (!is_dir(dirname($tempPath))) {
            mkdir(dirname($tempPath), 0755, true);
        }

        $zip = new ZipArchive();
        if ($zip->open($tempPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            throw new \RuntimeException('Failed to create backup archive');
        }

        // Create manifest
        $manifest = [
            'version' => config('backup.format_version', '2.0'),
            'app_version' => config('version.version'),
            'created_at' => now()->toISOString(),
            'contents' => [],
        ];

        // Backup database
        if ($includeDatabase) {
            $dbBackup = $this->backupDatabase();
            $zip->addFromString('database.sql', $dbBackup);
            $manifest['contents']['database'] = true;
        }

        // Backup files
        if ($includeFiles) {
            $this->addFilesToZip($zip, storage_path('app/public'), 'files/');
            $manifest['contents']['files'] = true;
        }

        // Backup settings (from database)
        if ($includeSettings) {
            $settings = $this->exportSettings();
            $zip->addFromString('settings.json', json_encode($settings, JSON_PRETTY_PRINT));
            $manifest['contents']['settings'] = true;
        }

        // Add manifest
        $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT));

        $zip->close();

        // Move to backup disk
        $content = file_get_contents($tempPath);
        Storage::disk($this->disk)->put($filename, $content);
        unlink($tempPath);

        Log::info('Backup created', [
            'filename' => $filename,
            'size' => strlen($content),
        ]);

        return [
            'filename' => $filename,
            'size' => strlen($content),
            'manifest' => $manifest,
        ];
    }

    /**
     * Check if backup exists.
     */
    public function exists(string $filename): bool
    {
        return Storage::disk($this->disk)->exists($filename);
    }

    /**
     * Download a backup file.
     */
    public function download(string $filename): StreamedResponse
    {
        return Storage::disk($this->disk)->download($filename);
    }

    /**
     * Restore from uploaded file.
     */
    public function restoreFromUpload(UploadedFile $file): array
    {
        Log::warning('Backup restore started (upload)', ['filename' => $file->getClientOriginalName()]);

        $tempPath = $file->storeAs('temp', 'restore-upload.zip', 'local');
        $fullPath = storage_path("app/{$tempPath}");

        try {
            $result = $this->performRestore($fullPath);
            unlink($fullPath);
            Log::warning('Backup restore completed (upload)', ['restored' => array_keys($result['restored'] ?? [])]);
            return $result;
        } catch (\Exception $e) {
            unlink($fullPath);
            Log::error('Backup restore failed', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Restore from existing backup file.
     */
    public function restoreFromFile(string $filename): array
    {
        Log::warning('Backup restore started (file)', ['filename' => $filename]);

        $tempPath = storage_path('app/temp/restore.zip');

        // Copy from backup disk to temp
        $content = Storage::disk($this->disk)->get($filename);
        file_put_contents($tempPath, $content);

        try {
            $result = $this->performRestore($tempPath);
            unlink($tempPath);
            Log::warning('Backup restore completed (file)', ['filename' => $filename, 'restored' => array_keys($result['restored'] ?? [])]);
            return $result;
        } catch (\Exception $e) {
            unlink($tempPath);
            Log::error('Backup restore failed', ['filename' => $filename, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Delete a backup.
     */
    public function delete(string $filename): void
    {
        Storage::disk($this->disk)->delete($filename);
    }

    /**
     * Perform the actual restore.
     */
    private function performRestore(string $zipPath): array
    {
        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            throw new \RuntimeException('Failed to open backup archive');
        }

        // Read manifest
        $manifestContent = $zip->getFromName('manifest.json');
        if (!$manifestContent) {
            throw new \RuntimeException('Invalid backup: missing manifest');
        }

        $manifest = json_decode($manifestContent, true);

        // Validate version
        $version = $manifest['version'] ?? '1.0';
        if (version_compare($version, config('backup.format_version'), '>')) {
            throw new \RuntimeException('Backup version is newer than supported');
        }

        $result = [
            'manifest' => $manifest,
            'restored' => [],
        ];

        DB::beginTransaction();

        try {
            // Restore database
            if ($zip->locateName('database.sql') !== false) {
                $sql = $zip->getFromName('database.sql');
                $this->restoreDatabase($sql);
                $result['restored']['database'] = true;
            }

            // Restore settings
            if ($zip->locateName('settings.json') !== false) {
                $settings = json_decode($zip->getFromName('settings.json'), true);
                $this->importSettings($settings);
                $result['restored']['settings'] = true;
            }

            // Restore files
            if (isset($manifest['contents']['files']) && $manifest['contents']['files']) {
                $this->extractFiles($zip, storage_path('app/public'));
                $result['restored']['files'] = true;
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Backup restore failed during performRestore', ['error' => $e->getMessage()]);
            throw $e;
        }

        $zip->close();

        return $result;
    }

    /**
     * Backup the database.
     */
    private function backupDatabase(): string
    {
        $connection = config('database.default');

        if ($connection === 'sqlite') {
            $dbPath = config('database.connections.sqlite.database');
            return file_get_contents($dbPath);
        }

        // For MySQL/PostgreSQL, would need to use mysqldump/pg_dump
        // For now, export as SQL statements
        return $this->exportTablesAsSQL();
    }

    /**
     * Export tables as SQL.
     */
    private function exportTablesAsSQL(): string
    {
        $sql = "";
        $tables = ['users', 'settings', 'notifications', 'social_accounts', 'ai_providers'];
        $connection = DB::connection();
        $pdo = $connection->getPdo();

        foreach ($tables as $table) {
            try {
                $rows = DB::table($table)->get();
                foreach ($rows as $row) {
                    $rowArray = (array) $row;
                    $columns = implode(', ', array_map(fn ($col) => "`{$col}`", array_keys($rowArray)));
                    $values = collect($rowArray)
                        ->map(fn ($v) => $v === null ? 'NULL' : $pdo->quote((string) $v))
                        ->implode(', ');
                    $sql .= "INSERT INTO `{$table}` ({$columns}) VALUES ({$values});\n";
                }
            } catch (\Exception $e) {
                // Table might not exist yet
            }
        }

        return $sql;
    }

    /**
     * Restore the database.
     */
    private function restoreDatabase(string $content): void
    {
        $connection = config('database.default');

        if ($connection === 'sqlite') {
            // For SQLite, replace the database file
            $dbPath = config('database.connections.sqlite.database');
            file_put_contents($dbPath, $content);
            return;
        }

        // For SQL statements, only allow INSERT statements for safety
        $statements = array_filter(explode(";\n", $content));
        $allowedTables = ['users', 'settings', 'notifications', 'social_accounts', 'ai_providers'];
        $allowedPattern = '/^\s*INSERT\s+INTO\s+`?(' . implode('|', $allowedTables) . ')`?\s+/i';

        foreach ($statements as $statement) {
            $statement = trim($statement);
            if (empty($statement)) {
                continue;
            }

            // Validate that the statement is a safe INSERT into an allowed table
            if (!preg_match($allowedPattern, $statement)) {
                throw new \RuntimeException('Invalid SQL statement in backup: only INSERT statements to known tables are allowed');
            }

            DB::unprepared($statement);
        }
    }

    /**
     * Export settings.
     * Note: API keys are intentionally excluded for security.
     * Users must re-enter API keys after restoring from backup.
     */
    private function exportSettings(): array
    {
        return [
            'users' => \App\Models\User::all()->toArray(),
            'settings' => \App\Models\Setting::all()->toArray(),
            'ai_providers' => \App\Models\AIProvider::all()
                ->map(function ($provider) {
                    $data = $provider->toArray();
                    // Exclude API key from backup for security
                    unset($data['api_key']);
                    // Mark that the API key needs to be reconfigured
                    $data['api_key_required'] = true;
                    return $data;
                })
                ->toArray(),
        ];
    }

    /**
     * Import settings.
     */
    private function importSettings(array $settings): void
    {
        // This is a simplified import - in production you'd want ID mapping
        if (isset($settings['settings'])) {
            foreach ($settings['settings'] as $setting) {
                \App\Models\Setting::updateOrCreate(
                    ['user_id' => $setting['user_id'], 'key' => $setting['key']],
                    $setting
                );
            }
        }
    }

    /**
     * Add directory to zip.
     */
    private function addFilesToZip(ZipArchive $zip, string $sourcePath, string $zipPath): void
    {
        if (!is_dir($sourcePath)) {
            return;
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($sourcePath),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );

        foreach ($files as $file) {
            if (!$file->isDir()) {
                $filePath = $file->getRealPath();
                $relativePath = $zipPath . substr($filePath, strlen($sourcePath) + 1);
                $zip->addFile($filePath, $relativePath);
            }
        }
    }

    /**
     * Extract files from zip.
     */
    private function extractFiles(ZipArchive $zip, string $targetPath): void
    {
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (str_starts_with($name, 'files/')) {
                $relativePath = substr($name, 6);
                if ($relativePath) {
                    $targetFile = $targetPath . '/' . $relativePath;
                    $targetDir = dirname($targetFile);

                    if (!is_dir($targetDir)) {
                        mkdir($targetDir, 0755, true);
                    }

                    file_put_contents($targetFile, $zip->getFromIndex($i));
                }
            }
        }
    }
}

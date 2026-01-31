# Storage Settings Enhancement Roadmap

**Priority**: MEDIUM  
**Dependencies**: None  
**Related**: [Backup Settings](../ai/context-loading.md), Filesystems Configuration

---

## Overview

Enhance storage settings to provide better visibility into file storage, support additional cloud providers, and enable in-app file management.

### Current State

The storage settings page currently supports:
- Local and S3 storage drivers
- Basic S3 configuration (bucket, region, credentials)
- Max upload size and allowed file types
- Storage statistics (total size, file count)

### Goals

1. **Transparency**: Show users exactly where files are stored and provide path information
2. **Provider Flexibility**: Support additional cloud storage providers beyond S3
3. **File Management**: Provide an in-app file browser/manager for viewing and managing stored files
4. **Usage Insights**: Enhanced storage analytics and breakdown by category

---

## Phase 1: Local Storage Transparency ✅ COMPLETE

Show users where files are stored locally and provide storage path information.

### Tasks

- [x] Display local storage paths in the UI:
  - Application files: `storage/app`
  - Public files: `storage/app/public`
  - Backups: `storage/app/backups`
  - Cache: `storage/framework/cache`
  - Sessions: `storage/framework/sessions`
  - Logs: `storage/logs`
- [x] Add storage health check (permissions, disk space)
- [x] Show disk usage breakdown by directory
- [x] Display configured storage driver prominently
- [x] Add info cards explaining each storage location's purpose

### Backend Changes

- [x] Create `GET /storage-settings/paths` endpoint returning storage locations
- [x] Create `GET /storage-settings/health` endpoint for storage health status
- [x] Add storage breakdown by directory to stats endpoint

---

## Phase 2: Additional Storage Providers ✅ COMPLETE

Expand beyond S3 to support other popular cloud storage options.

### Providers Added

- [x] **Google Cloud Storage (GCS)**
  - Service account JSON key authentication
  - Bucket and project configuration
  
- [x] **Azure Blob Storage**
  - Connection string authentication
  - Container configuration
  
- [x] **DigitalOcean Spaces**
  - S3-compatible API (similar config to S3)
  - Region and endpoint configuration
  
- [x] **MinIO** (self-hosted S3-compatible)
  - Endpoint URL configuration
  - Access key authentication
  
- [x] **Backblaze B2**
  - Application key authentication
  - Bucket and region configuration

### Backend Changes

- [x] Add flysystem adapters for GCS and Azure; S3 adapter for DO Spaces, MinIO, B2
- [x] Create provider-specific validation rules in StorageSettingController
- [x] Add connection test endpoint `POST /storage-settings/test`
- [x] Provider credentials stored in database (storage group)

### Frontend Changes

- [x] Add provider selection dropdown with icons
- [x] Dynamic form fields based on selected provider
- [x] Connection test button with status indicator
- [x] Provider-specific form labels and placeholders

---

## Phase 3: File Manager ✅ COMPLETE

In-app file browser for viewing and managing stored files.

### Core Features

- [x] **File Browser UI**
  - Tree/list view of storage directories
  - Breadcrumb navigation
  - File/folder icons based on type
  - Sortable columns (name, size, date)
  
- [x] **File Operations**
  - View file details (size, modified date, path)
  - Download files
  - Delete files (with confirmation)
  - Rename files
  - Move files between directories
  
- [x] **Upload Functionality**
  - Drag-and-drop upload
  - Progress indicator
  - Respect max size and allowed types settings
  
- [x] **Preview Support**
  - Image thumbnails/preview
  - PDF preview
  - Text file content preview

### Backend Changes

- [x] Create `GET /storage/files` endpoint (paginated directory listing)
- [x] Create `GET /storage/files/{path}` endpoint (file details)
- [x] Create `DELETE /storage/files/{path}` endpoint
- [x] Create `POST /storage/files` endpoint (upload)
- [x] Create `PUT /storage/files/{path}/move` endpoint
- [x] Create `PUT /storage/files/{path}/rename` endpoint
- [x] Create `GET /storage/files/{path}/download` endpoint
- [x] Audit logging for all file operations (file.uploaded, file.downloaded, file.deleted, file.renamed, file.moved)

### Security Considerations

- [x] Admin-only access to file manager (`can:admin` middleware)
- [x] Path traversal protection (FilePathRequest validation)
- [x] Audit logging for all file operations
- [x] Prevent access to sensitive directories (e.g., `.env`, config, .git, bootstrap, vendor)

---

## Phase 4: Enhanced Analytics & Monitoring

Improved visibility into storage usage and trends.

### Features

- [ ] **Storage Dashboard**
  - Visual breakdown by file type (pie/donut chart)
  - Storage usage over time (line chart)
  - Top 10 largest files
  - Recently modified files
  
- [ ] **Alerts & Thresholds**
  - Configurable storage usage thresholds
  - Warning when approaching limits
  - Email notifications for storage alerts
  
- [ ] **Cleanup Tools**
  - Identify orphaned files
  - Find duplicate files
  - Suggest files for archival based on age
  - One-click cleanup for temp/cache files

### Backend Changes

- [ ] Add storage metrics collection (scheduled job)
- [ ] Create storage analytics endpoints
- [ ] Add alert threshold settings
- [ ] Create cleanup suggestion endpoint

---

## Key Files

### Current Implementation

- `backend/app/Services/StorageService.php` - Provider config, testConnection, buildDiskConfig
- `backend/app/Http/Controllers/Api/StorageSettingController.php` - Settings, paths, health, stats, test API
- `backend/config/filesystems.php` - Filesystem disk configuration (local, s3, gcs, azure, do_spaces, minio, b2)
- `frontend/app/(dashboard)/configuration/storage/page.tsx` - Storage settings UI (driver dropdown, dynamic forms, Test Connection)
- `frontend/components/provider-icons.tsx` - Storage provider icons (s3, gdrive, azure, do_spaces, minio, b2)

**Recipes:** [Add storage provider](../ai/recipes/add-storage-provider.md). **Patterns:** [Storage Settings pattern](../ai/patterns.md#storage-settings-pattern).

### To Be Created

- `frontend/app/(dashboard)/configuration/storage/file-manager/page.tsx` - File manager UI
- `frontend/components/storage/file-browser.tsx` - File browser component
- `frontend/components/storage/upload-dialog.tsx` - Upload modal
- `backend/app/Http/Controllers/FileManagerController.php` - File operations API
- `backend/app/Services/StorageService.php` - Storage abstraction service

---

## Success Criteria

- [x] Users can see exactly where files are stored locally
- [x] At least 3 additional cloud providers supported
- [x] File manager allows browsing and basic operations
- [ ] Storage analytics provide actionable insights (Phase 4)
- [x] All file operations are audit logged

---

## Notes

- File manager should be admin-only by default
- Consider adding per-user storage quotas in future
- WebSocket support for real-time upload progress could enhance UX
- Consider integrating with backup system for "backup to cloud" functionality

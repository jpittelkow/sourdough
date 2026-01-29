# API Reference

REST API documentation:

- [API Documentation](api/README.md) - Complete API reference with endpoints, authentication, examples
- [OpenAPI Specification](api/openapi.yaml) - OpenAPI 3.0 spec for API tooling integration

The REST API is available at `/api`. Key endpoints:

```
Authentication:
  POST   /api/auth/register
  POST   /api/auth/login
  POST   /api/auth/logout
  GET    /api/auth/user

Profile:
  GET    /api/profile
  PUT    /api/profile
  PUT    /api/profile/password

Settings:
  GET    /api/settings
  PUT    /api/settings

Notifications:
  GET    /api/notifications
  POST   /api/notifications/mark-read

LLM:
  GET    /api/llm/providers
  POST   /api/llm/query
  POST   /api/llm/query/vision

Backup (Admin):
  GET    /api/backup                      List backups
  POST   /api/backup/create               Create backup (body: include_database, include_files, include_settings)
  GET    /api/backup/download/{filename}  Download backup file
  POST   /api/backup/restore              Restore (body: filename or multipart backup file)
  DELETE /api/backup/{filename}           Delete backup

Backup Settings (Admin):
  GET    /api/backup-settings             Get all backup settings
  PUT    /api/backup-settings             Update backup settings
  POST   /api/backup-settings/reset/{key} Reset one setting to env default
  POST   /api/backup-settings/test/{dest} Test connection (dest: s3, sftp, google_drive)

Full backup API and developer docs: [Backup & Restore](backup.md), [API README – Backup](api/README.md#backup--restore-admin).

Version:
  GET    /api/version
```

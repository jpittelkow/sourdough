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
  GET    /api/backup
  POST   /api/backup/create
  POST   /api/backup/restore

Version:
  GET    /api/version
```

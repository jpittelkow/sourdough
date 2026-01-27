# Sourdough API Documentation

This document provides an overview of the Sourdough REST API. For complete API specification, see [openapi.yaml](./openapi.yaml).

## Base URL

- **Development**: `http://localhost:8080/api`
- **Production**: `https://your-domain.com/api`

## Authentication

Sourdough uses Laravel Sanctum for session-based authentication. Include credentials with every request:

```javascript
const response = await fetch('/api/auth/user', {
  credentials: 'include',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login with email/password |
| POST | `/auth/logout` | Logout current user |
| GET | `/auth/user` | Get current user |
| POST | `/auth/forgot-password` | Request password reset |
| POST | `/auth/reset-password` | Reset password with token |
| POST | `/auth/verify-email` | Verify email address |
| POST | `/auth/resend-verification` | Resend verification email |

### Single Sign-On (SSO)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/sso/providers` | List available SSO providers |
| GET | `/auth/sso/{provider}` | Redirect to SSO provider |
| GET | `/auth/callback/{provider}` | SSO callback handler |
| POST | `/auth/sso/{provider}/link` | Link SSO to existing account |
| DELETE | `/auth/sso/{provider}/unlink` | Unlink SSO provider |

**Supported providers**: Google, GitHub, Microsoft, Apple, Discord, GitLab, Generic OIDC

### Two-Factor Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/2fa/status` | Get 2FA status |
| POST | `/auth/2fa/enable` | Start 2FA setup |
| POST | `/auth/2fa/confirm` | Confirm 2FA with TOTP code |
| POST | `/auth/2fa/disable` | Disable 2FA |
| POST | `/auth/2fa/verify` | Verify 2FA during login |
| GET | `/auth/2fa/recovery-codes` | Get recovery codes |
| POST | `/auth/2fa/recovery-codes/regenerate` | Regenerate recovery codes |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get user profile |
| PUT | `/profile` | Update profile |
| PUT | `/profile/password` | Update password |
| DELETE | `/profile` | Delete account |

### Settings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/settings` | Get all settings |
| PUT | `/settings` | Update settings |
| GET | `/settings/{group}` | Get settings by group |
| PUT | `/settings/{group}` | Update settings group |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications` | List notifications |
| GET | `/notifications/unread-count` | Get unread count |
| POST | `/notifications/mark-read` | Mark specific as read |
| POST | `/notifications/mark-all-read` | Mark all as read |
| DELETE | `/notifications/{id}` | Delete notification |
| POST | `/notifications/test/{channel}` | Send test notification |

### LLM/AI

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/llm/providers` | List available providers |
| GET | `/llm/config` | Get user LLM config |
| PUT | `/llm/config` | Update LLM config |
| POST | `/llm/test/{provider}` | Test provider connection |
| POST | `/llm/query` | Send text query |
| POST | `/llm/query/vision` | Send vision query |

**Supported providers**: Claude (Anthropic), OpenAI, Gemini, Ollama, Azure OpenAI, AWS Bedrock

**Operating modes**:
- `single` - Use one provider
- `aggregation` - Query all, primary synthesizes
- `council` - All providers vote, consensus resolution

### Backup & Restore (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/backup` | List backups |
| POST | `/backup/create` | Create backup |
| GET | `/backup/download/{filename}` | Download backup |
| POST | `/backup/restore` | Restore from backup |
| DELETE | `/backup/{filename}` | Delete backup |

### System

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/version` | Get app version |
| GET | `/health` | Health check |

## Request/Response Examples

### Register User

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword",
    "password_confirmation": "securepassword"
  }'
```

Response:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": null,
    "is_admin": false,
    "created_at": "2024-01-01T00:00:00.000000Z"
  },
  "message": "Registration successful"
}
```

### Send LLM Query

```bash
curl -X POST http://localhost:8080/api/llm/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "prompt": "Explain quantum computing",
    "mode": "single",
    "provider": "claude"
  }'
```

Response:
```json
{
  "success": true,
  "response": "Quantum computing is...",
  "provider": "claude",
  "model": "claude-sonnet-4-20250514",
  "mode": "single",
  "tokens": {
    "input": 15,
    "output": 250,
    "total": 265
  },
  "total_duration_ms": 2500
}
```

### Create Backup

```bash
curl -X POST http://localhost:8080/api/backup/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_token}" \
  -d '{
    "include_database": true,
    "include_files": true,
    "include_settings": true
  }'
```

Response:
```json
{
  "backup": {
    "filename": "sourdough-backup-2024-01-01_12-00-00.zip",
    "size": 1048576,
    "manifest": {
      "version": "2.0",
      "app_version": "0.1.0",
      "created_at": "2024-01-01T12:00:00.000000Z",
      "contents": {
        "database": true,
        "files": true,
        "settings": true
      }
    }
  }
}
```

## Error Responses

### Validation Error (422)

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

### Unauthorized (401)

```json
{
  "message": "Unauthenticated."
}
```

### Forbidden (403)

```json
{
  "message": "This action is unauthorized."
}
```

### Not Found (404)

```json
{
  "message": "Resource not found."
}
```

## Rate Limiting

API requests are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **General API**: 60 requests per minute
- **LLM queries**: 20 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Pagination

List endpoints support pagination:

```
GET /api/notifications?page=1&per_page=20
```

Response includes pagination metadata:

```json
{
  "data": [...],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 20,
    "total": 100
  }
}
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- **File**: [openapi.yaml](./openapi.yaml)
- **Swagger UI**: `/api/documentation` (if enabled)

Import the OpenAPI spec into tools like Postman, Insomnia, or Swagger UI for interactive documentation.

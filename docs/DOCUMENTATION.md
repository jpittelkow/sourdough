# Sourdough Documentation

Welcome to the Sourdough documentation. This starter application framework for AI to develop other apps provides enterprise-grade features for building applications.

## Quick Links

- [README](../README.md) - Project overview and quick start
- [Architecture Decision Records](./adr/) - Design decisions and rationale
- [API Documentation](./api/) - REST API reference
- [User Guide](./user/) - End-user documentation
- [Developer Guide](./dev/) - Contributing and extending

## Architecture Overview

Sourdough uses a decoupled architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Single Docker Container                   │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Nginx      │───▶│  Next.js     │    │  PHP-FPM     │  │
│  │   (Proxy)    │    │  Frontend    │    │  Laravel API │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                        │          │
│         └────────────────┬───────────────────────┘          │
│                          ▼                                   │
│                  ┌──────────────┐                           │
│                  │   SQLite     │                           │
│                  │   Database   │                           │
│                  └──────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

## Core Features

### User Management

- Email/password authentication with Laravel Sanctum
- SSO via OAuth2/OIDC (Google, GitHub, Microsoft, Apple, Discord, GitLab)
- Two-factor authentication (TOTP + recovery codes)
- Password reset and email verification
- All features optional for self-hosted deployments

### Notification System

Multi-channel notification delivery:

| Channel | Provider | Status |
|---------|----------|--------|
| Email | SMTP, Mailgun, SendGrid, SES, Postmark | ✅ |
| Telegram | Bot API | ✅ |
| Discord | Webhooks | ✅ |
| Slack | Webhooks | ✅ |
| SMS | Twilio, Vonage | ✅ |
| Signal | signal-cli | 🔄 |
| Push | Web Push, FCM | 🔄 |
| In-App | Database + WebSocket | ✅ |

### AI/LLM Orchestration

Multi-provider LLM support with three operating modes:

1. **Single Mode** - Direct query to one provider
2. **Aggregation Mode** - Query all, primary synthesizes
3. **Council Mode** - All providers vote, consensus resolution

Supported providers:
- Claude (Anthropic)
- OpenAI (GPT-4, GPT-4o)
- Gemini (Google)
- Ollama (local/self-hosted)
- AWS Bedrock
- Azure OpenAI

### Backup & Restore

- ZIP-based backup format with manifest
- Database backup (SQLite copy, MySQL/PG dump)
- File backup (all uploaded files)
- Configuration backup (encrypted settings)
- Scheduled automatic backups
- Remote backup destinations (S3, SFTP)

## Configuration

Sourdough is configured via environment variables. See `.env.example` for all options.

### Required Variables

| Variable | Description |
|----------|-------------|
| `APP_KEY` | Encryption key (auto-generated) |
| `APP_URL` | Backend URL |
| `FRONTEND_URL` | Frontend URL |

### Optional Features

Enable features by setting their configuration:

```env
# Enable Google SSO
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret

# Enable Claude AI
ANTHROPIC_API_KEY=your-key

# Enable Telegram notifications
TELEGRAM_BOT_TOKEN=your-token
```

## API Reference

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

## Development

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for frontend development)
- PHP 8.3+ and Composer (for backend development)

### Local Setup

```bash
# Clone
git clone https://github.com/yourusername/sourdough.git
cd sourdough

# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
php artisan serve

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Docker Setup

```bash
# Copy environment file and configure port
cp .env.example .env

# Edit .env to change port (default is 8080)
# APP_PORT=8081  # Use a different port if needed

docker-compose up -d
# Access at http://localhost:8080 (or your configured port)
```

#### Running Multiple Instances

If you're running multiple apps, change the port and container name in `.env`:

```env
APP_PORT=8081
CONTAINER_NAME=sourdough-project-name
```

## Versioning

Sourdough follows [Semantic Versioning](https://semver.org/):

- **MAJOR** - Breaking changes
- **MINOR** - New features (backwards compatible)
- **PATCH** - Bug fixes

Current version is stored in the `VERSION` file and accessible via `/api/version`.

## Architecture Decision Records

All significant architectural decisions are documented in ADRs:

| ADR | Title |
|-----|-------|
| [001](./adr/001-technology-stack.md) | Technology Stack |
| [002](./adr/002-authentication-architecture.md) | Authentication Architecture |
| [003](./adr/003-sso-provider-integration.md) | SSO Provider Integration |
| [004](./adr/004-two-factor-authentication.md) | Two-Factor Authentication |
| [005](./adr/005-notification-system-architecture.md) | Notification System Architecture |
| [006](./adr/006-llm-orchestration-modes.md) | LLM Orchestration Modes |
| [007](./adr/007-backup-system-design.md) | Backup System Design |
| [008](./adr/008-testing-strategy.md) | Testing Strategy |
| [009](./adr/009-docker-single-container.md) | Docker Single-Container Architecture |
| [010](./adr/010-database-abstraction.md) | Database Abstraction Strategy |
| [011](./adr/011-global-navigation-architecture.md) | Global Navigation Architecture |
| [012](./adr/012-admin-only-settings.md) | Admin-Only Settings Access |

## License

MIT License - see [LICENSE](../LICENSE) for details.

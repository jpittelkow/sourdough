# Docker Configuration

Single-container deployment configuration.

## Quick Start (Local Development)

```bash
cp .env.example .env
docker-compose up -d
# Access at http://localhost:8080
```

See [Local Docker Development Rule](../.cursor/rules/local-docker-development.mdc) for complete commands and troubleshooting.

## Key Commands

| Command | Purpose |
|---------|---------|
| `docker-compose up -d` | Start container |
| `docker-compose down` | Stop container |
| `docker-compose up -d --build` | Rebuild and start |
| `docker-compose logs -f` | View logs |
| `docker-compose exec app bash` | Shell access |

## Configuration Files

- [ADR-009: Docker Single-Container Architecture](adr/009-docker-single-container.md) - Architecture decision and rationale
- `docker/Dockerfile` - Main container build configuration
- `docker/supervisord.conf` - Process manager configuration (Nginx, PHP-FPM, Next.js)
- `docker/nginx.conf` - Nginx reverse proxy configuration
- `docker/php.ini` - PHP runtime configuration (production)
- `docker/php-dev.ini` - PHP runtime configuration (development, with file change detection)
- `docker/entrypoint.sh` - Container initialization script
- `docker/start-nextjs.sh` - Next.js startup script
- `docker-compose.yml` - Development Docker Compose configuration
- `docker-compose.prod.yml` - Production Docker Compose configuration

## Hot Reload / File Change Detection

**Backend (PHP/Laravel):** Development uses `docker/php-dev.ini` which enables `opcache.validate_timestamps=1` so PHP detects file changes immediately.

**Frontend (Next.js):** Development mode runs `npm run dev` with hot module replacement. The entrypoint clears any production build markers to ensure dev mode.

### Windows File Watching

Docker on Windows (via WSL2/Hyper-V) doesn't reliably propagate filesystem events to containers. The project is configured with:

1. **Webpack polling** in `frontend/next.config.js` - Checks for file changes every second
2. **WATCHPACK_POLLING=true** in `docker-compose.yml` - Enables watchpack polling mode

If changes still aren't detected, clear the Next.js cache volume:

```bash
docker-compose down
docker volume rm sourdough_frontend_next_cache
docker-compose up -d
```

## Environment Variables

Edit `.env` to configure:

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_PORT` | `8080` | Host port |
| `CONTAINER_NAME` | `sourdough-dev` | Container name |

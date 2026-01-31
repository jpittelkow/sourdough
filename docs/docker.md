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
- `docker/supervisord.conf` - Process manager configuration (Nginx, PHP-FPM, Next.js, Meilisearch)
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

### Permission issues after npm build

If you run `npm run build` or `npm install` inside the container (e.g. `docker-compose exec app npm --prefix /var/www/html/frontend run build`), those commands run as root and create root-owned files. The Next.js process runs as `www-data`, so you may see **EACCES** on `.next/server/*` and 500 errors. Fix ownership:

```bash
docker-compose exec app chown -R www-data:www-data /var/www/html/frontend/.next
```

See [Local Docker Development](../.cursor/rules/local-docker-development.mdc) for full troubleshooting.

## Environment Variables

Edit `.env` to configure:

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_PORT` | `8080` | Host port |
| `CONTAINER_NAME` | `sourdough-dev` | Container name |

## Meilisearch (Search Engine)

Meilisearch runs inside the main app container, managed by Supervisor alongside Nginx, PHP-FPM, and Next.js. It listens on `127.0.0.1:7700` and persists data to the `meilisearch_data` volume at `/var/lib/meilisearch`. The Docker image uses Debian (not Alpine) because Meilisearch binaries require glibc.

**Verification commands:**

| Command | Purpose |
|---------|---------|
| `docker-compose exec app curl -f http://127.0.0.1:7700/health` | Check Meilisearch health (from inside app container) |
| `docker-compose exec app php /var/www/html/backend/artisan search:reindex` | Rebuild search indexes |
| `docker-compose logs -f app` | View app logs (includes Meilisearch output) |

| Variable | Default | Purpose |
|----------|---------|---------|
| `MEILI_MASTER_KEY` | (dev: masterKey) | API key; required in production |

### Search box not working

If the search box (Cmd+K or header search) shows errors or no results:

1. **Hard refresh** the browser (Ctrl+Shift+R or Cmd+Shift+R) to clear cached JavaScript.
2. **Reindex** search: `docker-compose exec app php /var/www/html/backend/artisan search:reindex`
3. **Verify Meilisearch** is running: `docker-compose exec app curl -f http://127.0.0.1:7700/health`
4. Ensure you are **logged in**; the search API requires authentication.

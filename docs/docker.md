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

## NAS Deployment (Unraid, Synology, TrueNAS)

When deploying on NAS systems using their Docker GUI (not docker-compose), you must manually configure environment variables and volume mappings.

### Required Environment Variables

These variables are set automatically by `docker-compose.prod.yml` but **must be added manually** in NAS Docker templates:

| Variable | Required Value | Notes |
|----------|----------------|-------|
| `DB_DATABASE` | `/var/www/html/data/database.sqlite` | **Critical** - Without this, migrations write to a non-persistent location |
| `DB_CONNECTION` | `sqlite` | Database driver |
| `APP_KEY` | `base64:...` | Generate with `php artisan key:generate --show` |
| `APP_ENV` | `production` | Environment mode |
| `APP_URL` | `http://your-nas-ip:port` | Your access URL |
| `FRONTEND_URL` | `http://your-nas-ip:port` | Same as APP_URL |
| `MEILI_MASTER_KEY` | (random string) | Search engine API key |

### Required Volume Mappings

| Container Path | Host Path Example | Purpose |
|----------------|-------------------|---------|
| `/var/www/html/data` | `/mnt/user/appdata/sourdough/data` | SQLite database |
| `/var/www/html/backend/storage/app` | `/mnt/user/appdata/sourdough/storage` | File uploads, backups |
| `/var/lib/meilisearch` | `/mnt/user/appdata/sourdough/meilisearch` | Search index |

### Permission Configuration (PUID/PGID)

NAS systems often use specific user/group IDs. Set these to match your host volume ownership:

| Variable | Unraid Default | Synology Default | Purpose |
|----------|----------------|------------------|---------|
| `PUID` | `99` | `1000` | User ID for www-data |
| `PGID` | `100` | `1000` | Group ID for www-data |

**Finding your IDs:** On Unraid, `nobody:users` is typically `99:100`. On Synology, check with `id your-username`.

### Unraid Template Example

In Unraid's Docker tab, add these variables:

```
APP_KEY=base64:YourGeneratedKeyHere
APP_ENV=production
APP_URL=http://192.168.1.100:8080
FRONTEND_URL=http://192.168.1.100:8080
DB_CONNECTION=sqlite
DB_DATABASE=/var/www/html/data/database.sqlite
MEILI_MASTER_KEY=YourRandomSecretKey
PUID=99
PGID=100
```

### Troubleshooting NAS Deployments

**"attempt to write a readonly database" error:**
- Ensure `DB_DATABASE=/var/www/html/data/database.sqlite` is set as an environment variable
- Check volume permissions: `ls -la /mnt/user/appdata/sourdough/data/`
- Verify PUID/PGID match host directory ownership

**Meilisearch "Permission denied" errors:**
- This was a known issue caused by Supervisor's `user=` directive not setting HOME properly
- Fixed in the supervisor config by using `su` to properly set up the user environment
- If you're running an older image, rebuild: `docker-compose up -d --build`
- For NAS volume permission issues: `chmod -R 775 /path/to/meilisearch && chown -R PUID:PGID /path/to/meilisearch`

**Migrations run but database is empty (0 bytes):**
- This means `DB_DATABASE` isn't set - Laravel is using the default path
- Add `DB_DATABASE=/var/www/html/data/database.sqlite` to environment variables
- Restart the container

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

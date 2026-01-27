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
- `docker/php.ini` - PHP runtime configuration
- `docker/entrypoint.sh` - Container initialization script
- `docker/start-nextjs.sh` - Next.js startup script
- `docker-compose.yml` - Development Docker Compose configuration
- `docker-compose.prod.yml` - Production Docker Compose configuration

## Environment Variables

Edit `.env` to configure:

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_PORT` | `8080` | Host port |
| `CONTAINER_NAME` | `sourdough-dev` | Container name |

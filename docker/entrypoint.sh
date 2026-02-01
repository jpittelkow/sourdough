#!/bin/sh
set -e

echo "=== Sourdough Container Starting ==="
echo "Version: ${APP_VERSION:-unknown}"
echo "Build: ${APP_BUILD_SHA:-development}"

# Directory paths
BACKEND_DIR="/var/www/html/backend"
FRONTEND_DIR="/var/www/html/frontend"
DATA_DIR="/var/www/html/data"
DB_PATH="${DATA_DIR}/database.sqlite"

# Restore migrations if they were overwritten by volume mount
if [ -d "/var/www/migrations-backup" ]; then
    echo "Syncing migrations from backup..."
    cp -r /var/www/migrations-backup/* ${BACKEND_DIR}/database/migrations/ 2>/dev/null || true
fi

# Create .next directory for development mode (volume mount overwrites built .next)
echo "Setting up frontend build directories..."
if [ "${APP_ENV}" = "local" ] || [ "${APP_ENV}" = "development" ]; then
    # In dev, clear .next so www-data can create/delete files (avoids EACCES from root-owned leftovers)
    echo "Development mode: Clearing .next for fresh dev build..."
    if [ -d "${FRONTEND_DIR}/.next" ]; then
        # Show current ownership for debugging
        echo "Current .next ownership:"
        ls -la ${FRONTEND_DIR}/.next 2>/dev/null | head -5 || echo "  (empty or inaccessible)"
        # Remove contents (may fail if volume is empty, that's OK)
        find ${FRONTEND_DIR}/.next -mindepth 1 -maxdepth 1 -exec rm -rf {} \; 2>/dev/null || true
    fi
fi
mkdir -p ${FRONTEND_DIR}/.next/cache
echo "Setting .next ownership to www-data..."
if ! chown -R www-data:www-data ${FRONTEND_DIR}/.next; then
    echo "WARNING: Failed to set .next ownership - Next.js may have permission issues"
fi
if ! chmod -R 775 ${FRONTEND_DIR}/.next; then
    echo "WARNING: Failed to set .next permissions"
fi

# In development mode, remove BUILD_ID to force Next.js dev mode with hot reload
if [ "${APP_ENV}" = "local" ] || [ "${APP_ENV}" = "development" ]; then
    echo "Development mode: Clearing Next.js production build marker..."
    rm -f ${FRONTEND_DIR}/.next/BUILD_ID
fi

# Ensure data directory exists with proper permissions
echo "Setting up data directory..."
mkdir -p ${DATA_DIR}
chown -R www-data:www-data ${DATA_DIR}
chmod 755 ${DATA_DIR}

# Setup Meilisearch data directory
echo "Setting up Meilisearch data directory..."
mkdir -p /var/lib/meilisearch/data
chown -R www-data:www-data /var/lib/meilisearch

# Ensure storage directories exist with proper permissions
echo "Setting up storage directories..."
mkdir -p ${BACKEND_DIR}/storage/app/public
mkdir -p ${BACKEND_DIR}/storage/app/backups
mkdir -p ${BACKEND_DIR}/storage/framework/cache
mkdir -p ${BACKEND_DIR}/storage/framework/sessions
mkdir -p ${BACKEND_DIR}/storage/framework/views
mkdir -p ${BACKEND_DIR}/storage/logs
chown -R www-data:www-data ${BACKEND_DIR}/storage
chmod -R 775 ${BACKEND_DIR}/storage

# Create nginx client body temp directory with proper permissions
echo "Setting up nginx temp directories..."
mkdir -p /tmp/nginx_client_body
chown -R www-data:www-data /tmp/nginx_client_body
chmod -R 755 /tmp/nginx_client_body

# Create SQLite database if it doesn't exist
if [ ! -f "${DB_PATH}" ]; then
    echo "Creating SQLite database..."
    touch ${DB_PATH}
    chown www-data:www-data ${DB_PATH}
    chmod 664 ${DB_PATH}
fi

# Update .env database path
cd ${BACKEND_DIR}
if [ -f ".env" ]; then
    sed -i "s|DB_DATABASE=.*|DB_DATABASE=${DB_PATH}|g" .env
fi

# Generate app key if not set
if [ -z "${APP_KEY}" ]; then
    if [ ! -f ".env" ] || ! grep -q "^APP_KEY=base64:" .env; then
        echo "Generating application key..."
        cp .env.example .env 2>/dev/null || true
        php artisan key:generate --force
    fi
fi

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force

# Clear and cache config in production
if [ "${APP_ENV}" = "production" ]; then
    echo "Optimizing for production..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Create storage link (ignore if already exists)
php artisan storage:link >/dev/null 2>&1 || true

echo "=== Sourdough Ready ==="

# Execute the main command
exec "$@"

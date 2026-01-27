#!/bin/sh

# Wait for frontend directory to be available (volume mount)
for i in 1 2 3 4 5; do
    if [ -d "/var/www/html/frontend" ]; then
        break
    fi
    sleep 1
done

cd /var/www/html/frontend

# Ensure .next directory exists with proper permissions for dev mode
# This handles the case where volume mount creates an empty .next volume
if [ ! -d ".next/cache" ]; then
    echo "Creating .next cache directory..."
    mkdir -p .next/cache 2>/dev/null || true
fi

# Check if .next build exists (BUILD_ID is created during production build)
if [ ! -f ".next/BUILD_ID" ]; then
    echo "Starting Next.js in development mode (no build found)..."
    
    # Set NODE_ENV for development
    export NODE_ENV=development
    
    # Install dependencies if node_modules doesn't exist or is incomplete
    # This handles the case where volume mount overwrites node_modules from host
    if [ ! -d "node_modules" ] || [ ! -d "node_modules/.bin" ]; then
        echo "Installing dependencies in container..."
        npm install --legacy-peer-deps
    fi
    
    exec npm run dev
else
    echo "Starting Next.js in production mode..."
    export NODE_ENV=production
    exec npm start
fi

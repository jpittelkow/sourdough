/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  // Enable webpack polling for Docker on Windows
  // Windows filesystem events don't propagate reliably through Docker volumes
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,           // Check for changes every second
        aggregateTimeout: 300, // Delay before rebuilding
      };
    }
    return config;
  },
  
  // API rewrites for development
  // Note: Next.js API routes (app/api/*) take precedence over rewrites
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: 'http://localhost:8000/api/:path*',
          },
          {
            source: '/sanctum/:path*',
            destination: 'http://localhost:8000/sanctum/:path*',
          },
          {
            source: '/broadcasting/:path*',
            destination: 'http://localhost:8000/broadcasting/:path*',
          },
        ]
      : [];
  },

  // Environment variables exposed to the client
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Sourdough',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || process.env.APP_URL || '',
    NEXT_PUBLIC_PUSHER_APP_KEY: process.env.NEXT_PUBLIC_PUSHER_APP_KEY || '',
    NEXT_PUBLIC_PUSHER_APP_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER || 'mt1',
  },
};

module.exports = nextConfig;

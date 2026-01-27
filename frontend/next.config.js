/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  
  // API rewrites for development
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
        ]
      : [];
  },

  // Environment variables exposed to the client
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Sourdough',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  },
};

module.exports = nextConfig;

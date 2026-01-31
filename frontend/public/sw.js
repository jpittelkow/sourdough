/**
 * Sourdough PWA Service Worker
 *
 * Caching strategies:
 * - Cache-first: static assets (JS, CSS, images, fonts) - fast loads, versioned
 * - Network-first: API requests - data freshness, cache fallback for offline
 * - Navigation: network-first with offline.html fallback when unavailable
 */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.6.0/workbox-sw.js');

workbox.setConfig({ debug: false });

const CACHE_VERSION = 'sourdough-v1';
const OFFLINE_URL = '/offline.html';

// Precache offline page on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(`${CACHE_VERSION}-offline`).then((cache) => cache.add(OFFLINE_URL))
  );
});

// When the app requests it, activate immediately (user clicked "Refresh" in update toast)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Claim clients so new SW takes control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Static assets: cache-first (/_next/static/*, images, fonts, favicon)
workbox.routing.registerRoute(
  ({ request, url }) => {
    const path = url.pathname;
    return (
      path.startsWith('/_next/static/') ||
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'image' ||
      request.destination === 'font' ||
      path.match(/\.(ico|png|svg|woff2?|ttf|eot)$/i)
    );
  },
  new workbox.strategies.CacheFirst({
    cacheName: `${CACHE_VERSION}-static`,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Public API routes only (user-specific data must not be cached - shared device risk)
const CACHEABLE_API_PATHS = [
  '/api/manifest',
  '/api/branding',
  '/api/system-settings/public',
  '/api/version',
  '/api/health',
  '/api/auth/sso/providers',
];
workbox.routing.registerRoute(
  ({ request, url }) => {
    if (request.method !== 'GET') return false;
    const path = url.pathname;
    return CACHEABLE_API_PATHS.some((p) => path === p || path.startsWith(p + '?'));
  },
  new workbox.strategies.NetworkFirst({
    cacheName: `${CACHE_VERSION}-api`,
    networkTimeoutSeconds: 10,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 5, // 5 minutes
      }),
    ],
  })
);

// Navigation requests: network-first, fallback to offline page when offline
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: `${CACHE_VERSION}-pages`,
    networkTimeoutSeconds: 5,
    plugins: [
      new workbox.cacheableResponse.CacheableResponsePlugin({ statuses: [0, 200] }),
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Fallback for failed navigation (offline): serve precached offline.html
workbox.routing.setCatchHandler(async ({ request }) => {
  if (request.mode === 'navigate') {
    const cache = await caches.open(`${CACHE_VERSION}-offline`);
    const cached = await cache.match(OFFLINE_URL);
    return cached || Response.error();
  }
  return Response.error();
});

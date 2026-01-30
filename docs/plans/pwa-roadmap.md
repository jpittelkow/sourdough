# Progressive Web App (PWA) Roadmap

Transform Sourdough into a full Progressive Web App with push notifications, offline support, and installability.

## Overview

A full PWA provides native app-like experience: installable, works offline, receives push notifications, and syncs in background. This roadmap builds on the existing [Web Push Notifications](web-push-notifications-roadmap.md) work.

## Current State

- [x] Basic `manifest.json` with app name, icons, theme
- [x] Backend `WebPushChannel` with VAPID signing
- [x] Mobile-responsive UI
- [ ] Service worker
- [ ] Offline caching
- [ ] Push notification frontend
- [ ] Install prompt

## Phase 1: Service Worker Foundation

Create the core service worker with caching strategies.

### Tasks

- [ ] Create `frontend/public/sw.js` service worker
- [ ] Implement cache-first strategy for static assets (JS, CSS, images)
- [ ] Implement network-first strategy for API requests
- [ ] Add offline fallback page (`frontend/public/offline.html`)
- [ ] Register service worker in Next.js app
- [ ] Handle service worker updates gracefully

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Caching strategy | Workbox | Industry standard, maintained by Google |
| API caching | Network-first with cache fallback | Data freshness priority |
| Static assets | Cache-first | Fast loads, assets are versioned |

### Files

| File | Purpose |
|------|---------|
| `frontend/public/sw.js` | Service worker (new) |
| `frontend/public/offline.html` | Offline fallback page (new) |
| `frontend/lib/service-worker.ts` | SW registration utility (new) |

## Phase 2: Push Notifications

Complete the push notification flow (see [Web Push Notifications](web-push-notifications-roadmap.md) for details).

### Tasks

- [ ] Handle `push` event in service worker
- [ ] Handle `notificationclick` for navigation
- [ ] Create `frontend/lib/web-push.ts` subscription utility
- [ ] Add "Enable Notifications" UI in User Preferences
- [ ] Fix backend `WebPushChannel` settings group
- [ ] Add `POST /api/user/webpush-subscription` endpoint
- [ ] Add VAPID key generation instructions to admin config

### Notification Features

- [ ] Rich notifications with icons and actions
- [ ] Notification categories (alerts, reminders, updates)
- [ ] Quiet hours / Do Not Disturb setting
- [ ] Badge count on app icon

## Phase 3: Offline Experience

Provide meaningful offline functionality.

### Tasks

- [ ] Cache critical app shell (layout, navigation)
- [ ] Cache user's frequently accessed data
- [ ] Show offline indicator in UI
- [ ] Queue failed API requests for retry (background sync)
- [ ] Graceful degradation for uncached content

### Offline-Capable Pages

| Page | Offline Behavior |
|------|------------------|
| Dashboard | Show cached data with "offline" badge |
| Settings | Read-only from cache |
| User Profile | Read-only from cache |
| Login | Show offline message |

## Phase 4: Install Experience

Prompt users to install the PWA.

### Tasks

- [ ] Enhance `manifest.json`:
  - [ ] Add `screenshots` for install UI
  - [ ] Add `shortcuts` for quick actions
  - [ ] Add `related_applications` if native app exists
  - [ ] Update icons (ensure all sizes: 48, 72, 96, 128, 144, 152, 192, 384, 512)
- [ ] Create install prompt component
- [ ] Detect `beforeinstallprompt` event
- [ ] Show custom install banner (non-intrusive)
- [ ] Track install success/dismiss analytics
- [ ] Add "Install App" option in settings/menu

### Install Banner UX

- Show after 2+ visits (not first visit)
- Dismissible with "Don't show again" option
- Re-prompt after 30 days if dismissed

## Phase 5: Advanced Features (Optional)

Enhancements for power users.

### Tasks

- [ ] Background sync for offline form submissions
- [ ] Periodic background sync for data refresh
- [ ] Share Target API (receive shared content)
- [ ] Shortcuts in manifest for quick actions
- [ ] Protocol handlers (custom URL schemes)

## Manifest Enhancements

Updated `manifest.json` structure:

```json
{
  "name": "Sourdough",
  "short_name": "Sourdough",
  "description": "Starter Application Framework for AI Development",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff",
  "icons": [
    { "src": "/icons/icon-48.png", "sizes": "48x48", "type": "image/png" },
    { "src": "/icons/icon-72.png", "sizes": "72x72", "type": "image/png" },
    { "src": "/icons/icon-96.png", "sizes": "96x96", "type": "image/png" },
    { "src": "/icons/icon-128.png", "sizes": "128x128", "type": "image/png" },
    { "src": "/icons/icon-144.png", "sizes": "144x144", "type": "image/png" },
    { "src": "/icons/icon-152.png", "sizes": "152x152", "type": "image/png" },
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-384.png", "sizes": "384x384", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "screenshots": [
    { "src": "/screenshots/dashboard.png", "sizes": "1280x720", "type": "image/png" },
    { "src": "/screenshots/mobile.png", "sizes": "750x1334", "type": "image/png" }
  ],
  "shortcuts": [
    { "name": "Dashboard", "url": "/dashboard", "icons": [{ "src": "/icons/shortcut-dashboard.png", "sizes": "96x96" }] },
    { "name": "Settings", "url": "/user/preferences", "icons": [{ "src": "/icons/shortcut-settings.png", "sizes": "96x96" }] }
  ]
}
```

## Environment Variables

```env
# VAPID keys for push notifications
# Generate with: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:admin@yourdomain.com
```

## Testing Checklist

- [ ] Lighthouse PWA audit passes (90+ score)
- [ ] Install prompt appears after criteria met
- [ ] Push notifications work on Chrome, Firefox, Edge
- [ ] Offline page displays when network unavailable
- [ ] Cached pages load instantly
- [ ] Service worker updates without breaking app
- [ ] Works on iOS Safari (with limitations noted)
- [ ] Works on Android Chrome

## Browser Support Notes

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ⚠️ iOS 16.4+ | ✅ |
| Install Prompt | ✅ | ❌ | ⚠️ Manual | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |

## Dependencies

- [next-pwa](https://www.npmjs.com/package/next-pwa) or manual SW setup
- [workbox](https://developer.chrome.com/docs/workbox) for caching strategies
- Existing notification system infrastructure

## References

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev PWA](https://web.dev/progressive-web-apps/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

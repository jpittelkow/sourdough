# Progressive Web App (PWA) Roadmap

Transform Sourdough into a full Progressive Web App with push notifications, offline support, and installability.

## Overview

A full PWA provides native app-like experience: installable, works offline, receives push notifications, and syncs in background. This roadmap builds on the existing [Web Push Notifications](web-push-notifications-roadmap.md) work.

## Current State

- [x] Basic `manifest.json` with app name, icons, theme
- [x] Backend `WebPushChannel` with VAPID signing
- [x] Mobile-responsive UI
- [x] Service worker
- [x] Offline caching
- [x] Push notification frontend
- [x] Install prompt

## Phase 1: Service Worker Foundation ✅ COMPLETE

Create the core service worker with caching strategies.

### Tasks

- [x] Create `frontend/public/sw.js` service worker
- [x] Implement cache-first strategy for static assets (JS, CSS, images)
- [x] Implement network-first strategy for API requests
- [x] Add offline fallback page (`frontend/public/offline.html`)
- [x] Register service worker in Next.js app
- [x] Handle service worker updates gracefully

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Caching strategy | Workbox | Industry standard, maintained by Google |
| API caching | Network-first with cache fallback | Data freshness priority |
| Static assets | Cache-first | Fast loads, assets are versioned |

### Files

| File | Purpose |
|------|---------|
| `frontend/public/sw.js` | Service worker |
| `frontend/public/offline.html` | Offline fallback page |
| `frontend/lib/service-worker.ts` | SW registration utility |
| `frontend/components/service-worker-setup.tsx` | SW registration component |

## Phase 2: Push Notifications ✅ COMPLETE

Complete the push notification flow (see [Web Push Notifications](web-push-notifications-roadmap.md) for details).

### Tasks

- [x] Handle `push` event in service worker
- [x] Handle `notificationclick` for navigation
- [x] Create `frontend/lib/web-push.ts` subscription utility
- [x] Add "Enable Notifications" UI in User Preferences
- [x] Backend `WebPushChannel` uses notifications group for subscription
- [x] Add `POST /api/user/webpush-subscription` and `DELETE /api/user/webpush-subscription` endpoints
- [x] Add VAPID key generation instructions to admin config

### Notification Features

- [ ] Rich notifications with icons and actions
- [ ] Notification categories (alerts, reminders, updates)
- [ ] Quiet hours / Do Not Disturb setting
- [ ] Badge count on app icon

## Phase 3: Offline Experience ✅ COMPLETE

Provide meaningful offline functionality.

### Tasks

- [x] Cache critical app shell (layout, navigation)
- [x] Cache user's frequently accessed data
- [x] Show offline indicator in UI
- [x] Queue failed API requests for retry (background sync)
- [x] Graceful degradation for uncached content

### Offline-Capable Pages

| Page | Offline Behavior |
|------|------------------|
| Dashboard | Show cached data with "offline" badge |
| User Preferences | Read-only from cache; save/actions disabled |
| Notifications | Show cached notifications; Mark read/Delete disabled |
| Login | Show offline message (offline.html) |

## Phase 4: Install Experience ✅ COMPLETE

Prompt users to install the PWA.

### Tasks

- [x] Enhance `manifest.json`:
  - [x] Add `screenshots` for install UI
  - [x] Add `shortcuts` for quick actions
  - [ ] Add `related_applications` if native app exists
  - [x] Update icons (ensure all sizes: 48, 72, 96, 128, 144, 152, 192, 384, 512)
- [x] Create install prompt component
- [x] Detect `beforeinstallprompt` event
- [x] Show custom install banner (non-intrusive)
- [x] Track install success/dismiss (localStorage; optional analytics)
- [x] Add "Install App" option in settings/menu

### Install Banner UX

- Show after 2+ visits (not first visit)
- Dismissible with "Don't show again" option
- Re-prompt after 30 days if dismissed

## Phase 5: Advanced Features (Optional)

Enhancements for power users.

### Tasks

- [x] Background sync for offline form submissions (already in sw.js)
- [ ] Periodic background sync for data refresh
- [x] Share Target API (receive shared content)
- [x] Shortcuts in manifest for quick actions
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

- [ ] Lighthouse PWA audit passes (90+ score) — run manually: `npx lighthouse http://localhost:8080 --only-categories=pwa`
- [ ] Install prompt appears after criteria met (2+ visits)
- [ ] Push notifications work on Chrome, Firefox, Edge
- [ ] Offline page displays when network unavailable
- [ ] Cached pages load instantly
- [ ] Service worker updates without breaking app
- [ ] Works on iOS Safari (with limitations noted)
- [ ] Works on Android Chrome

**PWA Review (2026-02-05):** Code review completed. Removed missing screenshots from manifest, fixed `console.error` → `errorLogger`, added share page URL validation (http/https only). See [journal/2026-02-05-pwa-review.md](../journal/2026-02-05-pwa-review.md).

## Browser Support Notes

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✅ | ✅ | ✅ | ✅ |
| Push Notifications | ✅ | ✅ | ⚠️ iOS 16.4+ | ✅ |
| Install Prompt | ✅ | ❌ | ⚠️ Manual | ✅ |
| Background Sync | ✅ | ❌ | ❌ | ✅ |
| Share Target | ✅ | ❌ | ⚠️ Limited | ✅ |

## Dependencies

- [next-pwa](https://www.npmjs.com/package/next-pwa) or manual SW setup
- [workbox](https://developer.chrome.com/docs/workbox) for caching strategies
- Existing notification system infrastructure

## References

- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev PWA](https://web.dev/progressive-web-apps/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

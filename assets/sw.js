/**
 * resofire/pwa — Service Worker
 *
 * Stage 1 placeholder. Full caching strategy (cache-first for assets,
 * network-first for API, stale-while-revalidate for shell) will be
 * implemented in Stage 5.
 */

const CACHE_NAME = 'resofire-pwa-v1';
const OFFLINE_URL = 'offline';

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME).then(function (cache) {
            return cache.add(OFFLINE_URL);
        })
    );
    // Activate immediately rather than waiting for existing tabs to close.
    self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────

self.addEventListener('activate', function (event) {
    // Claim all existing clients so the SW controls them without a reload.
    event.waitUntil(self.clients.claim());
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', function (event) {
    // Only handle GET navigation requests for the offline fallback.
    // All other requests pass through to the network untouched.
    if (
        event.request.method !== 'GET' ||
        event.request.mode !== 'navigate'
    ) {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(function () {
            return caches.open(CACHE_NAME).then(function (cache) {
                return cache.match(OFFLINE_URL);
            });
        })
    );
});

// ── Push ──────────────────────────────────────────────────────────────────────

self.addEventListener('push', function (event) {
    if (!event.data) {
        return;
    }

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        return;
    }

    const options = {
        body:  data.content || '',
        icon:  data.icon    || '',
        badge: data.badge   || '',
        data:  { link: data.link || '/' },
    };

    event.waitUntil(
        self.registration.showNotification(data.title || '', options)
    );
});

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const link = event.notification.data && event.notification.data.link
        ? event.notification.data.link
        : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            // If there is already an open window, focus it and navigate.
            for (const client of clientList) {
                if ('focus' in client) {
                    client.focus();
                    if ('navigate' in client) {
                        client.navigate(link);
                    }
                    return;
                }
            }
            // No existing window — open a new one.
            if (clients.openWindow) {
                return clients.openWindow(link);
            }
        })
    );
});

/**
 * resofire/pwa — Service Worker
 *
 * This SW exists primarily to enable Web Push notifications.
 * Navigation requests are always network-first with a branded offline
 * fallback page shown only when the network is genuinely unreachable.
 * No asset caching is performed.
 */

const CACHE_OFFLINE = 'resofire-pwa-offline-v1';
const OFFLINE_URL   = 'offline';

// Forum payload updated via postMessage — used for debug flag.
var forumPayload = {};

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_OFFLINE).then(function (cache) {
            return cache.add(OFFLINE_URL);
        })
    );
    self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────

self.addEventListener('activate', function (event) {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            // Remove any caches from previous SW versions.
            caches.keys().then(function (keys) {
                return Promise.all(
                    keys
                        .filter(function (key) { return key.startsWith('resofire-pwa-') && key !== CACHE_OFFLINE; })
                        .map(function (key) { return caches.delete(key); })
                );
            }),
        ])
    );
});

// ── Messages from the page ────────────────────────────────────────────────────

self.addEventListener('message', function (event) {
    if (!event.data) return;
    if (event.data.type === 'FORUM_PAYLOAD') {
        Object.assign(forumPayload, event.data.payload);
    }
});

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', function (event) {
    const request = event.request;

    if (request.method !== 'GET') return;
    if (!request.url.startsWith('http')) return;
    if (forumPayload.debug) return;

    // Navigation requests: always network, offline fallback only on failure.
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request).catch(function () {
                return offlineFallback();
            })
        );
    }
    // All other requests pass through untouched.
});

async function offlineFallback() {
    const cache    = await caches.open(CACHE_OFFLINE);
    const fallback = await cache.match(OFFLINE_URL);
    if (fallback) return fallback;
    return new Response('Offline', { status: 503 });
}

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener('push', function (event) {
    if (!event.data) return;

    var data;
    try { data = event.data.json(); } catch (e) { return; }

    event.waitUntil(
        self.registration.showNotification(data.title || '', {
            body:  data.content || '',
            icon:  data.icon    || '',
            badge: data.badge   || '',
            data:  { link: data.link || '/' },
        })
    );
});

// ── Notification click ────────────────────────────────────────────────────────

self.addEventListener('notificationclick', function (event) {
    event.notification.close();

    const link = (event.notification.data && event.notification.data.link)
        ? event.notification.data.link
        : '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if ('focus' in client) {
                    if ('navigate' in client) client.navigate(link);
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(link);
        })
    );
});

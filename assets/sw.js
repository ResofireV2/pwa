/**
 * resofire/pwa — Service Worker
 *
 * Cache policy:
 *
 *   Navigation requests (any mode):
 *     Always network-first. The offline page is served only when the
 *     network is genuinely unreachable. Flarum bakes session data into
 *     the HTML payload, so caching HTML would cause stale session state.
 *
 *   Asset requests (JS/CSS/fonts/images from assetsBaseUrl):
 *     Cache-first, but ONLY when running as an installed PWA (standalone
 *     display mode). In a regular browser tab the SW is transparent —
 *     assets go straight to the network.
 *
 *   Everything else (API, admin, auth, third-party):
 *     Always passes through to the network untouched.
 */

importScripts('assets/extensions/resofire-pwa/idb.js');

// ── IDB setup ─────────────────────────────────────────────────────────────────

const DB_NAME    = 'keyval-store';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

const dbPromise = idb.openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
        db.createObjectStore(STORE_NAME);
    },
});

async function dbGet(key) {
    return (await dbPromise).get(STORE_NAME, key);
}

async function dbSet(key, val) {
    return (await dbPromise).put(STORE_NAME, val, key);
}

// ── Cache names ───────────────────────────────────────────────────────────────

const CACHE_ASSETS  = 'resofire-pwa-assets-v1';
const CACHE_OFFLINE = 'resofire-pwa-offline-v1';

const OFFLINE_URL = 'offline';

// Forum payload populated from IDB on install, and updated via postMessage.
// Keys used: assetsBaseUrl, debug, isStandalone
var forumPayload = {};

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener('install', function (event) {
    event.waitUntil(
        Promise.all([
            // Cache the offline fallback page.
            caches.open(CACHE_OFFLINE).then(function (cache) {
                return cache.add(OFFLINE_URL);
            }),
            // Read forum payload from IDB.
            dbGet('flarum.forumPayload').then(function (payload) {
                if (payload) Object.assign(forumPayload, payload);
            }),
        ])
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
                const current = [CACHE_ASSETS, CACHE_OFFLINE];
                return Promise.all(
                    keys
                        .filter(function (key) {
                            return key.startsWith('resofire-pwa-') && !current.includes(key);
                        })
                        .map(function (key) {
                            return caches.delete(key);
                        })
                );
            }),
        ])
    );
});

// ── Messages from the page ────────────────────────────────────────────────────

self.addEventListener('message', function (event) {
    if (!event.data) return;

    switch (event.data.type) {
        case 'FORUM_PAYLOAD':
            Object.assign(forumPayload, event.data.payload);
            break;

        case 'PAGE_VISIT':
            recordRecentPage(event.data.url, event.data.title);
            break;
    }
});

async function recordRecentPage(url, title) {
    if (!url || !title) return;
    try {
        const MAX = 10;
        var pages = (await dbGet('resofire-pwa.recentPages')) || [];
        pages = pages.filter(function (p) { return p.url !== url; });
        pages.unshift({ url: url, title: title });
        if (pages.length > MAX) pages = pages.slice(0, MAX);
        await dbSet('resofire-pwa.recentPages', pages);
    } catch (e) {}
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', function (event) {
    const request = event.request;

    // Only intercept GET requests over HTTP.
    if (request.method !== 'GET') return;
    if (!request.url.startsWith('http')) return;

    // Debug mode: SW is completely transparent.
    if (forumPayload.debug) return;

    const isNavigation = request.mode === 'navigate';

    // ── Navigation: always network, offline fallback only ──────────────────
    // Never cache HTML. Flarum bakes session + extension state into the
    // page payload — serving stale HTML breaks login/logout and extension
    // enable/disable without a hard reload.
    if (isNavigation) {
        event.respondWith(
            fetch(request).catch(function () {
                return offlineFallback();
            })
        );
        return;
    }

    // ── Assets: cache only when running as installed PWA ───────────────────
    // In a normal browser tab the SW is invisible — everything hits the
    // network. In standalone mode we serve assets from cache for speed and
    // offline resilience.
    if (!forumPayload.isStandalone) return;

    const assetsBase = forumPayload.assetsBaseUrl || '';
    const isAsset    = assetsBase && request.url.startsWith(assetsBase);

    if (isAsset) {
        event.respondWith(cacheFirst(request));
    }
    // All other requests (API, admin, third-party) pass through untouched.
});

// ── Caching strategies ────────────────────────────────────────────────────────

async function cacheFirst(request) {
    const cache  = await caches.open(CACHE_ASSETS);
    const cached = await cache.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        // Asset unavailable offline — return a minimal error response.
        return new Response('', { status: 503 });
    }
}

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

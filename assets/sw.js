/**
 * resofire/pwa — Service Worker
 *
 * Caching strategy:
 *   Assets (JS/CSS/fonts/images) — cache-first
 *   API requests (/api/*)        — network-first
 *   Forum shell (navigation)     — stale-while-revalidate
 *   Offline fallback             — cache on install, always available
 */

importScripts('assets/extensions/resofire-pwa/idb.js');

// ── IDB setup ─────────────────────────────────────────────────────────────────

const DB_NAME      = 'keyval-store';
const DB_VERSION   = 1;
const STORE_NAME   = 'keyval';

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
const CACHE_SHELL   = 'resofire-pwa-shell-v3';  // bumped — clears stale v1 entries on update
const CACHE_OFFLINE = 'resofire-pwa-offline-v1';

const OFFLINE_URL = 'offline';

// Forum payload read from IDB — populated by the forum JS on registration.
// Keys we use: basePath, assetsBaseUrl, debug
let forumPayload = {};

// ── Install ───────────────────────────────────────────────────────────────────

self.addEventListener('install', function (event) {
    event.waitUntil(
        Promise.all([
            // Cache the offline fallback page.
            caches.open(CACHE_OFFLINE).then(function (cache) {
                return cache.add(OFFLINE_URL);
            }),
            // Read forum payload from IDB so we have it immediately.
            dbGet('flarum.forumPayload').then(function (payload) {
                if (payload) {
                    Object.assign(forumPayload, payload);
                }
            }),
        ])
    );

    // Activate immediately — do not wait for existing tabs to close.
    self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────

self.addEventListener('activate', function (event) {
    event.waitUntil(
        Promise.all([
            // Claim all clients immediately.
            self.clients.claim(),
            // Remove any caches from previous versions.
            caches.keys().then(function (keys) {
                const current = [CACHE_ASSETS, CACHE_SHELL, CACHE_OFFLINE];
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
            // Forum JS sends updated payload on every registration.
            Object.assign(forumPayload, event.data.payload);
            break;

        case 'PAGE_VISIT':
            // Forum JS sends the current page URL and title on each navigation.
            recordRecentPage(event.data.url, event.data.title);
            break;
    }
});

async function recordRecentPage(url, title) {
    if (!url || !title) return;

    try {
        const MAX_PAGES = 10;
        let pages = (await dbGet('resofire-pwa.recentPages')) || [];

        // Remove existing entry for this URL if present.
        pages = pages.filter(function (p) { return p.url !== url; });

        // Prepend the new entry.
        pages.unshift({ url: url, title: title });

        // Trim to max.
        if (pages.length > MAX_PAGES) {
            pages = pages.slice(0, MAX_PAGES);
        }

        await dbSet('resofire-pwa.recentPages', pages);
    } catch (e) {
        // IDB errors should never break page navigation.
    }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', function (event) {
    const request = event.request;

    // Only handle GET requests.
    if (request.method !== 'GET') return;

    // Never cache chrome-extension or non-http requests.
    if (!request.url.startsWith('http')) return;

    // In debug mode, bypass the cache entirely.
    if (forumPayload.debug) return;

    const url = new URL(request.url);

    // Determine the request type.
    const assetsBase = forumPayload.assetsBaseUrl || '';
    const basePath   = forumPayload.basePath   || '';
    const apiPath    = basePath + '/api/';

    const isAsset      = assetsBase && request.url.startsWith(assetsBase);
    const isApi        = url.pathname.startsWith(apiPath) || url.pathname === basePath + '/api';
    const isAdminPath  = url.pathname.startsWith(basePath + '/admin');
    // Auth paths must always hit the network — caching login/logout/register
    // would cause the UI to show stale session state after auth changes.
    const isAuthPath   = ['/login', '/logout', '/register', '/confirm-email'].some(
        function (p) { return url.pathname === basePath + p || url.pathname.startsWith(basePath + p + '/'); }
    );
    const isNavigation = request.mode === 'navigate';

    if (isAsset) {
        // Cache-first for assets (JS, CSS, fonts, images).
        event.respondWith(cacheFirst(request, CACHE_ASSETS));
    } else if (isApi || isAdminPath || isAuthPath) {
        // Network-first for API, admin, and auth paths — never cache these.
        event.respondWith(networkFirst(request));
    } else if (isNavigation) {
        // Stale-while-revalidate for the forum shell.
        event.respondWith(staleWhileRevalidate(request, CACHE_SHELL));
    }
    // All other requests (third-party, etc.) pass through unhandled.
});

// ── Caching strategies ────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(cacheName);
            cache.put(request, response.clone());
        }
        return response;
    } catch (e) {
        return offlineFallback(request);
    }
}

async function networkFirst(request) {
    try {
        return await fetch(request);
    } catch (e) {
        // API offline — return nothing (let the app handle the error).
        return new Response(JSON.stringify({ errors: [{ status: '503', title: 'Offline' }] }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

async function staleWhileRevalidate(request, cacheName) {
    const cache  = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Fire off a background revalidation regardless.
    const networkPromise = fetch(request).then(function (response) {
        if (response.ok) {
            // Good response — update the cache.
            cache.put(request, response.clone());
        } else {
            // Error response — evict the stale cached entry so the next
            // request goes to the network fresh rather than serving stale data.
            cache.delete(request);
        }
        return response;
    }).catch(function () {
        return null;
    });

    // Return cached immediately if available, otherwise wait for network.
    if (cached) return cached;

    const networkResponse = await networkPromise;
    if (networkResponse) return networkResponse;

    return offlineFallback(request);
}

async function offlineFallback(request) {
    if (request.mode === 'navigate') {
        const offlineCache = await caches.open(CACHE_OFFLINE);
        const fallback = await offlineCache.match(OFFLINE_URL);
        if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503 });
}

// ── Push notifications ────────────────────────────────────────────────────────

self.addEventListener('push', function (event) {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        return;
    }

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

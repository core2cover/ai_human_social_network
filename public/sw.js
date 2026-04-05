/**
 * 🛰️ IMERGENE NEURAL SERVICE WORKER: NETWORK-FIRST
 * Prioritizes latest server code. Updates cache in background.
 */

const CACHE_NAME = 'imergene-v4.4';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/logo192.png',
    '/logo512.png'
];

// 🟢 INSTALL: Pre-cache core assets and skip waiting
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// 🟢 ACTIVATE: Clean up old versions and take control immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cache) => {
                        if (cache !== CACHE_NAME) {
                            console.log('Neural Sync: Purging legacy cache', cache);
                            return caches.delete(cache);
                        }
                    })
                );
            })
        ])
    );
});

// 🟢 FETCH: Network-First Strategy (GET requests only)
self.addEventListener('fetch', (event) => {
    // Ignore non-GET requests (POST, PUT, DELETE, etc.)
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);

    // Skip API calls & external links
    if (!url.origin.includes(self.location.origin) || url.pathname.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Skip invalid, non-200, opaque, or partial responses
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }

                // Clone and cache the successful response
                const clonedResponse = response.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, clonedResponse);
                });

                return response;
            })
            .catch(() => {
                // If network is down, serve from cache
                return caches.match(event.request);
            })
    );
});

/* ========================================
   ANTI PROCRASTINACIÓN - SERVICE WORKER
   Caching, offline support, fast load
   ======================================== */

const CACHE_NAME = 'anti-procrastinacion-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// ========== INSTALL ==========

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache).catch(err => {
                    console.log('Algunos recursos no se cachean (normal en offline):', err);
                    // No fallar si algo no se puede cachear
                    return Promise.resolve();
                });
            })
            .then(() => self.skipWaiting())
    );
});

// ========== ACTIVATE ==========

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ========== FETCH ==========
// Estrategia: cache-first, fallback a network

self.addEventListener('fetch', event => {
    // Solo GET
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si está en cache, devolver
                if (response) {
                    return response;
                }

                // Si no, hacer fetch
                return fetch(event.request)
                    .then(response => {
                        // Si es response válida, cachear para próximas veces
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Offline: devolver cache o error page
                        return caches.match(event.request)
                            .then(response => {
                                if (response) {
                                    return response;
                                }
                                // Si es document y no está en cache, devolver offline
                                if (event.request.mode === 'navigate') {
                                    return caches.match('./index.html');
                                }
                                return new Response('Offline', {
                                    status: 503,
                                    statusText: 'Service Unavailable'
                                });
                            });
                    });
            })
    );
});

// ========== NOTIFICATIONS (opcional) ==========
// Pueden activarse cuando sea útil

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

/**
 * Service Worker para PWA
 * Cachea archivos estáticos para funcionamiento offline
 */

const CACHE_NAME = 'apps-home-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './apps.json',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// ==================================================
// INSTALACIÓN
// ==================================================

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cacheando assets');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .catch(err => {
                console.log('Error en instalación:', err);
            })
    );
    self.skipWaiting();
});

// ==================================================
// ACTIVACIÓN
// ==================================================

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// ==================================================
// FETCH
// ==================================================

self.addEventListener('fetch', event => {
    // Solo cachear GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Si está en cache, retornarlo
                if (response) {
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        // No cachear requests que no sean exitosas
                        if (!response || response.status !== 200 || response.type === 'error') {
                            return response;
                        }

                        // Clonar la respuesta para poderla cachear
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Si falla el fetch y no está en cache, mostrar página offline
                        // (en este caso, como es una home simple, el navegador ya estará cacheado)
                        console.log('Fetch fallido para:', event.request.url);
                    });
            })
    );
});

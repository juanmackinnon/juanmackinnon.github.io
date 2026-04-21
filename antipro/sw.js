// Service Worker para AntiPro
// Cachea los archivos principales para carga rápida y soporte offline básico

const CACHE_NAME = 'antipro-v1';
const FILES_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// Instalación
self.addEventListener('install', (event) => {
    console.log('[SW] Instalando...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Cacheando archivos');
            return cache.addAll(FILES_TO_CACHE).catch((err) => {
                console.log('[SW] Error al cachear:', err);
                // No fallar si hay error al cachear (útil en desarrollo)
            });
        })
    );
    
    self.skipWaiting();
});

// Activación
self.addEventListener('activate', (event) => {
    console.log('[SW] Activando...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Eliminando cache antiguo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    self.clients.claim();
});

// Fetch - Estrategia: Cache first, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Ignorar peticiones que no sean GET
    if (request.method !== 'GET') {
        return;
    }
    
    // Ignorar peticiones a dominios externos
    if (!request.url.startsWith(self.location.origin)) {
        return;
    }
    
    event.respondWith(
        caches.match(request).then((response) => {
            if (response) {
                console.log('[SW] Cache hit:', request.url);
                return response;
            }
            
            // No está en cache, hacer request a la red
            return fetch(request).then((response) => {
                // Si es un recurso importante, guardarlo en cache
                if (response.ok && isCacheable(request)) {
                    const cache = caches.open(CACHE_NAME);
                    cache.then((c) => c.put(request, response.clone()));
                }
                return response;
            }).catch((err) => {
                console.log('[SW] Fetch failed, returning offline:', err);
                // En caso de error, intentar servir desde cache o response offline
                return caches.match(request).then((cached) => {
                    return cached || offlineFallback(request);
                });
            });
        })
    );
});

function isCacheable(request) {
    // Cachear HTML, CSS, JS, JSON, imágenes
    const url = new URL(request.url);
    const extensions = ['.html', '.css', '.js', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp'];
    return extensions.some((ext) => url.pathname.endsWith(ext));
}

function offlineFallback(request) {
    // Si no hay internet y no está en cache, retornar una página offline simple
    if (request.destination === 'document') {
        return new Response(
            '<html><body style="font-family: system-ui; padding: 20px; text-align: center;">' +
            '<h1>Sin conexión</h1>' +
            '<p>AntiPro necesita conexión a internet para funcionar.</p>' +
            '</body></html>',
            {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            }
        );
    }
    
    return new Response('Sin conexión', { status: 503 });
}

// Background Sync (opcional, para futuras mejoras)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Aquí iría código para sincronizar datos cuando vuelva conexión
            Promise.resolve()
        );
    }
});

// Push Notifications (opcional, para futuras mejoras)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body || 'Nueva notificación de AntiPro',
            icon: './data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"><rect fill="%233b82f6" width="192" height="192"/><text x="50%" y="50%" font-size="100" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">A</text></svg>',
            badge: './data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect fill="%233b82f6" width="96" height="96"/><text x="50%" y="50%" font-size="50" font-weight="700" fill="white" text-anchor="middle" dominant-baseline="middle">A</text></svg>'
        };
        
        event.waitUntil(
            self.registration.showNotification('AntiPro', options)
        );
    }
});

// Click en notificación
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Si hay una ventana abierta, usarla
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // Si no, abrir una nueva
            if (clients.openWindow) {
                return clients.openWindow('./');
            }
        })
    );
});

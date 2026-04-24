// Service Worker para AntiPro
// Cachea los archivos principales para carga rápida y soporte offline básico

const CACHE_NAME = 'antipro-v3';
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
    if (!request.url.startsWith(self.location.origin) && 
        !request.url.includes('fonts.googleapis.com') &&
        !request.url.includes('fonts.gstatic.com')) {
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
                console.log('[SW] Fetch failed:', err);
                // En caso de error, intentar servir desde cache
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
    const extensions = ['.html', '.css', '.js', '.json', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.woff', '.woff2'];
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

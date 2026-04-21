/* ========================================
   GASTOS APP - SERVICE WORKER
   ======================================== */

const CACHE_VERSION = 'gastos-v1';
const CACHE_NAME = `${CACHE_VERSION}`;

// Archivos a cachear
const CACHED_FILES = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json'
];

// Instalación del SW
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHED_FILES);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activación del SW
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar cachés antigas
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Interceptar requests
self.addEventListener('fetch', (event) => {
  // Solo GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Si está en caché, devolverlo
      if (response) {
        return response;
      }

      // Si no, intentar traer de red
      return fetch(event.request).then((response) => {
        // No cachear si no es una respuesta válida
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clonar la respuesta para guardarla en caché
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Si falla la red, usar caché
        return caches.match(event.request).then((response) => {
          return response || new Response('Offline - contenido no disponible');
        });
      });
    })
  );
});

// Sync en background (opcional, para futuras versiones)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Aquí iría lógica para sincronizar datos con un servidor
      Promise.resolve()
    );
  }
});

// OTIS APROD Service Worker v0.5.0 - Complete PWA Support + Local Template Caching
const CACHE_NAME = 'otis-aprod-v0.5.0';
const TEMPLATE_CACHE_NAME = 'otis-templates-v1';
const OFFLINE_URL = '/offline.html';

// Essential files to cache for offline functionality
const CACHE_URLS = [
  '/',
  '/offline.html',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/favicon.ico',
  '/templates/template-registry.json'
];

// Template files to cache for offline operation
const TEMPLATE_URLS = [
  '/templates/BEX FRAGEN.xlsx',
  '/templates/Abnahme FRAGEN.xlsx',
  '/templates/Abnahmeprotokoll Leer DE.xlsx',
  '/templates/BEX-DE.xlsx',
  '/templates/alap_egysegu.xlsx',
  '/templates/minimal_kerdesek.xlsx',
  '/templates/Erdungskontrolle.pdf',
  '/questions_hu.json',
  '/questions_de.json',
  '/questions_grounding_hu.json',
  '/questions_grounding_de.json'
];

console.log('[SW] OTIS APROD Service Worker v0.5.0 initializing');

// Install event - cache essential resources only (templates cached at runtime)
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v0.5.0');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching essential files');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Essential files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache essential files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v0.5.0');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== TEMPLATE_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker v0.5.0 activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - network first with offline fallback, special handling for templates
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/auth')) {
    console.log('[SW] Ignoring auth/api request, letting browser handle:', url.pathname);
    return;
  }

  // Special handling for template files - cache first for offline support
  if (url.pathname.startsWith('/templates/') || url.pathname.includes('questions')) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log('[SW] Serving template from cache:', url.pathname);
            // Also update cache in background
            fetch(event.request)
              .then((response) => {
                if (response.ok) {
                  caches.open(TEMPLATE_CACHE_NAME).then((cache) => {
                    cache.put(event.request, response);
                  });
                }
              })
              .catch(() => {});
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(TEMPLATE_CACHE_NAME).then((cache) => {
                  cache.put(event.request, responseClone);
                });
              }
              return response;
            });
        })
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          if (event.request.url.includes('/static/') || 
              event.request.url.includes('.js') || 
              event.request.url.includes('.css')) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseClone);
              });
          }
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              console.log('[SW] Serving from cache:', event.request.url);
              return cachedResponse;
            }
            
            if (event.request.mode === 'navigate') {
              console.log('[SW] Serving offline page');
              return caches.match(OFFLINE_URL);
            }
            
            throw new Error('Network and cache failed');
          });
      })
  );
});

// Background sync for offline protocol completion
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'protocol-sync') {
    event.waitUntil(syncProtocols());
  }
});

async function syncProtocols() {
  console.log('[SW] Syncing offline protocols...');
  // Placeholder for future offline sync implementation
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_TEMPLATES') {
    console.log('[SW] Received request to cache templates');
    cacheTemplates();
  }
  
  if (event.data && event.data.type === 'CLEAR_TEMPLATE_CACHE') {
    console.log('[SW] Clearing template cache');
    caches.delete(TEMPLATE_CACHE_NAME);
  }
});

async function cacheTemplates() {
  try {
    const cache = await caches.open(TEMPLATE_CACHE_NAME);
    
    for (const url of TEMPLATE_URLS) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('[SW] Cached template:', url);
        }
      } catch (err) {
        console.warn('[SW] Failed to cache:', url);
      }
    }
    
    console.log('[SW] Template caching complete');
  } catch (error) {
    console.error('[SW] Template caching failed:', error);
  }
}

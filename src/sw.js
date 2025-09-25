/// <reference lib="webworker" />
// Minimal custom service worker (no-op offline support); keep lint clean
// Notes:
// - We intentionally avoid using unused parameters in event listeners.
// - If a bundler injects Workbox or other SW tools, this SW remains compatible.
const PRECACHE = 'ph-precache-v1';
const PRECACHE_URLS = [
  'https://unpkg.com/@mapbox/shp-write@0.4.3/dist/shpwrite.js'
];

self.addEventListener('install', (event) => {
  // @ts-ignore
  if (typeof self.skipWaiting === 'function') self.skipWaiting();
  // Warm critical optional assets (best-effort)
  // @ts-ignore
  event.waitUntil(
    caches.open(PRECACHE).then(cache => Promise.all(
      PRECACHE_URLS.map(u => fetch(u, { mode: 'no-cors' }).then(r => cache.put(u, r.clone())).catch(() => null))
    ))
  );
});

self.addEventListener('activate', () => {
  // @ts-ignore
  if (self.clients && typeof self.clients.claim === 'function') self.clients.claim();
});

// Basic fetch event for offline fallback
/** @param {FetchEvent} e */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = req.url;
  // Stale-while-revalidate for shp-write CDN script
  if (PRECACHE_URLS.some(u => url.startsWith(u))) {
    // @ts-ignore
    e.respondWith(
      caches.open(PRECACHE).then(async cache => {
        const cached = await cache.match(url);
        const fetchPromise = fetch(req).then(res => {
          if (res && res.status === 200) cache.put(url, res.clone());
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }
  // Default cache-first fallback
  // @ts-ignore
  e.respondWith(
    caches.match(req).then(response => response || fetch(req))
  );
});

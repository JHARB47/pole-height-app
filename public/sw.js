/// <reference lib="webworker" />
const PRECACHE = 'ph-precache-v2';
const PRECACHE_URLS = [
  'https://unpkg.com/@mapbox/shp-write@0.4.3/dist/shpwrite.js'
];
self.addEventListener('install', (event) => {
  // @ts-ignore
  if (typeof self.skipWaiting === 'function') self.skipWaiting();
  // @ts-ignore
  event.waitUntil(
    caches.open(PRECACHE).then(cache => Promise.all(
      PRECACHE_URLS.map(u => fetch(u, { mode: 'no-cors' }).then(r => cache.put(u, r.clone())).catch(() => null))
    ))
  );
});

self.addEventListener('activate', (event) => {
  // @ts-ignore
  if (self.clients && typeof self.clients.claim === 'function') self.clients.claim();
  // @ts-ignore
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys
      .filter(k => k.startsWith('ph-precache-') && k !== PRECACHE)
      .map(k => caches.delete(k))
    ))
  );
});

// Allow clients to request immediate activation
self.addEventListener('message', (event) => {
  // @ts-ignore
  if (event && event.data === 'SKIP_WAITING' && typeof self.skipWaiting === 'function') {
    // @ts-ignore
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  /** @type {FetchEvent} */
  // @ts-ignore - JSDoc cast for proper type in JS file
  const e = event;
  const req = e.request;
  const url = req.url;
  if (PRECACHE_URLS.some(u => url.startsWith(u))) {
    // @ts-ignore
    e.respondWith(
      caches.open(PRECACHE).then(async cache => {
        const cached = await cache.match(url);
        const fetchPromise = fetch(req).then(res => {
          if (res && res.status === 200) cache.put(url, res.clone());
          return res;
        }).catch(() => cached || new Response('', { status: 504 }));
        return cached || fetchPromise;
      })
    );
    return;
  }
  // @ts-ignore
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
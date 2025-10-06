/// <reference lib="webworker" />
const PRECACHE = 'ph-precache-v3';
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/vite.svg'];
const PRECACHE_URLS = [
  'https://unpkg.com/@mapbox/shp-write@0.4.3/dist/shpwrite.js',
  'https://cdn.jsdelivr.net/npm/@mapbox/shp-write@0.4.3/dist/shpwrite.js',
  'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js'
];
self.addEventListener('install', (event) => {
  // @ts-ignore
  if (typeof self.skipWaiting === 'function') self.skipWaiting();
  // @ts-ignore
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // Best-effort cache of app shell for offline navigation
  try { await cache.addAll(APP_SHELL); } catch { /* ignore */ }
      // Precache CDN resources with graceful failures
      await Promise.all(
        PRECACHE_URLS.map(u => fetch(u, { mode: 'no-cors' })
          .then(r => cache.put(u, r.clone()))
          .catch(() => null))
      );
    })()
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
  // Only handle GET requests; let the browser handle others
  if (req.method && req.method !== 'GET') return;
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
  // Navigation requests: try network, fall back to cached index.html when offline
  if (req.mode === 'navigate') {
    // @ts-ignore
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        // If online and ok, return network response
        if (res && res.ok) return res;
        // else fall through to cache
      } catch { /* offline or failed */ }
      const cache = await caches.open(PRECACHE);
      return (await cache.match('/index.html')) || Response.error();
    })());
    return;
  }

  // For same-origin requests, provide a simple cache-first fallback
  try {
    const reqUrl = new URL(url);
    const selfOrigin = self.location.origin;
    if (reqUrl.origin === selfOrigin) {
      // @ts-ignore
      e.respondWith(caches.match(req).then(r => r || fetch(req)));
    }
    // else: allow cross-origin requests to proceed normally
  } catch {
    // If URL parsing fails, don't intercept
  }
});
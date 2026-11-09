// App files only. Never put auth responses or student data in Cache Storage.
const CACHE = 'crs-parent-v7';
const BASE = new URL('./', self.location.href);
const FILES = ['./', './index.html', './privacy.html', './styles.css', './app.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];
const APP_URLS = new Set(FILES.map(path => new URL(path, BASE).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...APP_URLS]))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys
    .filter(key => key.startsWith('crs-parent-') && key !== CACHE)
    .map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  // Exact same-origin allowlist also excludes Supabase, Google, CDN, and other apps.
  if (request.method !== 'GET' || url.origin !== BASE.origin || url.search ||
      !APP_URLS.has(url.href)) return;
  const icon = url.pathname.endsWith('.png');
  event.respondWith(caches.open(CACHE).then(async cache => {
    if (icon) {
      const cached = await cache.match(request);
      if (cached) return cached;
    }
    try {
      // Revalidate app files against the server instead of a stale HTTP cache.
      const response = await fetch(request, { cache: icon ? 'default' : 'no-cache' });
      // A redirect must never save an auth page under an app URL.
      if (response.ok && !response.redirected && response.type === 'basic') {
        await cache.put(request, response.clone());
      }
      return response;
    } catch (error) {
      const cached = await cache.match(request);
      if (cached) return cached;
      throw error;
    }
  }));
});

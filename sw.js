// App files only. Never put auth responses or student data in Cache Storage.
const CACHE = 'crs-parent-v28';
const BASE = new URL('./', self.location.href);
const FILES = ['./', './index.html', './privacy.html', './styles.css', './app.js',
  './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png',
  './icons/apple-touch-icon.png'];
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

function notificationHash(value) {
  return typeof value === 'string' && /^#(?:home|notifications|child\/[\w-]+(?:\/[a-z]+)?)$/.test(value) ? value : '#notifications';
}

self.addEventListener('push', event => {
  let payload;
  try { payload = event.data?.json(); } catch { /* แสดงข้อความสำรอง */ }
  const valid = typeof payload?.id === 'string' && typeof payload.title === 'string' &&
    !!payload.title.trim() && typeof payload.body === 'string';
  const title = valid ? payload.title : 'มีการแจ้งเตือนใหม่';
  event.waitUntil(self.registration.showNotification(title, {
    body: valid ? payload.body : 'เปิดแอปเพื่อดู',
    icon: new URL('icons/icon-192.png', BASE).href,
    ...(valid ? { tag: payload.id } : {}),
    data: { url: valid ? notificationHash(payload.url) : '#notifications' },
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = notificationHash(event.notification.data?.url);
  const destination = new URL(url, BASE).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const indexUrl = new URL('index.html', BASE).href;
    const appWindow = windows.find(client => {
      const page = new URL(client.url);
      page.hash = ''; page.search = '';
      return page.href === BASE.href || page.href === indexUrl;
    });
    if (appWindow) {
      try {
        await appWindow.focus();
        const navigated = await appWindow.navigate(destination);
        (navigated || appWindow).postMessage({ type: 'crs-parent-notification-click', ...(navigated ? {} : { url }) });
        return;
      } catch { /* เปิดหน้าใหม่ได้ถ้าหน้าเดิมปิดไประหว่างดำเนินการ */ }
    }
    await self.clients.openWindow(destination);
  })());
});

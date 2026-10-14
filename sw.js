// Service Worker: macht Lernen offline nutzbar und holt Updates automatisch.
// Die App-Seite kommt immer frisch aus dem Netz (mit Fallback auf den Cache),
// Icons und Schriften werden aus dem Cache bedient.
// Anfragen an die GitHub-API (Aufgaben) laufen nie über den Cache.
const CACHE = 'lernen-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return;
  if (url.pathname.endsWith('/version.json') || url.pathname.includes('/gh/')) return;

  if (req.mode === 'navigate' || url.pathname.endsWith('/index.html')) {
    const net = fetch(url.origin + url.pathname, { cache: 'no-cache', credentials: 'same-origin' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); }
      return res;
    });
    const slow = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000));
    e.respondWith(Promise.race([net, slow]).catch(() => caches.match('./index.html').then(hit => hit || net)));
    return;
  }

  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});

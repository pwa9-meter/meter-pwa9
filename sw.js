/* Meter P.W.A 9 — service worker: app shell offline, CDN + map tiles cached as you go */
const VERSION = 'mpw9-v7';
const SHELL = [
  './', './index.html', './manifest.webmanifest', './css/app.css',
  './js/config.js', './js/seed.js', './js/core.js', './js/store.js', './js/app.js',
  './js/views-a.js', './js/views-b.js', './js/exports.js',
  './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png',
  './img/pwa-seal.png', './img/footer-pwa.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'mpw9-runtime').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // never cache the Apps Script API
  if (url.hostname.endsWith('script.google.com') || url.hostname.endsWith('googleusercontent.com')) return;

  if (url.origin === location.origin) {
    // app files: network first (bypassing the HTTP cache) so updates arrive at once; cache when offline
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then((res) => {
      const copy = res.clone();
      caches.open(VERSION).then((c) => c.put(req, copy));
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./index.html'))));
    return;
  }

  // CDN libraries, fonts, map tiles: cache first
  e.respondWith(caches.open('mpw9-runtime').then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') c.put(req, res.clone());
    return res;
  }).catch(() => hit))));
});

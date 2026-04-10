// 🔄 CHANGE THIS VERSION on every deploy to trigger an update
const CACHE_VERSION = 6;
const CACHE_NAME = `fluxia-v${CACHE_VERSION}`;
const BASE = '';

// Assets to precache on install
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/logo.svg',
  '/fluxia-logo.png',
  '/poop-button.svg',
  '/poop-big.svg',
  '/poop-small.svg',
  '/icons/icon-96x96.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install: precache shell assets, then immediately activate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Don't wait for old SW to stop — activate immediately
  self.skipWaiting();
});

// Activate: delete ALL old caches, then take control of all tabs
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  // Take control of all open tabs immediately (no reload needed for future fetches)
  self.clients.claim();
});

// Listen for message from the app to trigger reload
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ── Web Push ──
self.addEventListener('push', (event) => {
  let data = { title: 'Fluxia', body: 'No has registrado nada hoy. Tu médico necesita esta información 🩺' };
  try { data = { ...data, ...event.data?.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/fluxia-logo.png',
      badge: '/fluxia-logo.png',
      tag: 'fluxia-reminder',
      renotify: true,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

// Fetch: network-first for everything (ensures fresh content)
// Falls back to cache only when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // Skip Supabase API calls — always go to network
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Network-first strategy: try network, update cache, fall back to cache if offline
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Got a fresh response — cache it for offline use
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline — serve from cache
        return caches.match(request);
      })
  );
});

/**
 * Carsel Club service worker (Sprint 27 + 33).
 *
 * Responsibilities:
 * - Sprint 27: push event + notificationclick
 * - Sprint 33:
 *   - Install: precache app shell (offline fallback page, manifest, icons)
 *   - Fetch: network-first for navigation; cache-first for static assets;
 *     fallback ke /offline saat navigation gagal
 *   - Activate: cleanup stale caches
 */

const CACHE_VERSION = "v2";
const SHELL_CACHE = `cc-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `cc-assets-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/offline",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
  "/badge-72.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((url) =>
            cache.add(url).catch((e) => {
              console.warn("[sw] precache fail:", url, e);
            })
          )
        )
      )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== SHELL_CACHE && k !== ASSET_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Don't cache server actions, auth endpoints, or APIs
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/login") ||
    url.pathname.startsWith("/uploads/")
  ) {
    return; // bypass — let browser handle
  }

  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req));
    return;
  }

  // Static asset (_next/static) → cache-first
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(req, ASSET_CACHE));
  }
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const copy = res.clone();
      const cache = await caches.open(SHELL_CACHE);
      cache.put(req, copy).catch(() => {});
    }
    return res;
  } catch (e) {
    const cached = await caches.match(req);
    if (cached) return cached;
    const offline = await caches.match("/offline");
    if (offline) return offline;
    return new Response("Offline", { status: 503 });
  }
}

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req);
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone()).catch(() => {});
    }
    return res;
  } catch (e) {
    if (cached) return cached;
    throw e;
  }
}

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload;
  try {
    payload = event.data.json();
  } catch (e) {
    payload = { title: "Carsel Club", body: event.data.text() };
  }
  const title = payload.title || "Carsel Club";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/badge-72.png",
    tag: payload.tag,
    renotify: payload.renotify === true,
    data: { url: payload.url || "/notifications" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) ||
    "/notifications";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(url);
            return;
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

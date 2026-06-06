/**
 * Carsel Club service worker (Sprint 27).
 *
 * Responsibilities:
 * - push event: parse JSON payload, show notification
 * - notificationclick: focus existing tab w/ url OR open new
 *
 * No offline caching here (Sprint 33 will add PWA shell cache).
 */

self.addEventListener("install", (event) => {
  // Activate immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

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
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus an existing tab w/ same origin + navigate
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            if ("navigate" in client) client.navigate(url);
            return;
          }
        }
        // No tab → open new
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});

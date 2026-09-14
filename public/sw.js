self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Pass-through fetch so the app is installable without serving stale Next.js chunks.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

// Ultron service worker: caches the app shell so Ultron opens offline.
// Bump VERSION whenever app files change so phones pick up the update.
const VERSION = "ultron-v1";
const SHELL = [
  "./",
  "index.html",
  "styles.css",
  "app.js",
  "brain.js",
  "actions.js",
  "laptop.js",
  "offline.js",
  "store.js",
  "voice.js",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "vendor/anthropic-sdk-1.6.0.mjs",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Only serve our own files from cache; API calls (Anthropic, laptop) always go to the network.
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(e.request).then((hit) => {
      const net = fetch(e.request)
        .then((res) => {
          if (res.ok) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => hit);
      return hit || net;
    }),
  );
});

// Tapping a timer/alarm notification brings Ultron back to the front.
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window" }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return self.clients.openWindow("./");
    }),
  );
});

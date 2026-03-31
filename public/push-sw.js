/**
 * push-sw.js — /public/push-sw.js
 */

self.addEventListener("install",  () => self.skipWaiting());
self.addEventListener("activate", e  => e.waitUntil(self.clients.claim()));

// ── Push received ─────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() ?? {}; }
  catch { data = { title: "Unizuya", body: event.data?.text() ?? "" }; }

  const {
    title = "Unizuya",
    body  = "",
    url   = "/dashboard",
    icon  = "/pwa-192.png",
    badge = "/favicon-96x96.png",
    tag   = "unizuya-notif",
    type,
  } = data;

  // Changelog notifications get a dedicated tag so they don't
  // collapse with regular activity notifications
  const notifTag = type === "changelog" ? "unizuya-changelog" : tag;

  event.waitUntil(
    self.registration.showNotification(title, {
      body, icon, badge,
      tag:                notifTag,
      renotify:           true,
      requireInteraction: false,
      data:               { url },
      actions: [
        { action: "open",    title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

// ── Notification clicked ──────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const path      = event.notification.data?.url ?? "/dashboard";
  const targetUrl = path.startsWith("http")
    ? path
    : self.location.origin + path;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clients) => {
        const existing = clients.find(c =>
          new URL(c.url).origin === self.location.origin
        );

        if (existing) {
          await existing.focus();
          existing.postMessage({ type: "SW_NAVIGATE", url: targetUrl });
          return;
        }

        return self.clients.openWindow(targetUrl);
      })
  );
});

// ── Message from app ──────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
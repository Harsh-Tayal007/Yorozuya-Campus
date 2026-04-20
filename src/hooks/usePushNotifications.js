/**
 * usePushNotifications.js
 * Place at: src/hooks/usePushNotifications.js
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { databases } from "@/lib/appwrite";
import { useAuth } from "@/context/AuthContext";

const VAPID_KEY        = import.meta.env.VITE_VAPID_PUBLIC_KEY;
const PUSH_WORKER_URL  = import.meta.env.VITE_PUSH_WORKER_URL;
const DB_ID            = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const USERS_COL        = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID;
const LS_SUB_KEY       = "unizuya_push_sub";
const LS_OPTED_IN_KEY  = "unizuya_push_opted_in";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { currentUser } = useAuth();

  const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  const isSecure    = location.protocol === "https:" || isLocalhost;

  const supported =
    "serviceWorker" in navigator &&
    "PushManager"   in window    &&
    "Notification"  in window    &&
    isSecure;

  const [subscribed, setSubscribed] = useState(() => {
    if (typeof window === "undefined") return false;
    const optedIn    = localStorage.getItem(LS_OPTED_IN_KEY) === "1";
    const notDenied  = !("Notification" in window) || Notification.permission !== "denied";
    return optedIn && notDenied;
  });

  const [permission, setPermission] = useState(() =>
    "Notification" in window ? Notification.permission : "unsupported"
  );
  const [loading, setLoading] = useState(false);
  const swRegRef = useRef(null);

  // ── Register the EXISTING Vite PWA SW (dev-sw.js / sw.js) ────────────────
  // We do NOT register a separate push-sw.js - it can't claim scope "/" because
  // the PWA SW already owns it. Instead we use the PWA SW for background push
  // and Notification API with onclick for foreground/in-tab navigation.
  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready
      .then(reg => {
        swRegRef.current = reg;
        if (!isLocalhost) return reg.pushManager.getSubscription();
        return null;
      })
      .then(sub => {
        if (sub) {
          setSubscribed(true);
          localStorage.setItem(LS_OPTED_IN_KEY, "1");
          localStorage.setItem(LS_SUB_KEY, JSON.stringify(sub));
        } else if (isLocalhost && localStorage.getItem(LS_OPTED_IN_KEY) === "1") {
          setSubscribed(true);
        } else if (!sub && !isLocalhost) {
          setSubscribed(false);
          localStorage.removeItem(LS_OPTED_IN_KEY);
          localStorage.removeItem(LS_SUB_KEY);
        }
      })
      .catch(err => console.warn("[Push] SW ready failed:", err));
  }, [supported, isLocalhost]);

  // ── Watch permission ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!supported) return;
    navigator.permissions?.query({ name: "notifications" }).then(status => {
      setPermission(status.state === "prompt" ? "default" : status.state);
      status.onchange = () => {
        const p = status.state === "prompt" ? "default" : status.state;
        setPermission(p);
        if (status.state === "denied") {
          setSubscribed(false);
          localStorage.removeItem(LS_OPTED_IN_KEY);
        }
      };
    });
  }, [supported]);

  // ── Subscribe ─────────────────────────────────────────────────────────────
  const subscribe = useCallback(async () => {
    if (!supported || loading) return { ok: false, reason: "unsupported" };
    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") { setLoading(false); return { ok: false, reason: "denied" }; }

      // localhost: skip PushManager, just mark opted-in
      if (isLocalhost) {
        setSubscribed(true);
        localStorage.setItem(LS_OPTED_IN_KEY, "1");
        setLoading(false);
        return { ok: true, localOnly: true };
      }

      // https: use the already-registered PWA SW
      const reg = swRegRef.current ?? await navigator.serviceWorker.ready;
      swRegRef.current = reg;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_KEY),
        });
      }

      const subJson = JSON.parse(JSON.stringify(sub));

      if (currentUser?.$id) {
        try {
          await databases.updateDocument(DB_ID, USERS_COL, currentUser.$id, {
            pushSubscription: JSON.stringify(subJson),
          });
        } catch (e) { console.warn("[Push] Appwrite save failed:", e.message); }
      }

      localStorage.setItem(LS_SUB_KEY, JSON.stringify(subJson));
      localStorage.setItem(LS_OPTED_IN_KEY, "1");
      setSubscribed(true);
      setLoading(false);
      return { ok: true, sub: subJson };

    } catch (err) {
      console.error("[Push] Subscribe failed:", err);
      setLoading(false);
      return { ok: false, reason: err.message };
    }
  }, [supported, loading, currentUser, isLocalhost]);

  // ── Unsubscribe ───────────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    try {
      if (!isLocalhost) {
        const reg = swRegRef.current ?? await navigator.serviceWorker.ready;
        const sub = await reg?.pushManager.getSubscription();
        await sub?.unsubscribe();
        if (currentUser?.$id) {
          try { await databases.updateDocument(DB_ID, USERS_COL, currentUser.$id, { pushSubscription: null }); } catch {}
        }
      }
      localStorage.removeItem(LS_SUB_KEY);
      localStorage.removeItem(LS_OPTED_IN_KEY);
      setSubscribed(false);
    } catch (err) { console.error("[Push] Unsubscribe failed:", err); }
    setLoading(false);
  }, [supported, currentUser, isLocalhost]);

  // ── sendViaWorker ─────────────────────────────────────────────────────────
  const sendViaWorker = useCallback(async ({ title, body, url, tag, type, subscription }) => {
    if (!PUSH_WORKER_URL) return false;
    try {
      const sub = subscription ?? JSON.parse(localStorage.getItem(LS_SUB_KEY) ?? "null");
      if (!sub) return false;
      const res = await fetch(`${PUSH_WORKER_URL}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub, title, body, url, tag, type }),
      });
      return res.ok;
    } catch (err) { console.error("[Push] Worker send failed:", err); return false; }
  }, []);

  // ── sendLocal - uses Notification API with onclick for navigation ─────────
  // Key fix: attach onclick BEFORE showing so click redirects the page.
  const sendLocal = useCallback(({ title = "Unizuya", body = "", url = "/dashboard", tag }) => {
    if (!("Notification" in window)) return;
    if (localStorage.getItem(LS_OPTED_IN_KEY) !== "1") return;
    if (Notification.permission !== "granted") return;

    const absoluteUrl = url.startsWith("http") ? url : window.location.origin + url;

    // Use new Notification() directly - onclick works reliably in-tab
    const n = new Notification(title, {
      body,
      icon:  "/favicon.ico",
      badge: "/favicon.ico",
      tag,
    });

    // onclick navigates to the correct URL
    n.onclick = (e) => {
      e.preventDefault();
      window.focus();
      window.location.href = absoluteUrl;
    };
  }, []);

  return {
    supported, subscribed, permission, loading, isLocalhost,
    subscribe, unsubscribe, sendLocal, sendViaWorker,
  };
}
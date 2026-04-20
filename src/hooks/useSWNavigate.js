/**
 * useSWNavigate.js
 * Place at: src/hooks/useSWNavigate.js
 *
 * Handles SW_NAVIGATE messages from push-sw.js.
 * Uses window.location.href for reliable cross-route navigation -
 * simpler and more reliable than pushState + popstate tricks.
 */

import { useEffect } from "react";

export function useSWNavigate() {
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type !== "SW_NAVIGATE") return;
      const url = event.data.url;
      if (!url) return;

      try {
        const parsed   = new URL(url);
        const current  = new URL(window.location.href);

        // Same page - just scroll to hash if present
        if (parsed.pathname === current.pathname && parsed.hash) {
          scrollToHash(parsed.hash);
          return;
        }

        // Different page - navigate with full reload
        // This is the most reliable approach across all browsers
        window.location.href = url;

      } catch {
        window.location.href = url;
      }
    };

    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);
}

// Called on initial load too - handles direct URL with hash (e.g. opening from notification)
export function useHashScroll() {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => scrollToHash(hash), 800);
    }
  }, []);
}

function scrollToHash(hash) {
  let attempts = 0;
  const tryScroll = () => {
    const el = document.querySelector(hash);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      // Brief violet highlight so user knows which reply was linked
      el.style.transition = "background-color 0.4s ease";
      el.style.backgroundColor = "rgba(109, 40, 217, 0.12)";
      setTimeout(() => { el.style.backgroundColor = ""; }, 2500);
    } else if (attempts < 15) {
      attempts++;
      setTimeout(tryScroll, 400);
    }
  };
  setTimeout(tryScroll, 300);
}
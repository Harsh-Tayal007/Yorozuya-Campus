/**

 * Call this ONCE at the top of main.jsx before ReactDOM.createRoot
 * to ensure push-sw.js is always registered independently of the PWA SW.
 */

export function registerPushSW() {
  if (!("serviceWorker" in navigator)) return;

  // Register push-sw.js with a unique scope path
  navigator.serviceWorker
    .register("/push-sw.js", { scope: "/" })
    .then((reg) => {
      console.log("[push-sw] registered, state:", reg.active?.state ?? "installing");

      // Force update if a new version is waiting
      if (reg.waiting) {
        reg.waiting.postMessage({ type: "SKIP_WAITING" });
      }

      reg.addEventListener("updatefound", () => {
        const newSW = reg.installing;
        if (!newSW) return;
        newSW.addEventListener("statechange", () => {
          if (newSW.state === "installed" && reg.waiting) {
            reg.waiting.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
    })
    .catch((err) => console.warn("[push-sw] registration failed:", err));
}
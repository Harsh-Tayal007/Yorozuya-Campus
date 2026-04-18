import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tailwindcss(),
      react(),
      VitePWA({
        registerType: "autoUpdate",
        devOptions: { enabled: true, type: "module" },
        workbox: {
          // Only precache the shell (HTML + CSS + fonts).
          // JS chunks are served via StaleWhileRevalidate so they
          // never block the install event or inflate TBT.
          globPatterns: ["**/*.{html,css,woff2,ico,png,webp,svg}"],
          globIgnores: ["push-sw.js", "sw.js", "workbox-*.js"],
          navigateFallbackDenylist: [/^\/push-sw\.js/],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              // JS chunks — stale-while-revalidate so they're served
              // from cache immediately and updated in background
              urlPattern: /assets\/.*\.js$/,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "js-chunks",
                expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
              },
            },
          ],
        },
        manifest: {
          id: "/",
          name: "Unizuya",
          short_name: "Unizuya",
          description: "A unified academic platform - PYQs, syllabus, resources and a student forum, all in one place.",
          theme_color: "#0b0f19",
          background_color: "#0b0f19",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          icons: [
            { src: "pwa-192.png",          sizes: "192x192", type: "image/png", purpose: "any"      },
            { src: "pwa-512.png",          sizes: "512x512", type: "image/png", purpose: "any"      },
            { src: "pwa-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
            { src: "pwa-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
          screenshots: [
            { src: "screenshots/desktop.png", sizes: "1280x720", type: "image/png", form_factor: "wide",   label: "Unizuya — Home"      },
            { src: "screenshots/mobile.png",  sizes: "390x844",  type: "image/png", form_factor: "narrow", label: "Unizuya — Dashboard" },
          ],
        },
      }),
    ],

    build: {
      rollupOptions: {
        output: {
          // Function form lets us inspect the actual module ID path,
          // which is the only reliable way to split node_modules.
          manualChunks(id) {
            // ── Core framework — tiny, always needed ──────────────────────
            if (id.includes("/node_modules/react/") ||
                id.includes("/node_modules/react-dom/") ||
                id.includes("/node_modules/react-router") ||
                id.includes("/node_modules/scheduler/"))
              return "vendor"

            // ── Appwrite SDK ─────────────────────────────────────────────
            if (id.includes("/node_modules/appwrite/"))
              return "appwrite"

            // ── Framer Motion ────────────────────────────────────────────
            if (id.includes("/node_modules/framer-motion/"))
              return "motion"

            // ── TipTap editor ────────────────────────────────────────────
            if (id.includes("/node_modules/@tiptap/"))
              return "editor"

            // ── jsPDF ────────────────────────────────────────────────────
            // Already dynamically imported but Rollup may still group it.
            if (id.includes("/node_modules/jspdf/") ||
                id.includes("/node_modules/jspdf.es"))
              return "jspdf"

            // ── html2canvas ──────────────────────────────────────────────
            if (id.includes("/node_modules/html2canvas/"))
              return "html2canvas"

            // ── TanStack Query ───────────────────────────────────────────
            if (id.includes("/node_modules/@tanstack/"))
              return "query"

            // ── UI utilities ─────────────────────────────────────────────
            if (id.includes("/node_modules/lucide-react/"))
              return "ui"

            // ── DOMPurify ────────────────────────────────────────────────
            if (id.includes("/node_modules/dompurify/") ||
                id.includes("/node_modules/isomorphic-dompurify/"))
              return "purify"

            // ── Sonner (toast) ───────────────────────────────────────────
            if (id.includes("/node_modules/sonner/"))
              return "sonner"

            // ── IDB (IndexedDB persister) ────────────────────────────────
            if (id.includes("/node_modules/idb-keyval/") ||
                id.includes("/node_modules/idb/"))
              return "idb"

            // Everything else → Rollup decides (your own app code gets
            // split per route automatically via the lazy() imports).
          },
        },
      },
    },

    server: {
      proxy: {
        "/anthropic": {
          target: "https://api.anthropic.com",
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/anthropic/, ""),
          headers: {
            "x-api-key": env.VITE_ANTHROPIC_API_KEY ?? "",
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
        },
      },
    },

    define: {
      "import.meta.env.VITE_BUILD_TIME": JSON.stringify(Date.now().toString()),
    },

    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
  };
});
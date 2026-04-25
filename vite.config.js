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
          globPatterns: ["**/*.{html,css,woff2}"],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          runtimeCaching: [
            {
              urlPattern: /\.(?:js)$/,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "js-cache",
                expiration: { maxEntries: 60 },
              },
            },
          ],
          skipWaiting: true,
          clientsClaim: true,
        },
        manifest: {
          id: "/",
          name: "Unizuya",
          short_name: "Unizuya",
          description:
            "A unified academic platform - PYQs, syllabus, resources and a student forum, all in one place.",
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
            { src: "screenshots/desktop.png", sizes: "1280x720", type: "image/png", form_factor: "wide",   label: "Unizuya - Home"      },
            { src: "screenshots/mobile.png",  sizes: "390x844",  type: "image/png", form_factor: "narrow", label: "Unizuya - Dashboard" },
          ],
        },
      }),
    ],

    build: {
      rollupOptions: {
        output: {
          // Object form is safe - Rollup handles initialization order correctly.
          // Function form isolates chunks too aggressively and breaks
          // framer-motion / D3 / TipTap which need React to be ready first.
          manualChunks: {
            vendor:   ["react", "react-dom", "react-router-dom"],
            appwrite: ["appwrite"],
            motion:   ["framer-motion"],
            editor:   ["@tiptap/react", "@tiptap/starter-kit"],
            ui:       ["lucide-react"],
            query:    ["@tanstack/react-query"],
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
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
        devOptions: {
          enabled: true,
          type: "module",
        },
        workbox: {
          // Exclude push-sw.js — it must register itself independently
          // so the PushManager scope is correct and it isn't versioned/cached
          // by Workbox (which would break push subscription renewal)
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
          globIgnores: ["push-sw.js"],
          // Don't let the PWA SW claim push-sw.js routes
          navigateFallbackDenylist: [/^\/push-sw\.js/],
        },
        manifest: {
          id: "/",
          name: "UniZuya",
          short_name: "UniZuya",
          description: "University resources and PYQs platform",
          theme_color: "#0b0f19",
          background_color: "#0b0f19",
          display: "standalone",
          orientation: "portrait",
          start_url: "/",
          scope: "/",
          icons: [
            { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
            { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
      }),
    ],

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
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
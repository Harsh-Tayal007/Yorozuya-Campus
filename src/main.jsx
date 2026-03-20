import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

import { AuthProvider } from "@/context/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { persistQueryClient } from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { Toaster } from "sonner"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

localStorage.removeItem("REACT_QUERY_OFFLINE_CACHE")

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60,

  // ── Auto-busts cache on every new build ──────────────────────────────────
  // Vite replaces import.meta.env.VITE_BUILD_TIME at build time with the
  // current timestamp. Old localStorage cache from previous deploys is
  // automatically discarded when this value changes.
  // In dev (no VITE_BUILD_TIME set) falls back to "dev" so dev cache
  // is always treated as a separate bucket from production.
  buster: import.meta.env.VITE_BUILD_TIME ?? "dev",

  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      const key = query.queryKey[0]
      const forumKeys = ["replies", "threads", "thread"]
      return !forumKeys.includes(key)
    },
  },
})

// ── Capture PWA install prompt before React mounts ───────────────────────────
window.__pwaInstallPrompt = null
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault()
  window.__pwaInstallPrompt = e
})

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
    <Toaster position="bottom-right" richColors closeButton toastOptions={{ duration: 4000 }} />
  </React.StrictMode>
)
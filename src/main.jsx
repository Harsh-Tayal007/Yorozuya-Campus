import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

import { AuthProvider }            from "@/context/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster }                 from "sonner"
import { PushNotificationProvider } from "./context/PushNotificationContext"

// ── QueryClient ───────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:          1000 * 60 * 30,
      gcTime:             1000 * 60 * 60,
      refetchOnWindowFocus:  false,
      refetchOnReconnect:    false,
      refetchOnMount:        false,
    },
  },
})

// ── IDB persister — initialised lazily off the critical path ─────────────────
// We do NOT await this before rendering. React mounts immediately with an empty
// cache; the persisted cache hydrates in the background once IDB responds.
// This avoids any synchronous localStorage access on the main thread.
function initPersister() {
  import("@tanstack/react-query-persist-client").then(({ persistQueryClient }) =>
    import("@tanstack/query-async-storage-persister").then(({ createAsyncStoragePersister }) =>
      import("idb-keyval").then(({ get, set, del }) => {
        const persister = createAsyncStoragePersister({
          storage: { getItem: get, setItem: set, removeItem: del },
          key: "uz_rq_cache",
        })

        persistQueryClient({
          queryClient,
          persister,
          maxAge: 1000 * 60 * 60,
          buster: import.meta.env.VITE_BUILD_TIME ?? "dev",
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => {
              const key = query.queryKey[0]
              // Don't cache forum content — always fresh
              return !["replies", "threads", "thread"].includes(key)
            },
          },
        })
      })
    )
  )
}

// ── PWA install prompt ────────────────────────────────────────────────────────
window.__pwaInstallPrompt = null
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault()
  window.__pwaInstallPrompt = e
})

// ── Render immediately — don't block on persister init ───────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PushNotificationProvider>
          <App />
        </PushNotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
    <Toaster position="bottom-right" richColors closeButton toastOptions={{ duration: 4000 }} />
  </React.StrictMode>
)

// Init persister after first render — zero impact on LCP/TBT
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(initPersister, { timeout: 3000 })
} else {
  setTimeout(initPersister, 1000)
}
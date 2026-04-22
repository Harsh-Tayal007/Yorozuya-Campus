import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

import { AuthProvider }            from "@/context/AuthContext"
import { UIPrefsProvider }         from "@/context/UIPrefsContext"
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

// ── IDB persister - initialised lazily off the critical path ─────────────────
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
              // Don't cache forum content - always fresh
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

// ── Render immediately - don't block on persister init ───────────────────────
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIPrefsProvider>
          <PushNotificationProvider>
            <App />
          </PushNotificationProvider>
        </UIPrefsProvider>
      </AuthProvider>
    </QueryClientProvider>
    <Toaster 
      position="bottom-right" 
      toastOptions={{ 
        duration: 3500, 
        className: "border-border shadow-2xl backdrop-blur-xl bg-card text-foreground",
        classNames: {
          toast: "group !bg-card !backdrop-blur-xl !border-border !shadow-2xl rounded-2xl flex items-center p-4 gap-3 text-sm font-medium !text-foreground",
          success: "!text-emerald-400 [&>svg]:!text-emerald-400",
          error: "!text-destructive [&>svg]:!text-destructive",
          info: "!text-sky-400 [&>svg]:!text-sky-400",
          warning: "!text-amber-400 [&>svg]:!text-amber-400",
          actionButton: "!bg-primary !text-primary-foreground !rounded-xl !px-3 !py-1.5 !text-xs !font-bold hover:!opacity-90 transition-opacity",
          cancelButton: "!bg-muted !text-muted-foreground !rounded-xl !px-3 !py-1.5 !text-xs !font-bold hover:!bg-muted/80 transition-colors"
        }
      }} 
    />
  </React.StrictMode>
)

// Init persister after first render - zero impact on LCP/TBT
if (typeof requestIdleCallback !== "undefined") {
  requestIdleCallback(initPersister, { timeout: 3000 })
} else {
  setTimeout(initPersister, 1000)
}
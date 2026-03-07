import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

import { AuthProvider } from "@/context/AuthContext"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { persistQueryClient } from "@tanstack/react-query-persist-client"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 min
      gcTime: 1000 * 60 * 60,    // 1 hour
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60, // 1 hour

  // ── KEY FIX ──────────────────────────────────────────────────────────────
  // Exclude forum queries from persistence entirely.
  // "replies" and "threads" always fetch fresh from Appwrite.
  // Academic queries (subjects, resources, etc.) still get cached.
  // ─────────────────────────────────────────────────────────────────────────
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      const key = query.queryKey[0]
      const forumKeys = ["replies", "threads", "thread"]
      return !forumKeys.includes(key)
    },
  },
})

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
)
import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"

import { AuthProvider } from "@/context/AuthContext"
import { QueryClient, QueryClientProvider} from "@tanstack/react-query"

import {
  persistQueryClient,
} from "@tanstack/react-query-persist-client"

import {
  createSyncStoragePersister,
} from "@tanstack/query-sync-storage-persister"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30 min
      gcTime: 1000 * 60 * 60, // 1 hour
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  
})

// Persist cache
persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60, // 1 hour persistence
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
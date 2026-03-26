/**
 
 * Wraps usePushNotifications in a React Context so:
 *  - State is shared across all components (bell, settings, task tracker)
 *  - No per-component re-initialisation on re-render
 *  - Toggle state persists across route changes
 *
 * Add <PushNotificationProvider> inside your app's provider tree,
 * just inside <AuthContext.Provider>:
 *
 *   <AuthProvider>
 *     <PushNotificationProvider>   ← add this
 *       <QueryClientProvider ...>
 *         <App />
 *       </QueryClientProvider>
 *     </PushNotificationProvider>
 *   </AuthProvider>
 */

import { createContext, useContext } from "react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const PushCtx = createContext(null);

export function PushNotificationProvider({ children }) {
  // Called ONCE at the top of the tree — state never re-initialises
  const push = usePushNotifications();
  return <PushCtx.Provider value={push}>{children}</PushCtx.Provider>;
}

// Use this instead of usePushNotifications() everywhere
export function usePush() {
  const ctx = useContext(PushCtx);
  if (!ctx) throw new Error("usePush must be used inside <PushNotificationProvider>");
  return ctx;
}
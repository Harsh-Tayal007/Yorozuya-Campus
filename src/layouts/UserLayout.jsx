import { Navbar, UserSidebar } from "@/components"
import { useAuth } from "@/context/AuthContext"
import { useSidebar } from "@/context/SidebarContext"
import { useTrackActivity } from "@/hooks/useTrackActivity"
import { Outlet, useLocation } from "react-router-dom"
import { lazy, Suspense, useState, useEffect } from "react"

const TargetCursor = lazy(() => import("@/components/home/TargetCursor"))

const UserLayout = () => {
  useTrackActivity()
  const { user } = useAuth()
  const { handleEdgeHover } = useSidebar()
  const { pathname } = useLocation()

  // Target cursor preference logic
  const targetCursorEnabled = useState(() => localStorage.getItem("pref_target_cursor") === "1")[0]
  const [targetCursorReady, setTargetCursorReady] = useState(false)
  const isDashboardRoute = pathname.startsWith("/dashboard")

  useEffect(() => {
    if (!targetCursorEnabled || !isDashboardRoute) return
    const id = requestIdleCallback
      ? requestIdleCallback(() => setTargetCursorReady(true), { timeout: 1000 })
      : setTimeout(() => setTargetCursorReady(true), 300)
    return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id))
  }, [targetCursorEnabled, isDashboardRoute])

  return (
    <div
      onMouseMove={handleEdgeHover}
      className="flex min-h-screen
                 bg-gradient-to-b from-slate-50 to-slate-100
                 dark:from-[#0f172a] dark:to-[#020617]"
    >
      <Navbar />
      <UserSidebar />
      {/* min-w-0 prevents flex child from overflowing on mobile */}
      <div className="flex-1 min-w-0">
        <main className="pt-[68px]">
          <Outlet />
        </main>
      </div>

      {targetCursorEnabled && isDashboardRoute && targetCursorReady && (
        <Suspense fallback={null}>
          <TargetCursor />
        </Suspense>
      )}
    </div>
  )
}

export default UserLayout
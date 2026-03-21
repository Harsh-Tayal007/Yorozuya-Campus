// src/layouts/DashboardLayout.jsx
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Settings } from "lucide-react"
import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import { useSidebar } from "@/context/SidebarContext"
import { useEffect } from "react"
import { motion } from "framer-motion"

// ── Loading skeleton ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted/60 rounded-xl" />
          <div className="h-4 w-64 bg-muted/40 rounded-xl" />
        </div>
        <div className="h-8 w-36 bg-muted/40 rounded-xl" />
      </div>
      <div className="h-px bg-border/40" />
      <div className="space-y-3">
        <div className="h-24 bg-muted/30 rounded-2xl" />
        <div className="h-24 bg-muted/30 rounded-2xl" />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const DashboardLayout = () => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { data: identity, isLoading, error } = useAcademicIdentity()
  const { handleEdgeHover } = useSidebar()

  // Persist last visited dashboard route for back-navigation
  useEffect(() => {
    if (location.pathname !== "/dashboard") {
      localStorage.setItem("lastDashboardRoute", location.pathname)
    }
  }, [location.pathname])

  if (isLoading) {
    return (
      <div className="flex-1 min-w-0 overflow-x-hidden">
        <DashboardSkeleton />
      </div>
    )
  }

  if (error || !identity) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-destructive">Failed to load academic information.</p>
      </div>
    )
  }

  return (
    <div onMouseMove={handleEdgeHover} className="flex-1 min-w-0 overflow-x-hidden">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-0">

        {/* Header bar */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border/50"
        >
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground truncate">
              {identity.branch?.name}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {identity.program?.name}
              {identity.university?.name ? ` · ${identity.university.name}` : ""}
            </p>
          </div>

          <button
            onClick={() => navigate("/dashboard/settings?tab=academic")}
            className="inline-flex items-center gap-1.5 text-xs font-medium
                       text-muted-foreground hover:text-foreground
                       border border-border/60 hover:border-border
                       bg-card/60 backdrop-blur-sm hover:bg-card/80
                       px-3 py-2 rounded-xl transition-all duration-150
                       active:scale-[0.97] shrink-0 self-start sm:self-auto"
          >
            <Settings size={13} />
            Change Preferences
          </button>
        </motion.div>

        {/* Page content — no extra top padding, Outlet handles its own spacing */}
        <div className="pt-6">
          <Outlet />
        </div>

      </div>
    </div>
  )
}

export default DashboardLayout
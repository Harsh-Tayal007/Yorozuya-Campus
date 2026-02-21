import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Settings } from "lucide-react"
import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import { useSidebar } from "@/context/SidebarContext"
import { useEffect } from "react"

const DashboardContent = () => {
  const navigate = useNavigate()
  const { data: identity, isLoading, error } = useAcademicIdentity()
  const { handleEdgeHover } = useSidebar()

  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/dashboard") {
      localStorage.setItem("lastDashboardRoute", location.pathname);
    }
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">
          Loading your dashboard...
        </p>
      </div>
    )
  }

  if (error || !identity) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-red-500">
          Failed to load academic information.
        </p>
      </div>
    )
  }

  return (
    <div
      onMouseMove={handleEdgeHover}
      className="flex min-h-screen"
    >

      <div className="flex-1 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#0f172a] dark:to-[#020617]">
        <div className="max-w-6xl mx-auto px-4 py-6">

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {identity.branch?.name}
              </h1>

              <p className="text-sm text-muted-foreground">
                {identity.program?.name} · {identity.university?.name}
              </p>
            </div>

            <button
              onClick={() => navigate("/dashboard/settings")}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              <Settings className="h-4 w-4" />
              Change Preferences
            </button>
          </div>

          <div className="mt-4 mb-2 border-b border-border" />

          <div className="space-y-6">
            <Outlet />
          </div>

        </div>
      </div>
    </div>
  )
}

const DashboardLayout = () => {
  return <DashboardContent />
}

export default DashboardLayout
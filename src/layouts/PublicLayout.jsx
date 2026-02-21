import { Outlet } from "react-router-dom"
import { Navbar, UserSidebar } from "@/components"
import { useAuth } from "@/context/AuthContext"
import { useSidebar } from "@/context/SidebarContext"

const PublicLayout = () => {
  const { user } = useAuth()
  const { handleEdgeHover } = useSidebar()

  return (
    <div
      onMouseMove={handleEdgeHover}
      className="
      flex min-h-screen
      bg-gradient-to-b
      from-slate-50
      to-slate-100
      dark:from-[#0f172a]
      dark:to-[#020617]
    ">
      <Navbar />
      <UserSidebar />
      <div className="flex-1">
        <main className="pt-[68px]">
          <Outlet />
        </main>
      </div>
      {/* optional Footer */}
    </div>
  )
}

export default PublicLayout

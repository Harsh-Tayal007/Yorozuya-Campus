import { Navbar, UserSidebar } from "@/components"
import { useAuth } from "@/context/AuthContext"
import { useSidebar } from "@/context/SidebarContext"
import { Outlet } from "react-router-dom"

const UserLayout = () => {
  const { user } = useAuth()
  const { handleEdgeHover } = useSidebar()

  return (

    <div
    onMouseMove={handleEdgeHover}
     className="flex min-h-screen
      bg-gradient-to-b
      from-slate-50
      to-slate-100
      dark:from-[#0f172a]
      dark:to-[#020617]">
      <Navbar />
      <UserSidebar />
      <div className="flex-1">
        <Navbar />
        <main className="pt-[68px]">
          <Outlet />
        </main>
      </div>
    </div>

  )
}

export default UserLayout
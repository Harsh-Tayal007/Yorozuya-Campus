// src/layouts/PublicLayout.jsx
import { Outlet } from "react-router-dom"
import { Navbar } from "@/components"
import { SIDEBAR_W, NAVBAR_H } from "@/components/common/layout/UserSidebar"
import { UserSidebar } from "@/components"
import { useSidebar } from "@/context/SidebarContext"
import { useTrackActivity } from "@/hooks/useTrackActivity"

const PublicLayout = () => {
  useTrackActivity()
  const { isPinned, isMobile, handleEdgeHover } = useSidebar()

  // Shift content right only when pinned/docked — overlay when just hovering
  const marginLeft = (!isMobile && isPinned) ? SIDEBAR_W : 0

  return (
    <div
  onMouseMove={handleEdgeHover}
  className="min-h-screen"
>
      <Navbar />
      <UserSidebar />

      <div
        style={{
          paddingTop: NAVBAR_H,
          marginLeft: marginLeft,
          transition: "margin-left 200ms ease-in-out",
        }}
        className="min-h-screen flex flex-col"
      >
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default PublicLayout
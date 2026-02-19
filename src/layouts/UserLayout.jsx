import { Outlet } from "react-router-dom"
import { Navbar, UserSidebar } from "@/components"
import { useState, useEffect } from "react"

const UserLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarPinned, setIsSidebarPinned] = useState(false)

  useEffect(() => {
    if (isSidebarPinned) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }, [isSidebarPinned])

  const handleMouseMove = (e) => {
    if (window.innerWidth >= 1024) {
      if (!isSidebarPinned && e.clientX <= 8) {
        setIsSidebarOpen(true)
      }
    }
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      className="
        min-h-screen
        bg-gradient-to-b
        from-slate-50
        to-slate-100
        dark:from-[#0f172a]
        dark:to-[#020617]
      "
    >
      <Navbar
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isSidebarPinned={isSidebarPinned}
        setIsSidebarPinned={setIsSidebarPinned}
      />

      <UserSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isPinned={isSidebarPinned}
        setIsPinned={setIsSidebarPinned}
      />

      <main className="pt-[68px] flex-1">
        <Outlet />
      </main>
    </div>
  )
}

export default UserLayout

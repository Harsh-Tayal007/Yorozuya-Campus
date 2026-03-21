// src/components/common/navigation/UserSidebar.jsx
import { useLocation, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { Pin, PinOff, X, ChevronDown } from "lucide-react"
import { useSidebar } from "@/context/SidebarContext"
import { useAuth } from "@/context/AuthContext"
import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import {
  dashboardRootLink,
  dashboardSidebarSections,
  forumRootLink,
  homeRootLink,
} from "@/config/dashboardSidebarConfig"

const NAVBAR_H  = 68
const SIDEBAR_W = 256

export { SIDEBAR_W, NAVBAR_H }

export default function UserSidebar() {
  const {
    isOpen, setIsOpen,
    isPinned, isMobile,
    togglePin, handleSidebarLeave,
  } = useSidebar()

  const location = useLocation()
  const { user } = useAuth()
  const isLoggedIn = !!user

  const [openSections, setOpenSections] = useState([])

  // On mobile only: close sidebar on route change
  // On desktop: never auto-close — user controls it via pin/hover
  useEffect(() => {
    if (isMobile) setIsOpen(false)
  }, [location.pathname, isMobile])

  // Auto-open section that contains the active route
  useEffect(() => {
    const active = dashboardSidebarSections.find(s =>
      s.children.some(c => location.pathname.startsWith(c.path))
    )
    if (active) {
      setOpenSections(prev =>
        prev.includes(active.id) ? prev : [...prev, active.id]
      )
    }
  }, [location.pathname])

  const visible = isOpen || isPinned

  // Top-level nav links — always show Home and Forum regardless of auth
  // Dashboard only if logged in
  const topLinks = [
    homeRootLink,
    ...(isLoggedIn ? [dashboardRootLink] : []),
    forumRootLink,  // always visible
  ]

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar panel */}
      <aside
        onMouseLeave={handleSidebarLeave}
        style={{
          top:       isMobile ? 0 : NAVBAR_H,
          width:     SIDEBAR_W,
          transform: visible ? "translateX(0)" : "translateX(-100%)",
          zIndex:    50,
        }}
        className="fixed left-0 bottom-0
                   flex flex-col
                   bg-white/80 dark:bg-[#0b1220]/95
                   backdrop-blur-xl backdrop-saturate-150
                   border-r border-white/10 dark:border-white/5
                   shadow-[4px_0_24px_rgba(0,0,0,0.12)]
                   transition-transform duration-200 ease-in-out
                   overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3
                        border-b border-border/40 shrink-0">
          <Link to="/" className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-indigo-500
                            to-purple-500 shrink-0" />
            <span className="text-sm font-semibold text-foreground truncate">
              Unizuya
            </span>
          </Link>

          <button
            onClick={togglePin}
            title={isMobile ? "Close" : isPinned ? "Unpin sidebar" : "Pin sidebar"}
            className="p-1.5 rounded-lg text-muted-foreground
                       hover:text-foreground hover:bg-muted
                       transition-colors duration-150 shrink-0"
          >
            {isMobile
              ? <X size={15} />
              : isPinned
                ? <PinOff size={14} />
                : <Pin size={14} />
            }
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">

          {/* Top flat links */}
          {topLinks.map(item => {
            const isActive = item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path)
            return (
              <SidebarLink key={item.path} to={item.path}
                icon={item.icon} label={item.label} isActive={isActive} />
            )
          })}

          {/* Collapsible sections — logged-in only */}
          {isLoggedIn && (
            <>
              <div className="h-px bg-border/40 mx-1 my-2" />

              {dashboardSidebarSections.map(section => {
                const isExpanded = openSections.includes(section.id)
                const SIcon = section.icon

                return (
                  <div key={section.id}>
                    <button
                      onClick={() => setOpenSections(prev =>
                        prev.includes(section.id)
                          ? prev.filter(id => id !== section.id)
                          : [...prev, section.id]
                      )}
                      className="w-full flex items-center justify-between
                                 px-3 py-2 rounded-lg
                                 text-xs font-semibold uppercase tracking-wide
                                 text-muted-foreground hover:text-foreground
                                 hover:bg-muted transition-colors duration-150"
                    >
                      <div className="flex items-center gap-2">
                        <SIcon size={13} />
                        {section.label}
                      </div>
                      <ChevronDown size={13}
                        className={`transition-transform duration-200
                                    ${isExpanded ? "rotate-180" : ""}`} />
                    </button>

                    {isExpanded && (
                      <div className="ml-4 border-l border-border/40 pl-2
                                      mt-0.5 space-y-0.5">
                        {section.children.map(item => {
                          const isActive = location.pathname.startsWith(item.path)
                          return (
                            <SidebarLink key={item.path} to={item.path}
                              icon={item.icon} label={item.label}
                              isActive={isActive} small />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </nav>
      </aside>
    </>
  )
}

function SidebarLink({ to, icon: Icon, label, isActive, small }) {
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-2.5 rounded-lg
                  transition-colors duration-150 whitespace-nowrap
                  ${small ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm font-medium"}
                  ${isActive
                    ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-0.5
                         rounded-r bg-indigo-500" />
      )}
      <Icon size={small ? 14 : 16} className="shrink-0" />
      {label}
    </Link>
  )
}
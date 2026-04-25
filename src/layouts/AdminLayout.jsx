// src/layouts/AdminLayout.jsx
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useState, useEffect, useRef } from "react"
import { PERMISSIONS } from "@/config/permissions"
import {
  LayoutDashboard, School, BookOpen, Layers, FileText,
  Activity, Menu, Users, GitBranch, Upload, ClipboardList,
  ChevronDown, LogOut, User as UserIcon, BarChart2, ShieldX,
  Megaphone,
  ClipboardCheck, Mail, Palette
} from "lucide-react"
import { useTrackActivity } from "@/hooks/useTrackActivity"

const NAVBAR_H = 58
const SIDEBAR_W = 224  // 14rem
const COLLAPSED_W = 56   // 3.5rem

const adminNav = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard, permission: PERMISSIONS.VIEW_ADMIN_DASHBOARD },
  { label: "Universities", to: "/admin/universities", icon: School, permission: PERMISSIONS.MANAGE_UNIVERSITIES },
  { label: "Programs", to: "/admin/programs", icon: BookOpen, permission: PERMISSIONS.MANAGE_PROGRAMS },
  { label: "Branches", to: "/admin/branches", icon: GitBranch, permission: PERMISSIONS.MANAGE_PROGRAMS },
  { label: "Syllabus", to: "/admin/syllabus", icon: ClipboardList, permission: PERMISSIONS.MANAGE_SYLLABUS },
  { label: "Units", to: "/admin/units", icon: Layers, permission: PERMISSIONS.MANAGE_UNITS },
  { label: "Resources", to: "/admin/resources/upload", icon: Upload, permission: PERMISSIONS.MANAGE_RESOURCES },
  { label: "PYQs", to: "/admin/pyq/upload", icon: FileText, permission: PERMISSIONS.MANAGE_RESOURCES },
  { label: "Activity", to: "/admin/activity", icon: Activity, permission: PERMISSIONS.VIEW_ACTIVITY_LOG },
  { label: "Stats", to: "/admin/stats", icon: BarChart2, permission: PERMISSIONS.VIEW_ACTIVITY_LOG },
  { label: "User Roles", to: "/admin/roles", icon: Users, permission: PERMISSIONS.MANAGE_USERS },
  { label: "Moderation", to: "/admin/moderation", icon: ShieldX, permission: PERMISSIONS.VIEW_REPORTS },
  { label: "Updates", to: "/admin/updates", icon: Megaphone, permission: PERMISSIONS.VIEW_ADMIN_DASHBOARD },
  { label: "Attendance", to: "/admin/attendance", icon: ClipboardCheck, permission: PERMISSIONS.VIEW_ATTENDANCE_REPORTS },
  { label: "Contact Messages", to: "/admin/contact-messages", icon: Mail, permission: PERMISSIONS.VIEW_CONTACT_MESSAGES },
  { label: "Platform Settings", to: "/admin/ui-config", icon: Palette, permission: PERMISSIONS.MANAGE_UI_CONFIG },
]

function AdminTopBar({ sidebarOpen, setSidebarOpen }) {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const [rect, setRect] = useState(null)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [dropdownOpen])

  const handleOpen = () => {
    setRect(triggerRef.current?.getBoundingClientRect() ?? null)
    setDropdownOpen(v => !v)
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate("/", { replace: true })
  }

  return (
    <>
      <header
        style={{ height: NAVBAR_H }}
        className="fixed top-0 left-0 right-0 z-50
                   bg-white/90 dark:bg-[#0b1220]/90
                   backdrop-blur-xl border-b border-border
                   flex items-center px-4 gap-3 shadow-sm"
      >
        {/* ── Single hamburger - controls sidebar ── */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground
                     hover:bg-muted transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        <Link to="/" className="text-lg font-semibold tracking-tight
                                 hover:text-primary transition-colors">
          Unizuya
        </Link>

        <span className="hidden sm:block text-[10px] font-bold tracking-widest
                          uppercase text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
          Admin
        </span>

        <div className="flex-1" />

        {currentUser && (
          <button
            ref={triggerRef}
            onClick={handleOpen}
            className="flex items-center gap-2 rounded-full px-2.5 py-1.5
                       bg-muted/60 hover:bg-muted transition-colors"
          >
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name}
                className="w-7 h-7 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
                              flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {(currentUser.name || currentUser.email)?.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden sm:block text-sm font-medium truncate max-w-[120px]">
              {currentUser.name || currentUser.email}
            </span>
            <ChevronDown size={13} className={`hidden sm:block text-muted-foreground
                                               transition-transform duration-200
                                               ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </header>

      {dropdownOpen && rect && (
        <div
          ref={dropdownRef}
          style={{ position: "fixed", top: rect.bottom + 8, right: window.innerWidth - rect.right }}
          className="w-52 z-[9999] rounded-2xl border border-border bg-background
                     shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden p-1.5
                     animate-in fade-in-0 zoom-in-95 duration-100 origin-top-right"
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-0.5">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name}
                className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
                              flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {(currentUser?.name || currentUser?.email)?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground truncate">@{currentUser?.username}</p>
            </div>
          </div>

          <div className="h-px bg-border mx-1 mb-1" />

          <Link to={`/profile/${currentUser?.username}`} onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm
                       text-foreground hover:bg-muted transition-colors duration-150">
            <UserIcon size={14} className="text-muted-foreground shrink-0" />
            View Profile
          </Link>

          <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm
                       text-foreground hover:bg-muted transition-colors duration-150">
            <LayoutDashboard size={14} className="text-muted-foreground shrink-0" />
            User Dashboard
          </Link>

          <div className="h-px bg-border mx-1 my-1" />

          <button onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm
                       text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <LogOut size={14} className="shrink-0" />
            Logout
          </button>
        </div>
      )}
    </>
  )
}

export default function AdminLayout() {
  useTrackActivity()
  const { hasPermission } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
      else setSidebarOpen(true)
    }
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  return (
    <div className="min-h-screen bg-muted/40">

      <AdminTopBar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Mobile overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed left-0 right-0 bottom-0 z-40 bg-black/50 backdrop-blur-sm"
          style={{ top: NAVBAR_H }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - no inner toggle, controlled only by top bar hamburger */}
      <aside
        style={{
          top: NAVBAR_H,
          width: sidebarOpen ? SIDEBAR_W : (isMobile ? 0 : COLLAPSED_W),
        }}
        className="fixed left-0 bottom-0 z-50
                   bg-background border-r border-border
                   transition-[width] duration-200 ease-in-out
                   overflow-hidden flex flex-col"
      >
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
          {adminNav.map((item) => {
            if (!hasPermission(item.permission)) return null
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin/dashboard"}
                onClick={() => { if (isMobile) setSidebarOpen(false) }}
                title={!sidebarOpen ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-lg px-2.5 py-2
                   text-sm font-medium transition-colors whitespace-nowrap
                   ${isActive
                    ? "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5
                                      rounded-r transition-opacity
                                      ${isActive ? "bg-purple-600 opacity-100" : "opacity-0"}`} />
                    <Icon size={17} className="shrink-0" />
                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </aside>

      <main
        style={{
          paddingTop: NAVBAR_H,
          marginLeft: isMobile ? 0 : (sidebarOpen ? SIDEBAR_W : COLLAPSED_W),
        }}
        className="min-h-screen transition-[margin-left] duration-200 ease-in-out"
      >
        <div className="p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
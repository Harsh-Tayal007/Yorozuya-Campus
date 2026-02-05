import { Outlet, NavLink } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"

import { PERMISSIONS } from "@/config/permissions"

import {
  LayoutDashboard,
  School,
  BookOpen,
  Layers,
  FileText,
  Activity,
  Menu,
  Users
} from "lucide-react"

const adminNav = [
  {
    label: "Dashboard",
    to: "/admin/dashboard",
    icon: LayoutDashboard,
    permissions: [PERMISSIONS.VIEW_ADMIN_DASHBOARD],
  },
  {
    label: "Universities",
    to: "/admin/universities",
    icon: School,
    permissions: [PERMISSIONS.MANAGE_UNIVERSITIES],
  },
  {
    label: "Programs",
    to: "/admin/programs",
    icon: BookOpen,
    permissions: [PERMISSIONS.MANAGE_PROGRAMS],
  },
  {
    label: "Syllabus",
    to: "/admin/syllabus",
    icon: FileText,
    permissions: [PERMISSIONS.MANAGE_SYLLABUS,],
  },
  {
    label: "Units",
    to: "/admin/units",
    icon: Layers,
    permissions: [PERMISSIONS.MANAGE_UNITS],
  },
  {
    label: "Resources",
    to: "/admin/resources/upload",
    icon: FileText,
    permissions: [PERMISSIONS.MANAGE_RESOURCES],
  },
  {
    label: "PYQs",
    to: "/admin/pyq/upload",
    icon: FileText,
    permissions: [PERMISSIONS.MANAGE_RESOURCES],
  },

  {
    label: "Activity",
    to: "/admin/activity",
    icon: Activity,
    permissions: [PERMISSIONS.VIEW_ACTIVITY_LOG],
  },
  {
    label: "User Roles",
    to: "/admin/roles",
    icon: Users,
    permissions: [PERMISSIONS.MANAGE_USERS],
  },

]

export default function AdminLayout() {
  const { hasPermission } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen bg-muted/40">
      {/* Sidebar */}

      <aside
        className={`sticky 
          top-0 
          h-screen 
          overflow-y-auto
          bg-background border-r
          transition-all duration-200 ease-in-out
          ${sidebarOpen ? "w-64" : "w-16"}
        `}
      >
        {/* Sidebar header */}

        <div className="h-14 flex items-center px-4 border-b">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu size={20} />
          </button>

          {sidebarOpen && (
            <span className="ml-3 text-sm font-semibold tracking-wide">
              ADMIN
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="mt-3 space-y-1 px-2">
          {adminNav.map((item) => {
            const allowed = item.permissions
              ? item.permissions.some(hasPermission)
              : true

            if (!allowed) return null

            const Icon = item.icon

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/admin/dashboard"}
                className={({ isActive }) =>
                  `
    group relative flex items-center gap-3
    rounded-md px-3 py-2 text-sm font-medium
    transition-colors
    ${isActive
                    ? "bg-purple-100 text-purple-700"
                    : "text-muted-foreground hover:bg-muted"
                  }
    `
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active indicator */}
                    <span
                      className={`
          absolute left-0 top-1/2 -translate-y-1/2
          h-6 w-1 rounded-r transition-opacity
          ${isActive ? "bg-purple-600 opacity-100" : "opacity-0"}
        `}
                    />

                    <Icon size={18} className="shrink-0" />

                    {sidebarOpen && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>


            )
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        {/* Top bar */}
        <header className="h-14 border-b bg-background flex items-center px-6">
          <h1 className="text-sm font-medium text-muted-foreground">
            Admin Panel
          </h1>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

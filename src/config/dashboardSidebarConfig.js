// src/config/dashboardSidebarConfig.js
// CHANGES: added  lockedForPublic: true  to tools and preferences sections
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardList,
  Settings,
  SlidersHorizontal,
  MessageSquare,
  Home,
  Calculator,
  CalendarDays,
  CheckSquare,
  GraduationCap,
  Wrench,
  CalendarDaysIcon,
  UserCircle,
  Bell,
  Megaphone,
  ClipboardCheck,
} from "lucide-react"

export const dashboardRootLink = {
  id: "dashboard",
  label: "Dashboard",
  path: "/dashboard",
  icon: LayoutDashboard,
}

export const forumRootLink = {
  id: "forum",
  label: "Forum",
  path: "/forum",
  icon: MessageSquare,
}

export const homeRootLink = {
  id: "home",
  label: "Home",
  path: "/",
  icon: Home,
}

export const updatesRootLink = {
  id: "updates",
  label: "What's New",
  path: "/updates",
  icon: Megaphone,
}

export const dashboardSidebarSections = [
  {
    id: "academics",
    label: "Academics",
    icon: BookOpen,
    lockedForPublic: true,
    // Academics stays unlocked - public users can browse syllabus/pyqs via public routes
    children: [
      { id: "syllabus",   label: "Syllabus",   path: "/dashboard/syllabus",   icon: FileText },
      { id: "resources",  label: "Resources",  path: "/dashboard/resources",  icon: ClipboardList },
      { id: "pyqs",       label: "PYQs",       path: "/dashboard/pyqs",       icon: FileText },
    ],
  },

  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    badge: "new",
    lockedForPublic: true,          // ← NEW: show but lock for logged-out users
    children: [
      { id: "cgpa",       label: "CGPA Calculator",  path: "/dashboard/cgpa",       icon: Calculator      },
      { id: "tasks",      label: "Task Tracker",     path: "/dashboard/tasks",      icon: CheckSquare     },
      { id: "timetable",  label: "Timetable",        path: "/dashboard/timetable",  icon: CalendarDaysIcon },
      { id: "grade-calc", label: "Grade Calculator", path: "/dashboard/grade-calc", icon: GraduationCap, soon: true },
    ],
  },

  {
  id: "attendance",
  label: "Attendance",
  icon: ClipboardCheck,
  lockedForPublic: true,
  children: [
    { id: "attendance-home", label: "My Attendance", path: "/dashboard/attendance", icon: ClipboardCheck },
  ],
},

  {
  id: "account",          // was "preferences" or similar
  label: "Account",       // rename from "Preferences"
  icon: UserCircle,       // or whatever fits
  lockedForPublic: true,
  children: [
    {
      id: "notifications",
      label: "Notifications",
      path: "/dashboard/notifications",
      icon: Bell,
    },
    {
      id: "settings",
      label: "Settings",
      path: "/dashboard/settings",
      icon: Settings,
    },
  ]
}
]
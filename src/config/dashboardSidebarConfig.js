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

export const dashboardSidebarSections = [
  {
    id: "academics",
    label: "Academics",
    icon: BookOpen,
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
    children: [
      { id: "cgpa",       label: "CGPA Calculator",  path: "/dashboard/cgpa",       icon: Calculator   },
      { id: "tasks",      label: "Task Tracker",      path: "/dashboard/tasks",      icon: CheckSquare  },
      { id: "timetable",  label: "Timetable Builder", path: "/dashboard/timetable",  icon: CalendarDays,  soon: true },
      { id: "grade-calc", label: "Grade Calculator",  path: "/dashboard/grade-calc", icon: GraduationCap, soon: true },
    ],
  },

  {
    id: "preferences",
    label: "Preferences",
    icon: SlidersHorizontal,
    children: [
      { id: "settings", label: "Settings", path: "/dashboard/settings", icon: Settings },
    ],
  },
]
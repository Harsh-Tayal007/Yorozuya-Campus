import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardList,
  Settings,
  SlidersHorizontal,
  MessageSquare,
  Home,
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
      { id: "syllabus", label: "Syllabus", path: "/dashboard/syllabus", icon: FileText },
      { id: "resources", label: "Resources", path: "/dashboard/resources", icon: ClipboardList },
      { id: "pyqs", label: "PYQs", path: "/dashboard/pyqs", icon: FileText },
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
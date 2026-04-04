import { useEffect } from "react"
import { useLocation } from "react-router-dom"

const APP_NAME = "Unizuya"

const segmentMap = {
  admin: "Admin",
  dashboard: "Dashboard",
  resources: "Resources",
  syllabus: "Syllabus",
  pyqs: "PYQs",
  forum: "Forum",
  tools: "Tools",
  universities: "Universities",
  university: "University",
  programs: "Programs",
  branches: "Branches",
  semester: "Semester",
  subject: "Subject",
  unit: "Unit",
  settings: "Settings",
  activity: "Activity",
  roles: "Roles",
  upload: "Upload",
  login: "Login",
  signup: "Signup",
  "complete-profile": "Complete Profile",
}

const formatSegment = (segment) => {
  if (!segment) return ""

  // Ignore dynamic IDs (numbers, mongo-like ids, etc.)
  if (/^\d+$/.test(segment)) return null
  if (segment.length > 15 && segment.includes("-")) return null

  return (
    segmentMap[segment] ||
    segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  )
}

const PageTitleManager = () => {
  const location = useLocation()

  useEffect(() => {
    const segments = location.pathname
      .split("/")
      .filter(Boolean)

    const formattedSegments = segments
      .map(formatSegment)
      .filter(Boolean)

    let title = formattedSegments.join(" / ")

    if (!title) {
      document.title = "Unizuya – Academic Platform for Students"
    } else {
      document.title = `${title} | ${APP_NAME}`
    }
  }, [location])

  return null
}

export default PageTitleManager
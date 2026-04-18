// src/components/dashboard/DashboardSemesterSyllabus.jsx
import { useParams } from "react-router-dom"
import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import SyllabusUserView from "@/pages/admin/syllabus/SyllabusUserView"
import TeacherAcademicEmptyState from "@/components/dashboard/TeacherAcademicEmptyState"
import { useAuth } from "@/context/AuthContext"

const DashboardSemesterSyllabus = () => {
  const { semester } = useParams()
  const { data, isLoading, error } = useAcademicIdentity()
  const { user } = useAuth()

  if (isLoading) return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-16 animate-pulse" />
      ))}
    </div>
  )

  // Guard: data must exist AND branch.name must be a non-empty string
  if (error || !data) {
    if (user?.accountType === "teacher" || user?.role === "teacher") {
      return <TeacherAcademicEmptyState section="syllabus" />
    }
    return null
  }
  if (!data.program?.$id || !data.branch?.name) return null

  return (
    <SyllabusUserView
      programId={data.program.$id}
      branchName={data.branch.name}
      semester={semester}
      isDashboard
    />
  )
}

export default DashboardSemesterSyllabus
import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import PyqSemesterSubjects from "@/pages/pyqs/PyqSemesterSubjects"
import TeacherAcademicEmptyState from "@/components/dashboard/TeacherAcademicEmptyState"
import { useAuth } from "@/context/AuthContext"

export default function DashboardPyqSemester() {
  const { data, isLoading, error } = useAcademicIdentity()
  const { user } = useAuth()

  if (isLoading) return null
  if (error || !data) {
    if (user?.accountType === "teacher" || user?.role === "teacher") {
      return <TeacherAcademicEmptyState section="PYQs" />
    }
    return null
  }

  return (
    <PyqSemesterSubjects
      programId={data.program.$id}
      branchName={data.branch.name}
      isDashboard
    />
  )
}

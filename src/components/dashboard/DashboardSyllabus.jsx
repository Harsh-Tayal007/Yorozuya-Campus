import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import BranchSyllabus from "@/pages/branches/BranchSyllabus"
import TeacherAcademicEmptyState from "@/components/dashboard/TeacherAcademicEmptyState"
import { useAuth } from "@/context/AuthContext"

const DashboardSyllabus = () => {
  const { data, isLoading, error } = useAcademicIdentity()
  const { user } = useAuth()

  if (isLoading) return null
  if (error || !data) {
    // Teacher or user without program/branch - show friendly empty state
    if (user?.accountType === "teacher" || user?.role === "teacher") {
      return <TeacherAcademicEmptyState section="syllabus" />
    }
    return null
  }

  return (
    <BranchSyllabus
      programId={data.program.$id}
      branchName={data.branch.name}
      isDashboard
    />
  )
}

export default DashboardSyllabus

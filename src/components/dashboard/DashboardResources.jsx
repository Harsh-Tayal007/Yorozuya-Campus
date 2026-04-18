import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import ResourcesUserView from "@/pages/resources/ResourcesUserView"
import TeacherAcademicEmptyState from "@/components/dashboard/TeacherAcademicEmptyState"
import { useAuth } from "@/context/AuthContext"

export default function DashboardResources() {
  const { data, isLoading, error } = useAcademicIdentity()
  const { user } = useAuth()

  if (isLoading) return null
  if (error || !data) {
    if (user?.accountType === "teacher" || user?.role === "teacher") {
      return <TeacherAcademicEmptyState section="resources" />
    }
    return null
  }

  return (
    <ResourcesUserView
      programId={data.program.$id}
      branchName={data.branch.name}
      isDashboard
    />
  )
}

import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import PyqUserView from "@/pages/pyqs/PyqUserView"

export default function DashboardPyqs() {
  const { data, isLoading, error } = useAcademicIdentity()

  if (isLoading || error || !data) return null

  return (
    <PyqUserView
      programId={data.program.$id}
      branchName={data.branch.name}
      isDashboard
    />
  )
}

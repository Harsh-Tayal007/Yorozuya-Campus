import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import ResourcesUserView from "@/pages/resources/ResourcesUserView"

export default function DashboardResources() {
  const { data, isLoading, error } = useAcademicIdentity()

  if (isLoading || error || !data) return null

  return (
    <ResourcesUserView
      programId={data.program.$id}
      branchName={data.branch.name}
      isDashboard
    />
  )
}

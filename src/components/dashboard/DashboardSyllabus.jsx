import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import BranchSyllabus from "@/pages/branches/BranchSyllabus"

const DashboardSyllabus = () => {
  const { data, isLoading, error } = useAcademicIdentity()

  if (isLoading) return null
  if (error || !data) return null

  return (
    <BranchSyllabus
      programId={data.program.$id}
      branchName={data.branch.name}
      isDashboard
    />
  )
}

export default DashboardSyllabus

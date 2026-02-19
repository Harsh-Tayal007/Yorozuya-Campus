import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import PyqSubjectList from "@/pages/pyqs/PyqSubjectList"

export default function DashboardPyqSubject() {
  const { data, isLoading, error } = useAcademicIdentity()

  if (isLoading || error || !data) return null

  return (
    <PyqSubjectList
      programId={data.program.$id}
      branchName={data.branch.name}
      isDashboard
    />
  )
}

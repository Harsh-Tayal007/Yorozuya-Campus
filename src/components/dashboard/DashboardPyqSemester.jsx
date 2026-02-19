import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import PyqSemesterSubjects from "@/pages/pyqs/PyqSemesterSubjects"

export default function DashboardPyqSemester() {
  const { data, isLoading, error } = useAcademicIdentity()

  if (isLoading || error || !data) return null

  return (
    <PyqSemesterSubjects
      programId={data.program.$id}
      branchName={data.branch.name}
      isDashboard
    />
  )
}

import { useParams } from "react-router-dom"
import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import SyllabusUserView from "@/pages/admin/syllabus/SyllabusUserView"

const DashboardSemesterSyllabus = () => {
  const { semester } = useParams()
  const { data, isLoading, error } = useAcademicIdentity()

  if (isLoading) return null
  if (error || !data) return null

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

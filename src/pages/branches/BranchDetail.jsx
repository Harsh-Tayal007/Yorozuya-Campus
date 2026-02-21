import { useParams, useNavigate, useLocation } from "react-router-dom"
import AcademicQuickAccess from "@/components/dashboard/AcademicQuickAccess"

const BranchDetail = () => {
  const { programId, branchName } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const programName = location.state?.programName
  const decodedBranch = decodeURIComponent(branchName)

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{decodedBranch}</h1>

        <p className="text-muted-foreground mt-1">
          {programName ?? "Program"} · Branch Overview
        </p>
      </div>

      {/* Branch Actions */}
      <AcademicQuickAccess
        programId={programId}
        branchName={branchName}
        programName={programName}  
        mode="explore"
      />

    </div>
  )
}

export default BranchDetail
import { useParams, useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpen, Library, FileText, ArrowUpRight } from "lucide-react"
import GlowCard from "@/components/common/GlowCard"
import AcademicQuickAccess from "@/components/dashboard/AcademicQuickAccess"


const BranchDetail = () => {
  const { programId, branchName } = useParams()
  const navigate = useNavigate()

  const decodedBranch = decodeURIComponent(branchName)


  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{decodedBranch}</h1>
        <p className="text-muted-foreground mt-1">
          B.Tech · Branch Overview
        </p>
      </div>

      {/* Branch Actions */}
      <AcademicQuickAccess
        programId={programId}
        branchName={branchName}
        mode="explore"
      />

    </div>
  )

}

export default BranchDetail

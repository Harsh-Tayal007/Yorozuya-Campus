// src/pages/branches/BranchDetail.jsx
import { useParams, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { GitBranch } from "lucide-react"
import AcademicQuickAccess from "@/components/dashboard/AcademicQuickAccess"
import { BackButton } from "@/components"

const BranchDetail = () => {
  const { programId, branchName } = useParams()
  const location    = useLocation()
  const programName = location.state?.programName

  // If params are missing or literally "undefined" string, bail out
  if (!programId || programId === "undefined" || !branchName || branchName === "undefined") {
    return null
  }

  const decodedBranch = decodeURIComponent(branchName)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <BackButton to={`/programs/${programId}`} label={programName ?? "Program"} />

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <GitBranch size={18} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{decodedBranch}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {programName ?? "Program"} · Branch Overview
          </p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Quick Access
        </p>
        <AcademicQuickAccess
          programId={programId}
          branchName={branchName}
          programName={programName}
          mode="explore"
        />
      </motion.div>
    </div>
  )
}

export default BranchDetail
// src/pages/branches/BranchSyllabus.jsx
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ClipboardList } from "lucide-react"
import { getAvailableSyllabusSemesters } from "@/services/syllabus/syllabusAvailabilityService"
import { getProgramById } from "@/services/university/programService"
import SemesterCard from "@/components/academic/SemesterCard"
import { BackButton } from "@/components"
import { Breadcrumbs } from "@/components"

const BranchSyllabus = ({
  programId: propProgramId,
  branchName: propBranchName,
  isDashboard = false,
}) => {
  const params          = useParams()
  const navigate        = useNavigate()
  const finalProgramId  = propProgramId  ?? params.programId
  const finalBranchName = propBranchName ?? params.branchName
  const decodedBranch   = finalBranchName && finalBranchName !== "undefined"
    ? decodeURIComponent(finalBranchName)
    : null

  const canFetch = !!finalProgramId
    && finalProgramId !== "undefined"
    && !!decodedBranch

  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ["syllabus-semesters", finalProgramId, decodedBranch],
    queryFn:  () => getAvailableSyllabusSemesters({ programId: finalProgramId, branch: decodedBranch }),
    enabled:  canFetch,
    staleTime: 1000 * 60 * 5,
  })

  const { data: program } = useQuery({
    queryKey: ["program", finalProgramId],
    queryFn:  () => getProgramById(finalProgramId),
    enabled:  canFetch && !isDashboard,
    staleTime: 1000 * 60 * 10,
  })

  if (!canFetch) return null

  const wrapClass = isDashboard
    ? "space-y-4"
    : "max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6"

  return (
    <div className={wrapClass}>

      {/* Dashboard: ← Overview */}
      {isDashboard && (
        <BackButton to="/dashboard" label="Overview" />
      )}

      {/* Public: ← branch + breadcrumbs */}
      {!isDashboard && (
        <>
          <BackButton
            to={`/programs/${finalProgramId}/branches/${finalBranchName}`}
            label={decodedBranch}
          />
          <Breadcrumbs overrides={{ [finalProgramId]: program?.name }} />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <ClipboardList size={18} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Syllabus</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Select a semester to view</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-20 animate-pulse" />
            ))}
          </div>
        ) : semesters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">No syllabus available for this branch yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {semesters.map(sem => (
              <SemesterCard
                key={sem}
                semester={sem}
                description="View syllabus"
                onClick={() => {
                  if (isDashboard)
                    navigate(`/dashboard/syllabus/semester/${sem}`)
                  else
                    navigate(`/programs/${finalProgramId}/branches/${encodeURIComponent(finalBranchName)}/syllabus/semester/${sem}`)
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default BranchSyllabus
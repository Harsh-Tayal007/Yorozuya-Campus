// src/pages/pyqs/PyqUserView.jsx
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { FileText, ArrowUpRight, BookOpen } from "lucide-react"
import { getSemestersWithPyqs } from "@/services/syllabus/pyqService"
import { getProgramById } from "@/services/university/programService"
import { Breadcrumbs } from "@/components"
import { BackButton } from "@/components"
import GlowCard from "@/components/common/display/GlowCard"

const PyqUserView = ({ programId: propProgramId, branchName: propBranchName, isDashboard }) => {
  const params    = useParams()
  const navigate  = useNavigate()
  const programId  = propProgramId  ?? params.programId
  const branchName = propBranchName ?? params.branchName
  const decodedBranch = branchName ? decodeURIComponent(branchName) : null

  const programBase    = `/programs/${programId}/branches/${branchName}`
  const basePyqPath    = isDashboard ? "/dashboard/pyqs" : `${programBase}/pyqs`

  const canFetch = !!programId && programId !== "undefined"

  const { data: semesters = [], isLoading, error: semestersError, refetch } = useQuery({
    queryKey: ["pyq-semesters", programId],
    queryFn:  () => getSemestersWithPyqs(programId),
    enabled:  canFetch,
    staleTime: 1000 * 60 * 5,
  })

  const { data: program, error: programError, refetch: refetchProgram } = useQuery({
    queryKey: ["program", programId],
    queryFn:  () => getProgramById(programId),
    enabled:  canFetch,
    staleTime: 1000 * 60 * 10,
  })

  if (!canFetch) return null

  const wrapClass = isDashboard ? "space-y-5" : "max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6"

  return (
    <div className={wrapClass}>
      {isDashboard && <BackButton to="/dashboard" label="Overview" />}
      {!isDashboard && (
        <>
          <BackButton to={`/programs/${programId}/branches/${branchName}`} label={decodedBranch} />
          {program && <Breadcrumbs overrides={{ [programId]: program.name }} />}
        </>
      )}

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <FileText size={18} className="text-red-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">PYQs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{decodedBranch}</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-20 animate-pulse" />)}
          </div>
        ) : semesters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">No PYQs available yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {semesters.map(sem => (
              <GlowCard key={sem} onClick={() => navigate(`${basePyqPath}/semester/${sem}`)} className="p-5 cursor-target">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                      <BookOpen size={13} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-red-400 transition-colors">Semester {sem}</p>
                      <p className="text-[11px] text-muted-foreground">View PYQs</p>
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-red-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default PyqUserView
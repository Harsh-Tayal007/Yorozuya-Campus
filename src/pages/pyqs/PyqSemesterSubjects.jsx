// src/pages/pyqs/PyqSemesterSubjects.jsx
import { useQuery } from "@tanstack/react-query"
import { useParams, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { FileText, ArrowUpRight, Layers } from "lucide-react"
import { getSubjectsForPyqSemester } from "@/services/syllabus/pyqUserResolver"
import { getProgramById } from "@/services/university/programService"
import { Breadcrumbs } from "@/components"
import { BackButton } from "@/components"
import GlowCard from "@/components/common/display/GlowCard"
import ShareButton from "@/components/common/navigation/ShareButton"
import { useShareLink } from "@/hooks/useShareLink"

const PyqSemesterSubjects = ({ programId: propProgramId, branchName: propBranchName, isDashboard }) => {
  const params    = useParams()
  const navigate  = useNavigate()
  const programId  = propProgramId  ?? params.programId
  const branchName = propBranchName ?? params.branchName
  const semester   = params.semester
  const decodedBranch = branchName ? decodeURIComponent(branchName) : null

  const programBase = `/programs/${programId}/branches/${branchName}`
  const basePyqPath = isDashboard ? "/dashboard/pyqs" : `${programBase}/pyqs`

  const canFetch = !!programId && programId !== "undefined" && !!semester

  const { data: subjects = [], isLoading } = useQuery({
    queryKey: ["pyq-subjects", programId, semester],
    queryFn:  () => getSubjectsForPyqSemester({ programId, semester: Number(semester) }),
    enabled:  canFetch,
    staleTime: 1000 * 60 * 5,
  })

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn:  () => getProgramById(programId),
    enabled:  canFetch,
    staleTime: 1000 * 60 * 10,
  })

  const getSharePath = useShareLink({ programId, branchName: decodedBranch })

  if (!canFetch) return null

  const wrapClass = isDashboard ? "space-y-5" : "max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6"

  return (
    <div className={wrapClass}>
      <BackButton to={basePyqPath} label="PYQs" />
      {!isDashboard && (
        <Breadcrumbs overrides={{ ...(program?.name && { [programId]: program.name }) }} />
      )}

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <FileText size={18} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Semester {semester} · PYQs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{decodedBranch}</p>
          </div>
        </div>

        <ShareButton path={getSharePath(`pyqs/semester/${semester}`)} />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-20 animate-pulse" />)}
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">No PYQs available for this semester</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map(subject => (
              <GlowCard key={subject.$id}
                onClick={() => navigate(`${basePyqPath}/semester/${semester}/subject/${subject.$id}`, { state: { subjectName: subject.subjectName } })}
                disableGlare={true}
                className="p-5 cursor-target">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                      <Layers size={13} className="text-red-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-red-400 transition-colors truncate">{subject.subjectName}</p>
                      {subject.description && <p className="text-[11px] text-muted-foreground/80 line-clamp-2 mt-0.5">{subject.description}</p>}
                    </div>
                  </div>
                  <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-red-400 transition-all shrink-0" />
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default PyqSemesterSubjects
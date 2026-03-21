// src/pages/programs/ProgramSyllabus.jsx
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ClipboardList } from "lucide-react"
import { getAvailableSyllabusSemesters } from "@/services/syllabus/syllabusAvailabilityService"
import SemesterCard from "@/components/academic/SemesterCard"
import { BackButton } from "@/components"

const ProgramSyllabus = () => {
  const { programId, branchName } = useParams()
  const navigate = useNavigate()
  const decodedBranch = decodeURIComponent(branchName)

  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ["syllabus-semesters", programId, decodedBranch],
    queryFn: () => getAvailableSyllabusSemesters({ programId, branch: decodedBranch }),
    enabled: !!programId && !!decodedBranch,
    staleTime: 1000 * 60 * 5,
  })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <BackButton to={`/programs/${programId}/branches/${branchName}`} label={decodedBranch} />

      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <ClipboardList size={18} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{decodedBranch} Syllabus</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Select a semester to view syllabus</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-20 animate-pulse" />
            ))}
          </div>
        ) : semesters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">No syllabus available yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {semesters.map(sem => (
              <SemesterCard key={sem} semester={sem} description="View syllabus"
                onClick={() => navigate(
                  `/programs/${programId}/branches/${encodeURIComponent(decodedBranch)}/syllabus/semester/${sem}`
                )} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ProgramSyllabus
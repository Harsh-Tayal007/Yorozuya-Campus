// src/pages/programs/ProgramDetail.jsx
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"
import { getBranchesForProgram } from "@/utils/getBranchesForProgram"
import { getAvailableBranchesForProgram } from "@/services/university/branchAvailabilityService"
import GlowCard from "@/components/common/display/GlowCard"
import { ArrowUpRight, GitBranch } from "lucide-react"

const ProgramDetail = () => {
  const { programId } = useParams()
  const navigate = useNavigate()

  const program = { id: programId, name: "B.Tech", duration: 4, level: "Undergraduate" }
  const allBranches = getBranchesForProgram(program.name)

  const { data: availableBranches = [], isLoading } = useQuery({
    queryKey: ["available-branches", programId],
    queryFn: () => getAvailableBranchesForProgram(programId),
    enabled: !!programId,
    staleTime: 1000 * 60 * 5,
  })

  const visibleBranches = allBranches.filter(b => availableBranches.includes(b))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <BookOpen size={18} className="text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{program.name}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{program.level} · {program.duration} Years</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          Choose your branch
        </p>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-20 animate-pulse" />
            ))}
          </div>
        ) : visibleBranches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
            <GitBranch size={20} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No branches available yet</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {visibleBranches.map(branch => (
              <GlowCard key={branch} onClick={() =>
                navigate(`/programs/${programId}/branches/${encodeURIComponent(branch)}`, { state: { programName: program.name } })}
                className="p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20
                                    flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <GitBranch size={13} className="text-violet-400" />
                    </div>
                    <p className="text-sm font-semibold text-foreground group-hover:text-violet-400 transition-colors">{branch}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-violet-400
                                                     group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default ProgramDetail
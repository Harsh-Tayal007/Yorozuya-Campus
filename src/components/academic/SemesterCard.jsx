// src/components/academic/SemesterCard.jsx
import { ArrowUpRight, BookOpen } from "lucide-react"
import GlowCard from "@/components/common/display/GlowCard"

const SemesterCard = ({ semester, onClick, description = "View content" }) => (
  <GlowCard onClick={onClick} className="p-5 cursor-target">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20
                        flex items-center justify-center shrink-0
                        group-hover:scale-105 transition-transform duration-200">
          <BookOpen size={14} className="text-violet-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground group-hover:text-violet-400 transition-colors duration-200">
            Semester {semester}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      <ArrowUpRight size={14} className="text-muted-foreground/40 shrink-0 mt-0.5
                                          group-hover:text-violet-400 group-hover:translate-x-0.5
                                          group-hover:-translate-y-0.5 transition-all duration-200" />
    </div>
  </GlowCard>
)

export default SemesterCard
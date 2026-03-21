// src/components/university/CourseCard.jsx
import { ArrowUpRight } from "lucide-react"
import GlowCard from "@/components/common/display/GlowCard"

export const CourseCard = ({ course, onClick }) => (
  <GlowCard onClick={onClick} className="p-5">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-violet-400
                       transition-colors duration-200 leading-snug">
          {course.name}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {course.degreeType || "Program"}
          {course.duration ? ` · ${course.duration} years` : ""}
        </p>
      </div>
      <ArrowUpRight size={14} className="text-muted-foreground/40 shrink-0 mt-0.5
                                          group-hover:text-violet-400 group-hover:translate-x-0.5
                                          group-hover:-translate-y-0.5 transition-all duration-200" />
    </div>
  </GlowCard>
)

export default CourseCard
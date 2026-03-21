// src/components/university/UniversityCard.jsx
import { ExternalLink, Pencil, Trash2, MapPin, ArrowUpRight } from "lucide-react"
import GlowCard from "@/components/common/display/GlowCard"

const UniversityCard = ({ university, onClick, onDelete, onEdit, showCourses = false }) => {
  return (
    <GlowCard onClick={onClick} className="p-5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-violet-400
                         transition-colors duration-200 truncate">
            {university.name}
          </h3>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={10} className="text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground truncate">
              {university.city ? `${university.city}, ${university.country}` : university.country}
            </p>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
            {onEdit && (
              <button onClick={onEdit}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5
                           border border-transparent hover:border-primary/20 transition-all active:scale-95">
                <Pencil size={12} />
              </button>
            )}
            {onDelete && (
              <button onClick={(e) => { e.stopPropagation(); onDelete(university.$id) }}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5
                           border border-transparent hover:border-destructive/20 transition-all active:scale-95">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        {university.website && !showCourses ? (
          <a href={university.website} target="_blank" rel="noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
            Website <ExternalLink size={10} />
          </a>
        ) : showCourses && university.courses ? (
          <span className="text-[11px] text-muted-foreground">{university.courses.length} courses</span>
        ) : <span />}

        {onClick && (
          <ArrowUpRight size={14} className="text-muted-foreground/50 group-hover:text-violet-400
                                              group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                                              transition-all duration-200" />
        )}
      </div>
    </GlowCard>
  )
}

export default UniversityCard
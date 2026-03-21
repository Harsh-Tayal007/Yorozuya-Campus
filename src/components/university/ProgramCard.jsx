// src/components/university/ProgramCard.jsx
import { motion } from "framer-motion"
import { BookOpen, Pencil, Trash2 } from "lucide-react"

const ProgramCard = ({ program, onEdit, onDelete }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm
                 hover:border-border hover:bg-card/80 transition-all duration-200 overflow-hidden"
    >
      {/* Accent top line */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-70
                      transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)" }} />

      <div className="p-4 flex items-start justify-between gap-3">
        {/* Icon + content */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25
                          flex items-center justify-center shrink-0 mt-0.5
                          group-hover:scale-105 transition-transform duration-200">
            <BookOpen size={14} className="text-violet-400" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground leading-snug truncate">
              {program.name}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {[
                program.degreeType,
                program.duration &&
                  (String(program.duration).includes("year")
                    ? program.duration
                    : `${program.duration} years`),
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
        </div>

        {/* Actions */}
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-0.5 shrink-0">
            {onEdit && (
              <button
                onClick={() => onEdit(program)}
                className="p-1.5 rounded-lg text-muted-foreground
                           hover:text-primary hover:bg-primary/5
                           border border-transparent hover:border-primary/20
                           transition-all duration-150 active:scale-95"
              >
                <Pencil size={13} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete?.(program)}
                className="p-1.5 rounded-lg text-muted-foreground
                           hover:text-destructive hover:bg-destructive/5
                           border border-transparent hover:border-destructive/20
                           transition-all duration-150 active:scale-95"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ProgramCard
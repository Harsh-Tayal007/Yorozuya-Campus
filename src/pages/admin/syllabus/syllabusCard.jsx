// src/components/university/SyllabusCard.jsx  (or wherever it lives)
import { motion } from "framer-motion"
import { ClipboardList, GitBranch, BookOpen, Layers, ExternalLink, Pencil, Trash2 } from "lucide-react"
import { storage } from "@/lib/appwrite"
import { toast } from "sonner"

const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID

const SyllabusCard = ({
  syllabus,
  subjects = [],
  onView,
  onEdit,
  onDelete,
}) => {
  const handleView = () => {
    if (onView) { onView(syllabus); return }
    if (subjects.length === 0) { toast.error("No subject PDF available"); return }
    const url = storage.getFileView(BUCKET_ID, subjects[0].pdfFileId)
    window.open(url, "_blank")
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm
                 hover:border-border hover:bg-card/80 transition-all duration-200 overflow-hidden"
    >
      {/* Accent top line */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-60
                      transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, transparent, #06b6d4, transparent)" }} />

      <div className="p-4 flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20
                        flex items-center justify-center shrink-0 mt-0.5
                        group-hover:scale-105 transition-transform duration-200">
          <ClipboardList size={15} className="text-cyan-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-foreground leading-snug">
                {syllabus.title}
              </h3>

              {/* Meta row */}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <GitBranch size={9} className="shrink-0" />
                  {syllabus.branch}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <BookOpen size={9} className="shrink-0" />
                  Sem {syllabus.semester}
                </span>
                {subjects.length > 0 ? (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate max-w-xs">
                    <Layers size={9} className="shrink-0" />
                    {subjects.map(s => s.subjectName).join(", ")}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground/50">No subjects yet</span>
                )}
              </div>
            </div>

            {/* Actions */}
            {(onView || onEdit || onDelete) && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleView}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium
                             border border-border/60 bg-muted/30 text-muted-foreground
                             hover:border-border hover:text-foreground hover:bg-muted/60
                             transition-all duration-150 active:scale-95"
                >
                  <ExternalLink size={11} /> View
                </button>
                {onEdit && (
                  <button
                    onClick={() => onEdit(syllabus)}
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
                    onClick={() => onDelete(syllabus)}
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
        </div>
      </div>
    </motion.div>
  )
}

export default SyllabusCard
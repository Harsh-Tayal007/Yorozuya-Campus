// src/components/dashboard/TeacherAcademicEmptyState.jsx
import { BookOpen, ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

/**
 * Friendly empty state shown to teachers on academic dashboard pages
 * that require a program/branch (Syllabus, Resources, PYQs).
 */
const TeacherAcademicEmptyState = ({ section = "content" }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20
                    flex items-center justify-center">
      <BookOpen size={20} className="text-emerald-500" />
    </div>
    <div className="space-y-1.5 max-w-xs">
      <p className="text-sm font-semibold text-foreground">
        No {section} to display
      </p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Academic {section} is organised by program and branch. As a teacher,
        you can browse content through the Explore pages.
      </p>
    </div>
    <Link
      to="/universities"
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl
                 border border-border/60 bg-card/60 text-sm font-medium
                 text-foreground hover:bg-muted hover:border-primary/30
                 transition-all duration-150"
    >
      Explore universities <ArrowUpRight size={13} />
    </Link>
  </div>
)

export default TeacherAcademicEmptyState

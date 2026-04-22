// src/components/dashboard/AcademicQuickAccess.jsx
import { useNavigate } from "react-router-dom"
import { BookOpen, Library, FileText, ArrowUpRight } from "lucide-react"
import GlowCard from "@/components/common/display/GlowCard"

const CARDS = [
  {
    key: "syllabus",
    label: "Syllabus",
    description: "View semester-wise syllabus",
    icon: BookOpen,
    accent: "#06b6d4",
    explorePath: (programId, branchName) =>
      `/programs/${programId}/branches/${branchName}/syllabus`,
    dashboardPath: () => "/dashboard/syllabus",
  },
  {
    key: "resources",
    label: "Resources",
    description: "Notes, links & study materials",
    icon: Library,
    accent: "#f59e0b",
    explorePath: (programId, branchName) =>
      `/programs/${programId}/branches/${branchName}/resources`,
    dashboardPath: () => "/dashboard/resources",
  },
  {
    key: "pyqs",
    label: "PYQs",
    description: "Previous year question papers",
    icon: FileText,
    accent: "#ef4444",
    explorePath: (programId, branchName) =>
      `/programs/${programId}/branches/${branchName}/pyqs`,
    dashboardPath: () => "/dashboard/pyqs",
  },
]

const AcademicQuickAccess = ({
  programId,
  branchName,
  programName,
  mode = "explore",
}) => {
  const navigate = useNavigate()

  // Guard - never navigate with undefined params
  const canNavigate = mode === "dashboard" || (!!programId && !!branchName)

  const handleClick = (card) => {
    if (!canNavigate) return
    const path = mode === "dashboard"
      ? card.dashboardPath()
      : card.explorePath(programId, branchName)
    navigate(path, { state: { programName } })
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {CARDS.map(({ key, label, description, icon: Icon, accent, ...card }) => (
        <GlowCard
          key={key}
          onClick={() => handleClick({ key, label, description, icon: Icon, accent, ...card })}
          className={`p-5 cursor-target ${!canNavigate ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                           group-hover:scale-110 transition-transform duration-200"
                style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
              >
                <Icon size={16} style={{ color: accent }} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground transition-colors duration-200">
                  {label}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
              </div>
            </div>
            <ArrowUpRight
              size={14}
              className="text-muted-foreground/40 shrink-0 mt-0.5
                         group-hover:translate-x-0.5 group-hover:-translate-y-0.5
                         transition-all duration-200"
              style={{ color: `${accent}80` }}
            />
          </div>
        </GlowCard>
      ))}
    </div>
  )
}

export default AcademicQuickAccess
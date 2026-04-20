// src/components/home/ToolsShowcase.jsx
import { Calculator, ListChecks, Calendar, ScanLine, FileDown, Bell } from "lucide-react"
import { useReveal } from "@/hooks/useReveal"

const TOOLS = [
  {
    icon: Calculator,
    accent: "from-rose-500 to-pink-500",
    glow: "bg-rose-500/15",
    border: "hover:border-rose-400/40",
    title: "CGPA Calculator",
    desc: "10-point grading with semester-wise SGPA, visual progression, and PDF export.",
    highlights: [
      { icon: ScanLine, text: "AI marksheet scan" },
      { icon: FileDown, text: "Export as PDF or image" },
    ],
  },
  {
    icon: ListChecks,
    accent: "from-sky-500 to-blue-500",
    glow: "bg-sky-500/15",
    border: "hover:border-sky-400/40",
    title: "Task Tracker",
    desc: "Priority-based todos with subtasks, due dates, browser reminders, and progress bars.",
    highlights: [
      { icon: Bell, text: "Browser reminders" },
      { icon: FileDown, text: "PDF task report" },
    ],
  },
  {
    icon: Calendar,
    accent: "from-teal-500 to-emerald-500",
    glow: "bg-teal-500/15",
    border: "hover:border-teal-400/40",
    title: "Timetable Builder",
    desc: "Build your weekly schedule with a grid editor, colour-coded subjects, and a Today view.",
    highlights: [
      { icon: ScanLine, text: "AI timetable scan" },
      { icon: FileDown, text: "Export as PDF or PNG" },
    ],
  },
]

function ToolCard({ icon: Icon, accent, glow, border, title, desc, highlights, index }) {
  const ref = useReveal(index * 80)
  return (
    <div ref={ref}
      className={`group bg-white dark:bg-white/[0.03]
                  border border-slate-200 dark:border-white/8
                  rounded-2xl p-5 shadow-sm
                  transition-[border-color,box-shadow,transform] duration-200 ease-out
                  hover:-translate-y-0.5 hover:shadow-md ${border}`}>
      <div className="mb-4">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${accent}
                        flex items-center justify-center shadow-md
                        group-hover:scale-105 transition-transform duration-200 ease-out`}>
          <Icon size={18} className="text-white" />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed mb-4">{desc}</p>

      <div className="space-y-1.5">
        {highlights.map(({ icon: HIcon, text }) => (
          <div key={text} className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <HIcon size={12} className="text-indigo-500/70 flex-shrink-0" />
            <span>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ToolsShowcase() {
  const headRef = useReveal()
  return (
    <section>
      <div ref={headRef} className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
          Productivity tools
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Tools built for how students actually plan
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
          Three purpose-built tools with AI assistance and export options, all synced to your account.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {TOOLS.map((tool, i) => (
          <ToolCard key={tool.title} {...tool} index={i} />
        ))}
      </div>
    </section>
  )
}

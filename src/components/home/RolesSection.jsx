// src/components/home/RolesSection.jsx
import {
  GraduationCap, BookOpen, MessageSquare, Calculator, ListChecks,
  Calendar, ClipboardList, BarChart2, FileDown, Users
} from "lucide-react"
import { useReveal } from "@/hooks/useReveal"
import SpotlightCard from "@/components/ui/SpotlightCard"

const ROLES = [
  {
    role: "Student",
    icon: GraduationCap,
    gradient: "from-blue-500 to-indigo-500",
    glowColor: "bg-blue-500/10",
    borderHover: "hover:border-blue-400/40",
    desc: "Access everything you need to study smarter, stay on track, and never miss a deadline.",
    features: [
      { icon: BookOpen, text: "Syllabus, PYQs and study resources" },
      { icon: MessageSquare, text: "Forum discussions and Q\u0026A" },
      { icon: Calculator, text: "CGPA calculator with AI scan" },
      { icon: ListChecks, text: "Task tracker with reminders" },
      { icon: Calendar, text: "Timetable builder" },
      { icon: ClipboardList, text: "View attendance and percentages" },
    ],
  },
  {
    role: "Teacher",
    icon: BookOpen,
    gradient: "from-emerald-500 to-teal-500",
    glowColor: "bg-emerald-500/10",
    borderHover: "hover:border-emerald-400/40",
    desc: "Manage classes, take attendance in real time, and generate reports effortlessly.",
    features: [
      { icon: Users, text: "Create and manage classes" },
      { icon: ClipboardList, text: "Real-time attendance sessions" },
      { icon: BarChart2, text: "Per-student analytics and stats" },
      { icon: FileDown, text: "CSV and printable reports" },
      { icon: MessageSquare, text: "Participate in forum discussions" },
      { icon: Calendar, text: "All productivity tools included" },
    ],
  },
]

function RoleCard({ role, icon: Icon, gradient, glowColor, borderHover, desc, features, index }) {
  const ref = useReveal(index * 100)
  return (
    <div ref={ref}>
      <SpotlightCard
        className={`group bg-white dark:bg-slate-900/80
                    border border-slate-200 dark:border-white/8
                    rounded-2xl p-6 shadow-sm
                    transition-all duration-200 ease-out
                    hover:-translate-y-0.5 hover:shadow-md ${borderHover}`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient}
                          flex items-center justify-center shadow-md
                          group-hover:scale-105 transition-transform duration-200 ease-out`}>
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">{role}</h3>
            <p className="text-[11px] text-muted-foreground">{desc}</p>
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-white/[0.06] mb-4" />

        <ul className="space-y-2.5">
          {features.map(({ icon: FIcon, text }) => (
            <li key={text} className="flex items-center gap-2.5">
              <div className={`w-6 h-6 rounded-lg ${glowColor} flex items-center justify-center flex-shrink-0`}>
                <FIcon size={12} className="text-foreground/70" />
              </div>
              <span className="text-xs text-foreground/80">{text}</span>
            </li>
          ))}
        </ul>
      </SpotlightCard>
    </div>
  )
}

export default function RolesSection() {
  const headRef = useReveal()
  return (
    <section>
      <div ref={headRef} className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
          Built for everyone
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Whether you're a student or a teacher
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
          Both roles get tailored experiences designed around their specific workflows.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ROLES.map((role, i) => (
          <RoleCard key={role.role} {...role} index={i} />
        ))}
      </div>
    </section>
  )
}

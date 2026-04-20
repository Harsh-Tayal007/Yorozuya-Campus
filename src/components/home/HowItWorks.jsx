// src/components/home/HowItWorks.jsx
import { UserPlus, GraduationCap, Rocket } from "lucide-react"
import { useReveal } from "@/hooks/useReveal"

const STEPS = [
  {
    icon: UserPlus,
    color: "from-blue-500 to-indigo-500",
    glow: "bg-blue-500/20",
    title: "Create your account",
    desc: "Sign up with email or Google in under a minute. Pick your role - student or teacher.",
  },
  {
    icon: GraduationCap,
    color: "from-violet-500 to-purple-500",
    glow: "bg-violet-500/20",
    title: "Set your academic profile",
    desc: "Select your university, program and branch. Everything filters to what matters to you.",
  },
  {
    icon: Rocket,
    color: "from-emerald-500 to-teal-500",
    glow: "bg-emerald-500/20",
    title: "Access everything",
    desc: "Syllabus, PYQs, forum, attendance, tools - all in one dashboard, ready to go.",
  },
]

function Step({ icon: Icon, color, glow, title, desc, index }) {
  const ref = useReveal(index * 80)
  return (
    <div ref={ref} className="relative flex flex-col items-center text-center">
      <div className="relative mb-4 z-10">
        <div className={`w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${color}
                        flex items-center justify-center shadow-lg`}>
          <Icon size={28} className="text-white" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white dark:bg-slate-900
                        border-2 border-slate-200 dark:border-white/10
                        flex items-center justify-center text-[10px] font-bold text-foreground shadow-sm">
          {index + 1}
        </div>
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">{desc}</p>
    </div>
  )
}

export default function HowItWorks() {
  const headRef = useReveal()
  return (
    <section>
      <div ref={headRef} className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
          How it works
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Up and running in three steps
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 relative">
        {/* Connector line - desktop only */}
        <div className="hidden sm:block absolute top-[52px] left-[16.67%] right-[16.67%] h-px
                        bg-gradient-to-r from-blue-300/50 via-violet-300/50 to-emerald-300/50
                        dark:from-blue-500/20 dark:via-violet-500/20 dark:to-emerald-500/20" />

        {STEPS.map((step, i) => (
          <Step key={step.title} {...step} index={i} />
        ))}
      </div>
    </section>
  )
}

import { FileText, BookOpen, MessageSquare, Layers, ClipboardList, BarChart2 } from "lucide-react"
import { useReveal } from "@/hooks/useReveal"
import SpotlightCard from "@/components/ui/SpotlightCard"

const FEATURES = [
  {
    icon: FileText,
    color: "bg-orange-500/10 text-orange-500",
    title: "Past year questions",
    desc: "Browse PYQs sorted by university, course and subject. Stop digging through old drives and group chats.",
  },
  {
    icon: BookOpen,
    color: "bg-blue-500/10 text-blue-500",
    title: "Syllabus and notes",
    desc: "View your course syllabus, upload notes and download what others have shared, all in one spot.",
  },
  {
    icon: MessageSquare,
    color: "bg-indigo-500/10 text-indigo-500",
    title: "Student forum",
    desc: "Ask questions, get answers and have proper threaded discussions with students from your uni and beyond.",
  },
  {
    icon: Layers,
    color: "bg-emerald-500/10 text-emerald-500",
    title: "University-specific content",
    desc: "Content is filtered to your university and branch. No noise from courses that don't apply to you.",
  },
  {
    icon: ClipboardList,
    color: "bg-pink-500/10 text-pink-500",
    title: "Attendance tracker",
    desc: "Log attendance using a token system. See exactly where you stand before exams catch you off guard.",
  },
  {
    icon: BarChart2,
    color: "bg-amber-500/10 text-amber-500",
    title: "Academic tools",
    desc: "CGPA calculator, timetable builder and a task tracker. The essentials that actually save time every semester.",
  },
]

function FeatureCard({ icon: Icon, color, title, desc, index }) {
  const ref = useReveal(index * 60)
  return (
    <div ref={ref} className="h-full">
      <SpotlightCard
        className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-white/8
                   rounded-2xl p-5 h-full shadow-sm
                   hover:border-indigo-400/40 hover:-translate-y-0.5 hover:shadow-md
                   transition-all duration-200 ease-out group"
      >
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}
                         group-hover:scale-105 transition-transform duration-200 ease-out`}>
          <Icon size={17} />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </SpotlightCard>
    </div>
  )
}

export default function FeaturesGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {FEATURES.map((feature, i) => (
        <FeatureCard key={feature.title} {...feature} index={i} />
      ))}
    </div>
  )
}
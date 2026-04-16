import { createElement } from "react"
import { Link } from "react-router-dom"
import {
  FileText,
  BookOpen,
  MessageSquare,
  ClipboardList,
  BarChart2,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react"
import useSeoMeta from "@/hooks/useSeoMeta"

const FEATURE_CARDS = [
  {
    icon: BookOpen,
    title: "Syllabus and units",
    description: "Structured course content so students do not have to search across multiple portals.",
  },
  {
    icon: FileText,
    title: "PYQs and resources",
    description: "Past year questions and study material organized in one place for faster preparation.",
  },
  {
    icon: MessageSquare,
    title: "Student forum",
    description: "A focused discussion space for academic questions, answers, and peer support.",
  },
  {
    icon: ClipboardList,
    title: "Attendance tracking",
    description: "Real-time attendance visibility so students can act early before shortages become risky.",
  },
  {
    icon: BarChart2,
    title: "Productivity tools",
    description: "Built-in tools like CGPA calculator, timetable support, and task workflows.",
  },
  {
    icon: Zap,
    title: "Realtime + AI support",
    description: "Realtime updates with AI-assisted capabilities to reduce manual effort in daily academics.",
  },
]

const HIERARCHY = ["University", "Program", "Branch", "Semester", "Subject"]

export default function About() {
  useSeoMeta({
    title: "About Unizuya | Unified Academic Platform for Students",
    description: "Learn how Unizuya unifies syllabus, PYQs, forum, attendance, productivity tools, realtime features, and AI support into one academic platform.",
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12 dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]">
      <div className="mx-auto max-w-6xl space-y-12">
        <section className="space-y-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
            About Unizuya
          </p>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl dark:text-white">
            One platform for every academic workflow
          </h1>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Students often switch across many disconnected portals for syllabus, PYQs, notes, attendance, and discussion. Unizuya solves this fragmentation by bringing everything into one unified academic system.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Problem</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Academic information is fragmented across unofficial groups and multiple tools, making retrieval slow and inconsistent.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Solution</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Unizuya centralizes core student workflows with clean academic structure, realtime updates, and AI-enabled support features.
            </p>
          </article>
        </section>

        <section className="space-y-5">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Core Features</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Everything students need, connected in one ecosystem.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map(({ icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-400/40"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
                  {createElement(icon, { size: 16 })}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
          <div className="mb-4 flex items-center gap-2 text-indigo-500">
            <Layers size={16} />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Academic Hierarchy</h2>
          </div>
          <p className="mb-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Content discovery in Unizuya follows a clear hierarchy, from university context down to subject-level learning material.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {HIERARCHY.map((level, index) => (
              <div
                key={level}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-medium text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                <span className="mb-1 block text-[11px] text-slate-400 dark:text-slate-500">Step {index + 1}</span>
                {level}
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Mission</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Reduce student friction by making academic resources discoverable, reliable, and centralized under one unified platform.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Vision</h2>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Build a student-first academic operating system where realtime workflows and AI support make learning simpler every semester.
            </p>
          </article>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-white/10 dark:from-blue-500/10 dark:to-indigo-500/10">
          <h2 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white">Built by</h2>
          <p className="text-sm text-slate-700 dark:text-slate-200">Harsh Tayal</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Unizuya is a student-driven product built to solve real academic pain points with practical, production-ready modules.
          </p>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Connect with Unizuya
            <ArrowRight size={14} />
          </Link>
        </section>
      </div>
    </main>
  )
}

import { createElement, useState } from "react"
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
  Users,
  Shield,
  Bell,
  Calculator,
  Calendar,
  Bot,
  Database,
  Globe,
  Server,
  Monitor,
  Code2,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  Flag,
  Settings,
  ListChecks,
  Clock,
  LayoutDashboard,
  Megaphone,
  Download,
  ScanLine,
  TableProperties,
  Activity,
} from "lucide-react"
import useSeoMeta from "@/hooks/useSeoMeta"

// ─── Shared card ──────────────────────────────────────────────────────────────
function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-white/10 dark:bg-white/5 ${className}`}
    >
      {children}
    </div>
  )
}

// ─── Section heading with coloured number badge ───────────────────────────────
const BADGE_COLORS = {
  indigo:  "bg-indigo-500/10 text-indigo-500",
  blue:    "bg-blue-500/10 text-blue-500",
  violet:  "bg-violet-500/10 text-violet-500",
  emerald: "bg-emerald-500/10 text-emerald-500",
  amber:   "bg-amber-500/10 text-amber-500",
  rose:    "bg-rose-500/10 text-rose-500",
  sky:     "bg-sky-500/10 text-sky-500",
  teal:    "bg-teal-500/10 text-teal-500",
  orange:  "bg-orange-500/10 text-orange-500",
}

function SectionHeading({ number, title, subtitle, color = "indigo" }) {
  return (
    <div className="mb-8 space-y-2 text-center">
      <div
        className={`mx-auto mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${BADGE_COLORS[color]}`}
      >
        {number}
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
      {subtitle && (
        <p className="mx-auto max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  )
}

// ─── Feature card data ────────────────────────────────────────────────────────
const FEATURE_CARDS = [
  {
    icon: BookOpen,
    color: "bg-blue-500/10 text-blue-500",
    title: "Syllabus and Units",
    description:
      "Structured course content organised by university, program, branch, and semester. No more hunting across unofficial groups or third-party sites for the right syllabus.",
  },
  {
    icon: FileText,
    color: "bg-violet-500/10 text-violet-500",
    title: "PYQs and Resources",
    description:
      "Past year questions and study materials organised in one place, making exam preparation faster and far less scattered.",
  },
  {
    icon: MessageSquare,
    color: "bg-emerald-500/10 text-emerald-500",
    title: "Student Forum",
    description:
      "A focused academic discussion space for questions, answers, and peer support. Built around subjects rather than open unstructured chat.",
  },
  {
    icon: ClipboardList,
    color: "bg-amber-500/10 text-amber-500",
    title: "Attendance Tracking",
    description:
      "Real-time attendance visibility with analytics, CSV exports, and percentage calculations so students can act before shortages become a serious problem.",
  },
  {
    icon: Calculator,
    color: "bg-rose-500/10 text-rose-500",
    title: "CGPA Calculator",
    description:
      "A 10-point grading calculator with AI-powered marksheet scanning, semester-wise SGPA breakdown, a visual progression bar, and PDF or image export.",
  },
  {
    icon: ListChecks,
    color: "bg-sky-500/10 text-sky-500",
    title: "Task Tracker",
    description:
      "Manage academic tasks with priority levels, due dates, subtasks, browser reminders, and a PDF report export. Everything syncs to your account.",
  },
  {
    icon: Calendar,
    color: "bg-teal-500/10 text-teal-500",
    title: "Timetable Builder",
    description:
      "Build and save your weekly class schedule with AI scan from images, period editors, subject colour coding, and a focused Today view.",
  },
  {
    icon: Zap,
    color: "bg-indigo-500/10 text-indigo-500",
    title: "Real-Time and AI Support",
    description:
      "Live updates for attendance and notices, paired with Gemini-powered AI features that reduce manual effort across productivity tools.",
  },
  {
    icon: Bell,
    color: "bg-orange-500/10 text-orange-500",
    title: "University Notices",
    description:
      "Automated notice collection via Cloudflare Workers pulls updates from university websites, categorises them by type, and surfaces them in your dashboard.",
  },
  {
    icon: Users,
    color: "bg-pink-500/10 text-pink-500",
    title: "Profiles and Social Layer",
    description:
      "User profiles, a follow system, bookmarks, and activity tracking add a lightweight social layer that keeps academic collaboration contextual.",
  },
  {
    icon: Shield,
    color: "bg-slate-500/10 text-slate-500",
    title: "Role-Based Access",
    description:
      "A granular permission system covering students, teachers, and admins ensures each user sees and can do exactly what they are supposed to.",
  },
  {
    icon: Megaphone,
    color: "bg-cyan-500/10 text-cyan-500",
    title: "Changelog and Updates",
    description:
      "A public changelog page lets you follow platform improvements, new features, bug fixes, and breaking changes in a clean timeline format.",
  },
]

// ─── Academic hierarchy ───────────────────────────────────────────────────────
const HIERARCHY = [
  { step: "01", label: "University", desc: "Top-level institution context" },
  { step: "02", label: "Program",    desc: "e.g. B.Tech, MCA, MBA" },
  { step: "03", label: "Branch",     desc: "e.g. Computer Engineering" },
  { step: "04", label: "Semester",   desc: "Academic term selection" },
  { step: "05", label: "Subject",    desc: "Course-level learning material" },
]

// ─── Tech stack ───────────────────────────────────────────────────────────────
const TECH_STACK = [
  {
    category: "Frontend",
    icon: Monitor,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    items: ["React.js", "Tailwind CSS", "React Router", "Lucide Icons"],
  },
  {
    category: "Backend and Infrastructure",
    icon: Server,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
    items: ["Appwrite", "Cloudflare Workers", "Serverless Functions"],
  },
  {
    category: "Database",
    icon: Database,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    items: ["Appwrite Database", "Structured Collections", "Real-Time Queries"],
  },
  {
    category: "External APIs",
    icon: Globe,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    items: ["Cloudinary", "Resend + ImproveMX", "Gemini AI", "Giphy API"],
  },
]

// ─── Scrollable diagram shell (mobile-safe) ───────────────────────────────────
function ScrollDiagram({ children, minWidth = 520 }) {
  return (
    <div className="overflow-x-auto pb-1">
      <div style={{ minWidth }}>{children}</div>
    </div>
  )
}

// ─── Arrow connector ──────────────────────────────────────────────────────────
function ArrowDown() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-4 w-px bg-slate-300 dark:bg-white/20" />
      <div className="h-0 w-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-slate-300 dark:border-t-white/20" />
    </div>
  )
}

// ─── Diagram box ─────────────────────────────────────────────────────────────
const DIAG_COLORS = {
  blue:    { border: "border-blue-200 dark:border-blue-400/20",    bg: "bg-blue-50 dark:bg-blue-500/10",    text: "text-blue-700 dark:text-blue-300",    icon: "text-blue-500" },
  violet:  { border: "border-violet-200 dark:border-violet-400/20", bg: "bg-violet-50 dark:bg-violet-500/10", text: "text-violet-700 dark:text-violet-300", icon: "text-violet-500" },
  orange:  { border: "border-orange-200 dark:border-orange-400/20", bg: "bg-orange-50 dark:bg-orange-500/10", text: "text-orange-700 dark:text-orange-300", icon: "text-orange-500" },
  emerald: { border: "border-emerald-200 dark:border-emerald-400/20", bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-700 dark:text-emerald-300", icon: "text-emerald-500" },
  amber:   { border: "border-amber-200 dark:border-amber-400/20",   bg: "bg-amber-50 dark:bg-amber-500/10",   text: "text-amber-700 dark:text-amber-300",   icon: "text-amber-500" },
}

function DiagBox({ color, icon, label, sub }) {
  const c = DIAG_COLORS[color]
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${c.border} ${c.bg}`}>
      {createElement(icon, { size: 13, className: c.icon })}
      <span className={`text-[11px] font-semibold ${c.text}`}>{label}</span>
      <span className={`text-[10px] opacity-75 ${c.text}`}>{sub}</span>
    </div>
  )
}

// ─── Architecture diagram ─────────────────────────────────────────────────────
function ArchitectureDiagram() {
  return (
    <Card>
      <p className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
        System Architecture
      </p>
      <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
        How the frontend, backend, database, and external services connect.
      </p>
      <ScrollDiagram minWidth={560}>
        <div className="flex flex-col items-center gap-3">
          {/* Browser */}
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-400/20 dark:bg-blue-500/10">
            <Monitor size={14} className="text-blue-500" />
            <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Browser: React.js + Tailwind CSS + React Router
            </span>
          </div>
          <ArrowDown />
          <div className="grid w-full grid-cols-3 gap-3">
            <DiagBox color="violet"  icon={Server}    label="Appwrite Backend"   sub="Auth, DB, Functions" />
            <DiagBox color="orange"  icon={Zap}       label="Cloudflare Worker"  sub="Notice Scraping, Proxy" />
            <DiagBox color="emerald" icon={Code2}     label="Contact Worker"     sub="Form to Appwrite pipeline" />
          </div>
          <ArrowDown />
          <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-400/20 dark:bg-emerald-500/10">
            <Database size={14} className="text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Appwrite Database: Collections, Real-Time, Storage
            </span>
          </div>
          <ArrowDown />
          <div className="grid w-full grid-cols-4 gap-3">
            <DiagBox color="amber" icon={Globe}           label="Cloudinary"         sub="Media CDN" />
            <DiagBox color="amber" icon={Bell}            label="Resend + ImproveMX" sub="Email" />
            <DiagBox color="amber" icon={Bot}             label="Gemini API"         sub="AI Features" />
            <DiagBox color="amber" icon={MessageSquare}   label="Giphy API"          sub="GIF support" />
          </div>
        </div>
      </ScrollDiagram>
    </Card>
  )
}

// ─── Data flow diagram ────────────────────────────────────────────────────────
function DataFlowDiagram() {
  const steps = [
    { label: "User Action",        desc: "Click, form submit, navigation",   cls: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-300" },
    { label: "React Component",    desc: "Event handler triggered",           cls: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300" },
    { label: "Service Layer",      desc: "API call via Appwrite SDK",         cls: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-300" },
    { label: "Appwrite Backend",   desc: "Auth check, DB operation",          cls: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-400/20 dark:bg-purple-500/10 dark:text-purple-300" },
    { label: "Database",           desc: "Read or write collection",          cls: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-400/20 dark:bg-fuchsia-500/10 dark:text-fuchsia-300" },
    { label: "Response",           desc: "Data returned to client",           cls: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-400/20 dark:bg-pink-500/10 dark:text-pink-300" },
    { label: "UI Update",          desc: "State updated, view re-renders",    cls: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-300" },
  ]
  return (
    <Card>
      <p className="mb-1 text-base font-semibold text-slate-900 dark:text-white">Data Flow</p>
      <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
        How a user action travels through the system and comes back as an updated view.
      </p>
      <div className="flex flex-col items-center gap-0">
        {steps.map((step, i) => (
          <div key={step.label} className="flex w-full max-w-sm flex-col items-center">
            <div className={`w-full rounded-xl border px-4 py-2.5 text-center ${step.cls}`}>
              <div className="text-xs font-semibold">{step.label}</div>
              <div className="mt-0.5 text-[10px] opacity-70">{step.desc}</div>
            </div>
            {i < steps.length - 1 && <ArrowDown />}
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Attendance flow ──────────────────────────────────────────────────────────
function AttendanceFlowDiagram() {
  const steps = [
    { label: "Teacher creates a class",              role: "teacher", pill: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
    { label: "Students join via class code",          role: "student", pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" },
    { label: "Teacher opens a session",              role: "teacher", pill: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
    { label: "Attendance marked in real time",        role: "all",     pill: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300" },
    { label: "Session closed by teacher",            role: "teacher", pill: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300" },
    { label: "Analytics and percentages computed",    role: "system",  pill: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" },
    { label: "CSV export and printable report",       role: "admin",   pill: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300" },
  ]
  return (
    <Card>
      <p className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
        Attendance System Flow
      </p>
      <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
        Step-by-step interaction between teachers, students, and the system.
      </p>
      <div className="flex flex-col gap-2.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
              {i + 1}
            </div>
            <div className="flex flex-1 items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 dark:border-white/5 dark:bg-white/5">
              <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                {step.label}
              </span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${step.pill}`}>
                {step.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── CGPA calculator workflow ─────────────────────────────────────────────────
function CGPAFlowDiagram() {
  const steps = [
    { label: "Add a semester",                        sub: "Name it Semester 1, 2, and so on." },
    { label: "Enter subjects, credits, and grades",   sub: "Use AI Scan to auto-fill from a marksheet image or PDF." },
    { label: "SGPA computed per semester",            sub: "Earned grade points divided by total credits." },
    { label: "CGPA computed across all semesters",    sub: "Average of all semester SGPAs." },
    { label: "View grade label and percentage",       sub: "Percentage equals CGPA multiplied by 9.5." },
    { label: "Export as PDF or image",                sub: "Or save a snapshot to your history for later comparison." },
  ]
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <Calculator size={15} className="text-rose-500" />
        <p className="text-base font-semibold text-slate-900 dark:text-white">
          CGPA Calculator Workflow
        </p>
      </div>
      <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
        JC Bose 10-point grading. CGPA is the average of semester SGPAs.
      </p>
      <div className="flex flex-col gap-3">
        {steps.map((step, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-100 text-[11px] font-bold text-rose-600 dark:bg-rose-500/20 dark:text-rose-300">
              {i + 1}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                {step.label}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{step.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

// ─── Task tracker workflow ────────────────────────────────────────────────────
function TaskFlowDiagram() {
  const cols = [
    {
      label: "Create",
      cls: "border-sky-200 bg-sky-50 dark:border-sky-400/20 dark:bg-sky-500/10",
      text: "text-sky-700 dark:text-sky-300",
      steps: [
        "Title and optional description",
        "Priority: Low to Urgent",
        "Subject tag (free text)",
        "Due date and browser reminder",
      ],
    },
    {
      label: "Manage",
      cls: "border-violet-200 bg-violet-50 dark:border-violet-400/20 dark:bg-violet-500/10",
      text: "text-violet-700 dark:text-violet-300",
      steps: [
        "Add subtasks (steps)",
        "Track the progress bar",
        "Filter by priority or subject",
        "Search across all tasks",
      ],
    },
    {
      label: "Complete",
      cls: "border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-300",
      steps: [
        "Tick off individual subtasks",
        "Mark the whole task as done",
        "View total completion count",
        "Export a PDF task report",
      ],
    },
  ]
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <ListChecks size={15} className="text-sky-500" />
        <p className="text-base font-semibold text-slate-900 dark:text-white">
          Task Tracker Workflow
        </p>
      </div>
      <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
        Three stages from creation to completion. All data syncs to your account when logged in.
      </p>
      <ScrollDiagram minWidth={480}>
        <div className="grid grid-cols-3 gap-3">
          {cols.map((col) => (
            <div key={col.label} className={`rounded-xl border p-4 ${col.cls}`}>
              <p className={`mb-3 text-xs font-bold uppercase tracking-wider ${col.text}`}>
                {col.label}
              </p>
              <ul className="space-y-1.5">
                {col.steps.map((s) => (
                  <li key={s} className={`flex items-start gap-1.5 text-[11px] ${col.text}`}>
                    <span className="mt-0.5 shrink-0">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </ScrollDiagram>
    </Card>
  )
}

// ─── Timetable workflow ───────────────────────────────────────────────────────
function TimetableFlowDiagram() {
  const steps = [
    { icon: Settings,        label: "Setup tab",   desc: "Define time periods and add subjects with teacher and room info." },
    { icon: ScanLine,        label: "AI Scan",     desc: "Optionally scan a timetable image to auto-fill subjects and slots." },
    { icon: TableProperties, label: "Grid tab",    desc: "Click any cell to assign a subject to a day and period." },
    { icon: Clock,           label: "Today tab",   desc: "See only today's classes at a glance without the full grid." },
    { icon: Download,        label: "Export",      desc: "Save the timetable as a PDF or PNG image." },
    { icon: BookOpen,        label: "Saved tab",   desc: "Save multiple timetables and switch between them any time." },
  ]
  return (
    <Card>
      <div className="mb-1 flex items-center gap-2">
        <Calendar size={15} className="text-teal-500" />
        <p className="text-base font-semibold text-slate-900 dark:text-white">
          Timetable Builder Workflow
        </p>
      </div>
      <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
        Six steps from a blank grid to a fully exported weekly schedule.
      </p>
      <ScrollDiagram minWidth={520}>
        <div className="grid grid-cols-3 gap-3">
          {steps.map((step, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-xl border border-teal-200 bg-teal-50 p-3 dark:border-teal-400/20 dark:bg-teal-500/10"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[10px] font-bold text-teal-600 dark:bg-teal-500/20 dark:text-teal-300">
                  {i + 1}
                </div>
                {createElement(step.icon, { size: 13, className: "text-teal-500 shrink-0" })}
                <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-300">
                  {step.label}
                </p>
              </div>
              <p className="text-[11px] leading-relaxed text-teal-600 dark:text-teal-400">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </ScrollDiagram>
    </Card>
  )
}

// ─── Module interaction diagram ───────────────────────────────────────────────
function ModuleInteractionDiagram() {
  const modules = [
    { icon: BookOpen,      label: "Academic Content", color: "text-blue-500" },
    { icon: Users,         label: "User System",      color: "text-pink-500" },
    { icon: MessageSquare, label: "Forum",            color: "text-emerald-500" },
    { icon: Calculator,    label: "CGPA Calc",        color: "text-rose-500" },
    { icon: ListChecks,    label: "Task Tracker",     color: "text-sky-500" },
    { icon: Calendar,      label: "Timetable",        color: "text-teal-500" },
    { icon: ClipboardList, label: "Attendance",       color: "text-amber-500" },
    { icon: Shield,        label: "Admin Panel",      color: "text-slate-500" },
  ]
  return (
    <Card>
      <p className="mb-1 text-base font-semibold text-slate-900 dark:text-white">
        Module Interaction
      </p>
      <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
        All modules connect through the central dashboard and share the same auth and user layer.
      </p>
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 rounded-2xl border-2 border-indigo-300 bg-indigo-50 px-6 py-3 dark:border-indigo-400/40 dark:bg-indigo-500/10">
          <LayoutDashboard size={15} className="text-indigo-500" />
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
            Dashboard Hub
          </span>
        </div>
        <div className="h-4 w-px bg-slate-300 dark:bg-white/20" />
        <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
          {modules.map(({ icon, label, color }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-3 text-center transition-all hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-400/40"
            >
              {createElement(icon, { size: 13, className: color })}
              <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ─── Guide accordion ──────────────────────────────────────────────────────────
function GuideAccordion({ items }) {
  const [open, setOpen] = useState(null)
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-slate-200 bg-white/80 dark:border-white/10 dark:bg-white/5"
        >
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-5 py-4 text-left"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.iconBg}`}
              >
                {createElement(item.icon, { size: 14, className: item.iconColor })}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
              </div>
            </div>
            <ChevronDown
              size={15}
              className={`shrink-0 text-slate-400 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
            />
          </button>
          {open === i && (
            <div className="border-t border-slate-100 px-5 pb-5 pt-4 dark:border-white/5">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function GuideStep({ number, text, sub }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
        {number}
      </div>
      <div>
        <p className="text-xs font-medium text-slate-800 dark:text-slate-100">{text}</p>
        {sub && (
          <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{sub}</p>
        )}
      </div>
    </div>
  )
}

function GuideTip({ text }) {
  return (
    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-700 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
      <span className="font-semibold">Tip:</span> {text}
    </div>
  )
}

function GuideLabel({ text }) {
  return (
    <p className="mt-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{text}</p>
  )
}

// ─── Guide content items ──────────────────────────────────────────────────────
const GUIDE_ITEMS = [
  {
    icon: GraduationCap,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
    title: "Getting started",
    subtitle: "Account setup and academic profile",
    content: (
      <div className="space-y-3">
        <GuideStep number="1" text="Create an account or sign in with Google." />
        <GuideStep
          number="2"
          text="Complete your academic profile."
          sub="Pick your university, program, and branch. This links you to the right syllabus, resources, and notices automatically."
        />
        <GuideStep
          number="3"
          text="Explore the dashboard."
          sub="The dashboard is your home screen. It shows your syllabus, resources, PYQs, attendance, and notices all in one place."
        />
        <GuideStep
          number="4"
          text="Customise your settings."
          sub="Visit Settings to update your profile photo, bio, year of study, theme, and notification options."
        />
        <GuideTip text="If you sign in with Google and also want to use email and password, go to Settings then Account and set a password there." />
      </div>
    ),
  },
  {
    icon: BookOpen,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    title: "Finding syllabus, resources, and PYQs",
    subtitle: "Academic content navigation",
    content: (
      <div className="space-y-3">
        <GuideStep number="1" text="Go to the Universities page from the top navigation." />
        <GuideStep
          number="2"
          text="Select your university, then your program, then your branch."
          sub="Each level narrows the content to exactly what is relevant for you."
        />
        <GuideStep
          number="3"
          text="Browse syllabus by semester."
          sub="Each subject shows its units. Expand a unit to find study materials and PYQs uploaded by admins."
        />
        <GuideStep
          number="4"
          text="Inside your dashboard, use Syllabus, Resources, and PYQs from the sidebar."
          sub="These are pre-filtered to your branch and semester so you only see what applies to you."
        />
        <GuideTip text="If you have completed your academic profile, dashboard content loads pre-filtered. Public pages always work without login too." />
      </div>
    ),
  },
  {
    icon: MessageSquare,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
    title: "Using the student forum",
    subtitle: "Asking questions and joining discussions",
    content: (
      <div className="space-y-3">
        <GuideStep number="1" text="Open the Forum from the top navigation." />
        <GuideStep
          number="2"
          text="Create a thread to ask a question or start a discussion."
          sub="Add a title and body. You can format text, add code blocks, and embed GIFs."
        />
        <GuideStep
          number="3"
          text="Reply to existing threads."
          sub="Nested replies keep conversations organised. Reply to a specific comment to maintain context."
        />
        <GuideStep
          number="4"
          text="Reporting content."
          sub="Press the three-dot menu on any comment to open the options panel. Select Report and choose a reason. Admins review all reports from the moderation panel."
        />
        <GuideStep
          number="5"
          text="Pinned comments."
          sub="Admins and thread owners can pin a comment so it stays at the top of the thread, useful for marking the correct answer."
        />
        <GuideTip text="You will receive a notification when someone replies to your post or mentions you with @username." />
      </div>
    ),
  },
  {
    icon: ClipboardList,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
    title: "Tracking attendance",
    subtitle: "For students and teachers",
    content: (
      <div className="space-y-3">
        <GuideLabel text="For students" />
        <GuideStep number="1" text="Open Attendance from your dashboard sidebar." />
        <GuideStep
          number="2"
          text="Join a class using the code your teacher shares."
          sub="Once joined, you will see all sessions for that class and your running attendance percentage."
        />
        <GuideStep
          number="3"
          text="Monitor your percentage."
          sub="The system calculates attendance including mid-semester joins. A warning appears when you are close to the shortfall threshold."
        />
        <GuideLabel text="For teachers" />
        <GuideStep number="4" text="Create a class and share the code with students." />
        <GuideStep
          number="5"
          text="Open a session when class starts."
          sub="Mark each student as present or absent in real time. Close the session when class ends."
        />
        <GuideStep
          number="6"
          text="View the class report."
          sub="Download a CSV or printable report showing subject-wise analytics for each student."
        />
      </div>
    ),
  },
  {
    icon: Calculator,
    iconBg: "bg-rose-500/10",
    iconColor: "text-rose-500",
    title: "Using the CGPA calculator",
    subtitle: "10-point grading with AI marksheet scan",
    content: (
      <div className="space-y-3">
        <GuideStep number="1" text="Open CGPA Calculator from the dashboard sidebar under Tools." />
        <GuideStep
          number="2"
          text="Add a semester and enter your subjects, credits, and grades."
          sub="The grade dropdown uses the standard O, A+, A, B+, B, C, F scale with 10-point values."
        />
        <GuideStep
          number="3"
          text="Use AI Scan to auto-fill from a marksheet image."
          sub="Click the AI Scan button on any semester, upload a photo or PDF of your result card, and the system extracts all subjects automatically. Review and edit before applying."
        />
        <GuideStep
          number="4"
          text="SGPA and CGPA update live as you enter data."
          sub="The ring chart and progression bar update in real time."
        />
        <GuideStep
          number="5"
          text="Save a snapshot to your account history."
          sub="Load any saved snapshot later to restore that state and compare across semesters."
        />
        <GuideStep number="6" text="Export as PDF or image for sharing or official use." />
        <GuideTip text="The daily AI scan limit resets at midnight UTC. The remaining scan count shows next to the AI Scan button." />
      </div>
    ),
  },
  {
    icon: ListChecks,
    iconBg: "bg-sky-500/10",
    iconColor: "text-sky-500",
    title: "Managing tasks",
    subtitle: "Priority, reminders, subtasks, and PDF export",
    content: (
      <div className="space-y-3">
        <GuideStep number="1" text="Open Task Tracker from the dashboard sidebar under Tools." />
        <GuideStep
          number="2"
          text="Press New Task and fill in the title, priority, subject tag, and due date."
          sub="Priority levels are Low, Medium, High, and Urgent. Tasks sort highest priority first."
        />
        <GuideStep
          number="3"
          text="Add subtasks inside a task."
          sub="Each subtask has its own checkbox. Completed subtasks fill a progress bar on the card."
        />
        <GuideStep
          number="4"
          text="Set a browser reminder."
          sub="Allow notifications when prompted. The system polls every 30 seconds and fires a notification at the exact time you set."
        />
        <GuideStep
          number="5"
          text="Use the filter bar to narrow tasks by priority, subject, or status."
          sub="The subject filter builds itself from what you have used. No fixed categories exist."
        />
        <GuideStep
          number="6"
          text="Export a PDF report."
          sub="Press the download icon in the top bar to preview and download a formatted task report."
        />
        <GuideTip text="Tasks sync to your account when logged in. When offline or logged out, tasks are stored locally only." />
      </div>
    ),
  },
  {
    icon: Calendar,
    iconBg: "bg-teal-500/10",
    iconColor: "text-teal-500",
    title: "Building your timetable",
    subtitle: "Grid view, AI scan, and multi-timetable support",
    content: (
      <div className="space-y-3">
        <GuideStep number="1" text="Open Timetable Builder from the dashboard sidebar under Tools." />
        <GuideStep
          number="2"
          text="Go to the Setup tab."
          sub="Define your time periods first by setting start and end times and period labels. Mark any row as a break so the grid displays it correctly."
        />
        <GuideStep
          number="3"
          text="Add subjects in the Setup tab."
          sub="Each subject can have a default teacher name, room, and colour. These auto-fill when you place the subject on the grid."
        />
        <GuideStep
          number="4"
          text="Use AI Scan to auto-fill from an image."
          sub="Upload a photo of an existing timetable and the system extracts subjects and slot data. Review before applying."
        />
        <GuideStep
          number="5"
          text="Switch to the Grid tab and click any cell to assign a subject."
          sub="A modal lets you pick the subject, teacher, and room for that specific slot. These override the defaults set in Setup."
        />
        <GuideStep number="6" text="Check the Today tab for a focused view of only today's classes." />
        <GuideStep
          number="7"
          text="Save the timetable and give it a name."
          sub="You can save multiple timetables and switch between them from the Saved tab, useful when your schedule changes each semester."
        />
        <GuideStep number="8" text="Export as PDF or PNG image." />
        <GuideTip text="Toggle individual days on or off using the Active Days buttons at the top of the page if your schedule does not run a full five-day week." />
      </div>
    ),
  },
  {
    icon: Bell,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-500",
    title: "Notifications and university notices",
    subtitle: "Staying up to date without checking multiple sites",
    content: (
      <div className="space-y-3">
        <GuideStep
          number="1"
          text="University notices appear in your dashboard under the Notices section."
          sub="A Cloudflare Worker fetches updates from your university website automatically and categorises them as examination, event, recruitment, or general."
        />
        <GuideStep
          number="2"
          text="In-app notifications appear in the Notifications page inside your dashboard."
          sub="You receive notifications for replies to your forum posts, mentions, and new followers."
        />
        <GuideStep
          number="3"
          text="Enable push notifications in Settings."
          sub="Go to Settings then Preferences. Toggle Push Notifications on. Allow the browser prompt. You will then receive notifications even with the tab closed."
        />
        <GuideStep
          number="4"
          text="Manage individual notification types."
          sub="You can turn off replies, mentions, or follower alerts independently from the Preferences tab in Settings."
        />
        <GuideTip text="Push notifications require HTTPS and browser permission. On localhost they only work while the tab is open." />
      </div>
    ),
  },
  {
    icon: Settings,
    iconBg: "bg-slate-500/10",
    iconColor: "text-slate-500",
    title: "Dashboard settings",
    subtitle: "Profile, account security, academic info, and preferences",
    content: (
      <div className="space-y-3">
        <GuideLabel text="Profile tab" />
        <GuideStep
          number="1"
          text="Change your display name, bio, and year of study."
          sub="Your username is separate from your display name. Display name is what shows on posts and profiles."
        />
        <GuideStep
          number="2"
          text="Upload a profile photo."
          sub="Tap the camera icon on your avatar. Maximum file size is 5 MB."
        />
        <GuideLabel text="Account tab" />
        <GuideStep
          number="3"
          text="Change your email address."
          sub="Requires your current password to confirm."
        />
        <GuideStep
          number="4"
          text="Change or set a password."
          sub="OAuth users can set a password here to enable email and password login alongside their social login."
        />
        <GuideStep
          number="5"
          text="Change your username."
          sub="Usernames update across all your posts and replies. An availability check runs automatically as you type. Use the re-roll button to generate a random one."
        />
        <GuideStep number="6" text="Send a password recovery email from the Account tab if you have forgotten yours." />
        <GuideLabel text="Academic tab" />
        <GuideStep
          number="7"
          text="Update your university, program, and branch at any time."
          sub="Dashboard content re-filters automatically after saving."
        />
        <GuideLabel text="Preferences tab" />
        <GuideStep number="8" text="Toggle dark mode and manage notification preferences." />
        <GuideTip text="Account deletion is available at the bottom of the Account tab. Posts are removed but attendance records are preserved for class integrity." />
      </div>
    ),
  },
  {
    icon: Flag,
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
    title: "Reporting and moderation",
    subtitle: "How the community stays safe",
    content: (
      <div className="space-y-3">
        <GuideStep
          number="1"
          text="Open the options menu on any forum comment."
          sub="On desktop, click the three-dot icon that appears on hover. On mobile, tap it to open a bottom sheet with the same options."
        />
        <GuideStep
          number="2"
          text="Select Report and choose a reason."
          sub="Your report goes to the moderation queue. You do not need to do anything else."
        />
        <GuideStep
          number="3"
          text="Admins review reports in the Admin Moderation panel."
          sub="They can delete the comment, issue a ban, or dismiss the report. Banned users receive a notification and cannot post or reply until the ban is lifted."
        />
        <GuideStep
          number="4"
          text="Admins can remove a comment directly using the mod menu."
          sub="This shows as Remove (mod) rather than Delete and is only visible to users with the correct permission."
        />
        <GuideTip text="If you are banned and believe it was a mistake, contact support at the email shown in your ban notification." />
      </div>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function About() {
  useSeoMeta({
    title: "About Unizuya — Unified Academic Platform for Students",
    description:
      "Unizuya is a student-first academic platform that centralises syllabus, PYQs, attendance, forum, CGPA calculator, task tracker, timetable builder, and AI support into one unified system. Built on React, Appwrite, and Cloudflare.",
  })

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12 dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]">
      <div className="mx-auto max-w-6xl space-y-16">

        {/* 01 Hero */}
        <section className="space-y-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
            About Unizuya
          </p>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl dark:text-white">
            One platform for every academic workflow
          </h1>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Students typically switch between unofficial groups, multiple portals, and standalone tools to manage syllabus, PYQs, discussions, attendance, and planning. Unizuya brings all of that into one unified academic system built around how students actually study.
          </p>
        </section>

        {/* 02 Why it exists */}
        <section>
          <SectionHeading
            number="02"
            title="Why Unizuya Exists"
            color="blue"
            subtitle="The fragmentation problem and how a unified platform solves it."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
                The Problem
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Academic information is fragmented across unofficial WhatsApp groups, multiple university portals, and disconnected tools. Finding reliable notes, tracking attendance, or knowing about a notice requires checking several places and still often coming up short.
              </p>
            </Card>
            <Card>
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
                The Solution
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Unizuya centralises every core student workflow: content access, peer discussion, attendance tracking, productivity tools, and university updates under one clean interface with real-time capabilities and AI-enabled assistance.
              </p>
            </Card>
          </div>
        </section>

        {/* 03 Features */}
        <section>
          <SectionHeading
            number="03"
            title="Core Features"
            color="violet"
            subtitle="Twelve interconnected modules covering the full academic lifecycle."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_CARDS.map(({ icon, color, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-indigo-400/40"
              >
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${color}`}
                >
                  {createElement(icon, { size: 16 })}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold text-slate-900 dark:text-white">
                  {title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* 04 Academic Hierarchy */}
        <section>
          <SectionHeading
            number="04"
            title="Academic Hierarchy"
            color="emerald"
            subtitle="Every resource lives exactly where you would expect it based on a five-level structure."
          />
          <Card>
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-max items-center gap-2">
                {HIERARCHY.map((level, index) => (
                  <div key={level.label} className="flex items-center gap-2">
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center dark:border-white/10 dark:bg-white/5">
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-widest text-indigo-400">
                        {level.step}
                      </span>
                      <span className="block text-xs font-semibold text-slate-800 dark:text-slate-100">
                        {level.label}
                      </span>
                      <span className="mt-0.5 block text-[10px] text-slate-400 dark:text-slate-500">
                        {level.desc}
                      </span>
                    </div>
                    {index < HIERARCHY.length - 1 && (
                      <ChevronRight
                        size={14}
                        className="shrink-0 text-slate-300 dark:text-white/20"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Inside the dashboard the hierarchy is pre-applied based on your academic profile, so you always land at the right semester and branch without navigating manually.
            </p>
          </Card>
        </section>

        {/* 05 System Diagrams */}
        <section>
          <SectionHeading
            number="05"
            title="System Diagrams"
            color="amber"
            subtitle="Visual overviews of how the platform is structured and how its parts interact."
          />
          <div className="space-y-4">
            <ArchitectureDiagram />
            <div className="grid gap-4 md:grid-cols-2">
              <DataFlowDiagram />
              <AttendanceFlowDiagram />
            </div>
            <ModuleInteractionDiagram />
          </div>
        </section>

        {/* 06 Productivity Tools */}
        <section>
          <SectionHeading
            number="06"
            title="Productivity Tools"
            color="rose"
            subtitle="Three tools built specifically for student academic management, each with AI assistance and export options."
          />
          <div className="space-y-4">
            <CGPAFlowDiagram />
            <TaskFlowDiagram />
            <TimetableFlowDiagram />
          </div>
        </section>

        {/* 07 User Guide */}
        <section>
          <SectionHeading
            number="07"
            title="User Guide"
            color="sky"
            subtitle="New to Unizuya? This guide walks through every major feature so you get up to speed without getting lost."
          />
          <GuideAccordion items={GUIDE_ITEMS} />
        </section>

        {/* 08 Tech Stack */}
        <section>
          <SectionHeading
            number="08"
            title="Technology Stack"
            color="teal"
            subtitle="Built with modern, production-ready tools selected for scalability and developer experience."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TECH_STACK.map(({ category, icon, color, bg, items }) => (
              <Card key={category}>
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}
                >
                  {createElement(icon, { size: 16 })}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                  {category}
                </h3>
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${bg} ${color}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>

        {/* 09 Mission and Vision */}
        <section>
          <SectionHeading number="09" title="Mission and Vision" color="indigo" />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
                Mission
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Reduce student friction by making academic resources discoverable, reliable, and centralised under one platform so students spend less time searching and more time studying.
              </p>
            </Card>
            <Card>
              <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">
                Vision
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                Build a student-first academic operating system where real-time workflows, AI assistance, and community collaboration make each semester smoother than the last.
              </p>
            </Card>
          </div>
        </section>

        {/* 10 Developer */}
        <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 dark:border-white/10 dark:from-blue-500/10 dark:to-indigo-500/10">
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Built by
          </p>
          <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-white">Harsh Tayal</h3>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Unizuya is a student-driven capstone project built at J.C. Bose University of Science and Technology, YMCA, Faridabad. Every module addresses a real academic pain point encountered during undergraduate study. From hunting for PYQs the night before exams to manually tracking attendance across five subjects at once, each feature started as a problem before it became a solution.
          </p>
          <Link
            to="/contact"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 transition-colors hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Get in touch
            <ArrowRight size={14} />
          </Link>
        </section>

      </div>
    </main>
  )
}
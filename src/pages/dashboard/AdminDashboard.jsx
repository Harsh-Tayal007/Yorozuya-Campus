// src/pages/dashboard/AdminDashboard.jsx
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useAuth } from "@/context/AuthContext"
import { DATABASE_ID, ACTIVITIES_COLLECTION_ID } from "@/config/appwrite"
import { motion } from "framer-motion"
import {
  School, BookOpen, GitBranch, ClipboardList,
  Layers, Upload, FileText, ArrowUpRight,
  Activity, Clock,
  ClipboardCheck,
} from "lucide-react"

const collections = {
  universities: import.meta.env.VITE_APPWRITE_UNIVERSITIES_COLLECTION_ID,
  programs: import.meta.env.VITE_APPWRITE_PROGRAMS_COLLECTION_ID,
  branches: import.meta.env.VITE_APPWRITE_BRANCHES_COLLECTION_ID,
  syllabus: import.meta.env.VITE_APPWRITE_SYLLABUS_COLLECTION_ID,
  units: import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID,
  resources: import.meta.env.VITE_APPWRITE_RESOURCES_COLLECTION_ID,
  pyqs: import.meta.env.VITE_APPWRITE_PYQS_COLLECTION_ID,
}

// Stat cards are display-only — no routes, no click navigation
const STAT_CONFIG = [
  { key: "universities", label: "Universities", icon: School, permission: "manage:universities", accent: "#6366f1" },
  { key: "programs", label: "Programs", icon: BookOpen, permission: "manage:programs", accent: "#8b5cf6" },
  { key: "branches", label: "Branches", icon: GitBranch, permission: "manage:programs", accent: "#a78bfa" },
  { key: "syllabus", label: "Syllabus", icon: ClipboardList, permission: "manage:syllabus", accent: "#06b6d4" },
  { key: "units", label: "Units", icon: Layers, permission: "manage:units", accent: "#10b981" },
  { key: "resources", label: "Resources", icon: Upload, permission: "manage:resources", accent: "#f59e0b" },
  { key: "pyqs", label: "PYQs", icon: FileText, permission: "view:pyqs", accent: "#ef4444" },
]

// Quick actions are the sole navigation entry points
const ACTIONS = [
  { title: "Universities", desc: "Manage institutions", route: "/admin/universities", icon: School, permission: "manage:universities", accent: "#6366f1" },
  { title: "Programs", desc: "Manage academic programs", route: "/admin/programs", icon: BookOpen, permission: "manage:programs", accent: "#8b5cf6" },
  { title: "Branches", desc: "Add & manage branches", route: "/admin/branches", icon: GitBranch, permission: "manage:programs", accent: "#a78bfa" },
  { title: "Syllabus", desc: "Upload & manage syllabus", route: "/admin/syllabus", icon: ClipboardList, permission: "manage:syllabus", accent: "#06b6d4" },
  { title: "Units", desc: "Create & manage units", route: "/admin/units", icon: Layers, permission: "manage:units", accent: "#10b981" },
  { title: "Resources", desc: "Upload study resources", route: "/admin/resources/upload", icon: Upload, permission: "manage:resources", accent: "#f59e0b" },
  { title: "PYQs", desc: "Manage previous year questions", route: "/admin/pyq/upload", icon: FileText, permission: "manage:pyqs", accent: "#ef4444" },
  { title: "Attendance", desc: "View attendance across all classes", route: "/admin/attendance", icon: ClipboardCheck, permission: "view:attendance-reports", accent: "#10b981" },
]

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Stat Card — display only, no click ───────────────────────────────────────
function StatCard({ config, value, disabled }) {
  const Icon = config.icon

  return (
    <motion.div variants={itemVariants}>
      <div
        className={`
          group relative overflow-hidden rounded-2xl border border-border/60
          bg-card/60 backdrop-blur-sm
          transition-all duration-300 ease-out
          ${disabled ? "opacity-40" : "hover:border-border"}
        `}
      >
        <div
          className="absolute top-0 left-0 right-0 h-px opacity-40 group-hover:opacity-80 transition-opacity duration-300"
          style={{ background: `linear-gradient(90deg, transparent, ${config.accent}, transparent)` }}
        />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
          style={{ background: `radial-gradient(ellipse at 50% 0%, ${config.accent}12 0%, transparent 70%)` }}
        />

        <div className="relative p-5">
          <div className="mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                         transition-transform duration-300 group-hover:scale-105"
              style={{ background: `${config.accent}18`, border: `1px solid ${config.accent}30` }}
            >
              <Icon size={18} style={{ color: config.accent }} />
            </div>
          </div>
          <div className="space-y-0.5">
            {value === undefined ? (
              <div className="h-8 w-12 bg-muted/50 rounded-lg animate-pulse" />
            ) : (
              <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
            )}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              {config.label}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Action Card — sole navigation point ──────────────────────────────────────
function ActionCard({ action, allowed, onClick }) {
  const Icon = action.icon
  return (
    <motion.div variants={itemVariants}>
      <div
        onClick={allowed ? onClick : undefined}
        className={`
          group relative overflow-hidden rounded-2xl border border-border/50
          bg-card/50 backdrop-blur-sm p-4
          transition-all duration-300 ease-out
          ${allowed
            ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-border active:scale-[0.98]"
            : "opacity-40 cursor-not-allowed"}
        `}
      >
        <div
          className="absolute left-0 top-3 bottom-3 w-0.5 rounded-r-full
                     opacity-0 group-hover:opacity-100 scale-y-0 group-hover:scale-y-100
                     origin-center transition-all duration-300"
          style={{ background: action.accent }}
        />
        {allowed && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at 0% 50%, ${action.accent}12 0%, transparent 60%)` }}
          />
        )}
        <div className="relative flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                       transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
            style={{ background: `${action.accent}15`, border: `1px solid ${action.accent}25` }}
          >
            <Icon size={16} style={{ color: action.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{action.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{action.desc}</p>
          </div>
          <ArrowUpRight
            size={14}
            className="text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100
                       translate-x-1 group-hover:translate-x-0 transition-all duration-200"
          />
        </div>
      </div>
    </motion.div>
  )
}

// ── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ activity, index }) {
  const action = activity.action?.toLowerCase() ?? ""
  const isCreate = action.includes("creat") || action.includes("add") || action.includes("upload")
  const isDelete = action.includes("delet") || action.includes("remov")
  const isUpdate = action.includes("updat") || action.includes("edit") || action.includes("chang")
  const dot = isCreate ? "#10b981" : isDelete ? "#ef4444" : isUpdate ? "#6366f1" : "#6b7280"

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: "easeOut" }}
      className="flex items-start gap-3 px-2 py-2.5 hover:bg-muted/30 transition-colors duration-150 rounded-xl"
    >
      <div className="mt-1.5 shrink-0">
        <div className="w-2 h-2 rounded-full" style={{ background: dot, boxShadow: `0 0 6px ${dot}60` }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-relaxed">
          <span className="font-semibold text-foreground">{activity.actorName}</span>
          {" "}<span className="text-muted-foreground">{activity.action}</span>
          {" "}<span className="font-medium text-foreground/80">{activity.entityType}</span>
          {activity.entityName && (
            <span className="text-muted-foreground"> "{activity.entityName}"</span>
          )}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock size={10} className="text-muted-foreground/50" />
          <span className="text-[11px] text-muted-foreground/60">{timeAgo(activity.$createdAt)}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { hasPermission, currentUser } = useAuth()
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [universities, programs, branches, syllabus, units, resources, pyqs] =
        await Promise.all([
          databases.listDocuments(DATABASE_ID, collections.universities, [Query.limit(1)]),
          databases.listDocuments(DATABASE_ID, collections.programs, [Query.limit(1)]),
          databases.listDocuments(DATABASE_ID, collections.branches, [Query.limit(1)]),
          databases.listDocuments(DATABASE_ID, collections.syllabus, [Query.limit(1)]),
          databases.listDocuments(DATABASE_ID, collections.units, [Query.limit(1)]),
          databases.listDocuments(DATABASE_ID, collections.resources, [Query.limit(1)]),
          databases.listDocuments(DATABASE_ID, collections.pyqs, [Query.limit(1)]),
        ])
      return {
        universities: universities.total,
        programs: programs.total,
        branches: branches.total,
        syllabus: syllabus.total,
        units: units.total,
        resources: resources.total,
        pyqs: pyqs.total,
      }
    },
    staleTime: 1000 * 60 * 5,
  })

  const { data: activities = [] } = useQuery({
    queryKey: ["admin-activity"],
    queryFn: async () => {
      const res = await databases.listDocuments(
        DATABASE_ID, ACTIVITIES_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.limit(8)]
      )
      return res.documents
    },
    staleTime: 1000 * 60 * 2,
    enabled: hasPermission("view:activity-log"),
  })

  return (
    <div className="space-y-8 max-w-7xl">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex items-start justify-between gap-4 flex-wrap"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
            {getGreeting()}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {currentUser?.name || "Admin"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here's what's happening in your platform today.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-muted-foreground">Live</span>
        </div>
      </motion.div>

      {/* Stats — display only */}
      <div>
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3"
        >
          Overview
        </motion.p>
        <motion.div
          variants={containerVariants} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          {STAT_CONFIG.map(config => (
            <StatCard
              key={config.key}
              config={config}
              value={stats?.[config.key]}
              disabled={!hasPermission(config.permission)}
            />
          ))}
        </motion.div>
      </div>

      {/* Bottom: Actions + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Quick Actions */}
        <div className="lg:col-span-3">
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3"
          >
            Quick Actions
          </motion.p>
          <motion.div
            variants={containerVariants} initial="hidden" animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            {ACTIONS.map(action => (
              <ActionCard
                key={action.route}
                action={action}
                allowed={hasPermission(action.permission)}
                onClick={() => navigate(action.route)}
              />
            ))}
          </motion.div>
        </div>

        {/* Recent Activity */}
        {hasPermission("view:activity-log") && (
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
              className="flex items-center justify-between mb-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Recent Activity
              </p>
              <button
                onClick={() => navigate("/admin/activity")}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground
                           hover:text-foreground transition-colors duration-150 group"
              >
                View all
                <ArrowUpRight size={11} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-150" />
              </button>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm p-3 space-y-0.5"
            >
              {activities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Activity size={20} className="text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No recent activity</p>
                </div>
              ) : (
                activities.map((activity, i) => (
                  <ActivityItem key={activity.$id} activity={activity} index={i} />
                ))
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
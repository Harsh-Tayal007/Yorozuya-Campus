// src/pages/dashboard/AdminActivity.jsx
import { useQuery } from "@tanstack/react-query"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { DATABASE_ID, ACTIVITIES_COLLECTION_ID } from "@/config/appwrite"
import { motion } from "framer-motion"
import { Loader2, Plus, Pencil, Trash2, Shield, RefreshCw, Upload, Activity } from "lucide-react"

function parseAction(action = "") {
  const a = action.toLowerCase()
  if (a.includes("creat") || a.includes("add") || a.includes("upload"))
    return { color: "text-emerald-500", bg: "bg-emerald-500/10", dot: "#10b981", Icon: Plus }
  if (a.includes("delet") || a.includes("remov"))
    return { color: "text-red-500",     bg: "bg-red-500/10",     dot: "#ef4444", Icon: Trash2 }
  if (a.includes("updat") || a.includes("edit") || a.includes("chang"))
    return { color: "text-blue-500",    bg: "bg-blue-500/10",    dot: "#6366f1", Icon: Pencil }
  if (a.includes("role") || a.includes("permiss"))
    return { color: "text-purple-500",  bg: "bg-purple-500/10",  dot: "#8b5cf6", Icon: Shield }
  if (a.includes("upload"))
    return { color: "text-amber-500",   bg: "bg-amber-500/10",   dot: "#f59e0b", Icon: Upload }
  return   { color: "text-muted-foreground", bg: "bg-muted",     dot: "#6b7280", Icon: RefreshCw }
}

function timeAgo(dateStr) {
  const d = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return "just now"
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  // Only show full date when older than a week — no duplication
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

const ENTITY_COLORS = {
  university: "bg-sky-500/10 text-sky-500",
  program:    "bg-indigo-500/10 text-indigo-500",
  branch:     "bg-violet-500/10 text-violet-500",
  syllabus:   "bg-teal-500/10 text-teal-500",
  unit:       "bg-cyan-500/10 text-cyan-500",
  resource:   "bg-amber-500/10 text-amber-500",
  pyq:        "bg-orange-500/10 text-orange-500",
  user:       "bg-pink-500/10 text-pink-500",
}

function EntityBadge({ type }) {
  if (!type) return null
  const cls = ENTITY_COLORS[type.toLowerCase()] ?? "bg-muted text-muted-foreground"
  return (
    <span className={`inline-flex items-center px-1.5 py-px rounded text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {type}
    </span>
  )
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
}

export default function AdminActivity() {
  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["admin-activity-full"],
    queryFn: async () => {
      const res = await databases.listDocuments(
        DATABASE_ID, ACTIVITIES_COLLECTION_ID,
        [Query.orderDesc("$createdAt"), Query.limit(100)]
      )
      return res.documents
    },
    staleTime: 1000 * 60 * 2,
  })

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Activity size={18} className="text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activities.length} recent event{activities.length !== 1 ? "s" : ""}
          </p>
        </div>
      </motion.div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading activity…</span>
        </div>
      )}

      {!isLoading && activities.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No activity recorded yet
        </div>
      )}

      {!isLoading && activities.length > 0 && (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/60" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-1.5"
          >
            {activities.map((activity) => {
              const { color, bg, dot, Icon } = parseAction(activity.action)

              return (
                <motion.div
                  key={activity.$id}
                  variants={itemVariants}
                  className="relative flex gap-4 group"
                >
                  {/* Icon on timeline */}
                  <div className={`relative z-10 shrink-0 w-10 h-10 rounded-full
                                   flex items-center justify-center mt-0.5
                                   border border-border bg-background
                                   transition-colors duration-200 group-hover:${bg}`}>
                    <Icon size={14} className={color} />
                  </div>

                  {/* Card */}
                  <div className="flex-1 min-w-0 rounded-2xl border border-border/60 bg-card/60
                                   backdrop-blur-sm px-4 py-3 mb-1.5
                                   hover:border-border hover:bg-card/80
                                   transition-all duration-200">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      {/* Left: actor + action + entity */}
                      <div className="flex items-center gap-1.5 flex-wrap text-sm leading-relaxed min-w-0">
                        <span className="font-semibold text-foreground shrink-0">
                          {activity.actorName}
                        </span>
                        <span className={`text-xs font-medium shrink-0 ${color}`}>
                          {activity.action}
                        </span>
                        <EntityBadge type={activity.entityType} />
                        {activity.entityName && (
                          <span className="text-muted-foreground truncate max-w-[180px]"
                                title={activity.entityName}>
                            "{activity.entityName}"
                          </span>
                        )}
                      </div>

                      {/* Right: single timestamp only — relative if recent, date if old */}
                      <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                        {timeAgo(activity.$createdAt)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      )}
    </div>
  )
}
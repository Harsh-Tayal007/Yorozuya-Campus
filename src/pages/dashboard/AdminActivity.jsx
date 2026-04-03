// src/pages/dashboard/AdminActivity.jsx
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { DATABASE_ID, ACTIVITIES_COLLECTION_ID } from "@/config/appwrite"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, Plus, Pencil, Trash2, Shield, RefreshCw,
  Activity, ChevronDown, User, Hash, Clock, Tag,
  MessageSquare, UserX,
} from "lucide-react"

const PAGE_SIZE = 25

// ── Action classification ─────────────────────────────────────────────────────
function parseAction(action = "") {
  const a = action.toLowerCase()
  if (a.includes("deleted account") || a.includes("delete account"))
    return { color: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/20",     Icon: UserX    }
  if (a.includes("deleted reply")   || a.includes("delete reply"))
    return { color: "text-orange-500",  bg: "bg-orange-500/10",  border: "border-orange-500/20",  Icon: MessageSquare }
  if (a.includes("creat") || a.includes("add") || a.includes("upload"))
    return { color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20", Icon: Plus     }
  if (a.includes("delet") || a.includes("remov"))
    return { color: "text-red-500",     bg: "bg-red-500/10",     border: "border-red-500/20",     Icon: Trash2   }
  if (a.includes("updat") || a.includes("edit") || a.includes("chang"))
    return { color: "text-blue-500",    bg: "bg-blue-500/10",    border: "border-blue-500/20",    Icon: Pencil   }
  if (a.includes("role") || a.includes("permiss"))
    return { color: "text-purple-500",  bg: "bg-purple-500/10",  border: "border-purple-500/20",  Icon: Shield   }
  return   { color: "text-muted-foreground", bg: "bg-muted",     border: "border-border",         Icon: RefreshCw }
}

// ── Entity badge ──────────────────────────────────────────────────────────────
const ENTITY_COLORS = {
  university: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  program:    "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  branch:     "bg-violet-500/10 text-violet-500 border-violet-500/20",
  syllabus:   "bg-teal-500/10 text-teal-500 border-teal-500/20",
  unit:       "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  resource:   "bg-amber-500/10 text-amber-500 border-amber-500/20",
  pyq:        "bg-orange-500/10 text-orange-500 border-orange-500/20",
  user:       "bg-pink-500/10 text-pink-500 border-pink-500/20",
  reply:      "bg-rose-500/10 text-rose-500 border-rose-500/20",
}

function EntityBadge({ type }) {
  if (!type) return null
  const cls = ENTITY_COLORS[type.toLowerCase()] ?? "bg-muted text-muted-foreground border-border"
  return (
    <span className={`inline-flex items-center px-1.5 py-px rounded border text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {type}
    </span>
  )
}

// ── Time formatting ───────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const d    = new Date(dateStr)
  const diff = Date.now() - d.getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return "just now"
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function fullDate(dateStr) {
  return new Date(dateStr).toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

// ── Detail row inside expanded card ──────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, mono }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon size={12} className="text-muted-foreground mt-0.5 shrink-0" />
      <span className="text-xs text-muted-foreground w-20 shrink-0">{label}</span>
      <span className={`text-xs text-foreground break-all ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  )
}

// ── Activity card ─────────────────────────────────────────────────────────────
function ActivityCard({ activity, index }) {
  const [expanded, setExpanded] = useState(false)
  const { color, bg, border, Icon } = parseAction(activity.action)

  return (
    <motion.div
      key={activity.$id}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="relative flex gap-4 group"
    >
      {/* Timeline dot */}
      <div className={`relative z-10 shrink-0 w-10 h-10 rounded-full
                       flex items-center justify-center mt-0.5
                       border ${border} ${bg}
                       transition-colors duration-200`}>
        <Icon size={14} className={color} />
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 mb-3">
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className={`w-full text-left rounded-2xl border transition-all duration-200
                      ${expanded
                        ? `${border} bg-card shadow-sm`
                        : "border-border/60 bg-card/60 hover:border-border hover:bg-card/80"
                      }`}
        >
          {/* Summary row */}
          <div className="flex items-start justify-between gap-2 px-4 py-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap text-sm leading-relaxed min-w-0">
              <span className="font-semibold text-foreground shrink-0">
                {activity.actorName}
              </span>
              <span className={`text-xs font-semibold shrink-0 px-1.5 py-0.5 rounded-md ${bg} ${color}`}>
                {activity.action}
              </span>
              <EntityBadge type={activity.entityType} />
              {activity.entityName && (
                <span className="text-muted-foreground truncate max-w-[200px] text-xs"
                      title={activity.entityName}>
                  {activity.entityName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-muted-foreground tabular-nums">
                {timeAgo(activity.$createdAt)}
              </span>
              <ChevronDown
                size={13}
                className={`text-muted-foreground transition-transform duration-200
                            ${expanded ? "rotate-180" : ""}`}
              />
            </div>
          </div>

          {/* Expanded detail */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className={`mx-4 mb-3 rounded-xl border ${border} ${bg} px-3 py-2 divide-y divide-border/40`}>
                  <DetailRow icon={User}  label="Actor"      value={activity.actorName} />
                  <DetailRow icon={Hash}  label="Actor ID"   value={activity.actorId}   mono />
                  <DetailRow icon={Tag}   label="Action"     value={activity.action} />
                  <DetailRow icon={Tag}   label="Entity"     value={activity.entityType} />
                  <DetailRow icon={Hash}  label="Entity ID"  value={activity.entityId}  mono />
                  <DetailRow icon={Tag}   label="Detail"     value={activity.entityName} />
                  <DetailRow icon={Clock} label="Timestamp"  value={fullDate(activity.$createdAt)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminActivity() {
  const [cursors, setCursors]     = useState([undefined])
  const [pageIndex, setPageIndex] = useState(0)
  const currentCursor = cursors[pageIndex]

  const { data: totalCount = 0 } = useQuery({
    queryKey: ["admin-activity-count"],
    queryFn: async () => {
      const res = await databases.listDocuments(
        DATABASE_ID, ACTIVITIES_COLLECTION_ID, [Query.limit(1)]
      )
      return res.total
    },
    staleTime: 1000 * 60 * 2,
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["admin-activity-page", currentCursor],
    queryFn: async () => {
      const queries = [Query.orderDesc("$createdAt"), Query.limit(PAGE_SIZE)]
      if (currentCursor) queries.push(Query.cursorAfter(currentCursor))
      const res = await databases.listDocuments(DATABASE_ID, ACTIVITIES_COLLECTION_ID, queries)
      return res.documents
    },
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  })

  const activities = data ?? []
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const hasNext    = pageIndex < totalPages - 1
  const hasPrev    = pageIndex > 0

  const scrollTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
    const el = document.querySelector("main") ?? document.querySelector(".overflow-y-auto")
    if (el) el.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goNext = () => {
    if (!hasNext || activities.length === 0) return
    const lastId = activities[activities.length - 1].$id
    setCursors(prev => {
      const next = [...prev]
      if (!next[pageIndex + 1]) next[pageIndex + 1] = lastId
      return next
    })
    setPageIndex(i => i + 1)
    scrollTop()
  }

  const goPrev = () => {
    if (!hasPrev) return
    setPageIndex(i => i - 1)
    scrollTop()
  }

  const startItem = pageIndex * PAGE_SIZE + 1
  const endItem   = Math.min((pageIndex + 1) * PAGE_SIZE, totalCount)

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }} className="flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Activity size={18} className="text-purple-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalCount} total event{totalCount !== 1 ? "s" : ""}
            {totalPages > 1 && (
              <span className="ml-1.5 text-muted-foreground/60">
                · page {pageIndex + 1} of {totalPages}
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {(isLoading || isFetching) && (
        <div className="flex items-center gap-2 text-muted-foreground py-10 justify-center">
          <Loader2 size={16} className="animate-spin" />
          <span className="text-sm">Loading activity…</span>
        </div>
      )}

      {!isLoading && !isFetching && activities.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No activity recorded yet
        </div>
      )}

      {!isLoading && !isFetching && activities.length > 0 && (
        <>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-border/50" />
            <div className="space-y-0">
              {activities.map((activity, i) => (
                <ActivityCard key={activity.$id} activity={activity} index={i} />
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <button onClick={goPrev} disabled={!hasPrev}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium
                           text-muted-foreground hover:text-foreground hover:bg-muted
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ← Previous
              </button>
              <span className="text-xs text-muted-foreground tabular-nums">
                {startItem}–{endItem} of {totalCount}
              </span>
              <button onClick={goNext} disabled={!hasNext}
                className="px-4 py-2 rounded-xl border border-border text-sm font-medium
                           text-muted-foreground hover:text-foreground hover:bg-muted
                           disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
// src/components/dashboard/UniversityNoticesWidget.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, ExternalLink, ArrowUpRight, RefreshCw, AlertCircle } from "lucide-react"
import { fetchUniversityNotices } from "@/services/university/noticesService"
import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"

const CATEGORIES = ["All", "Examination", "Event", "Admission", "Recruitment", "Tender", "General"]

const COLORS = {
  Examination: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  Event:       "bg-violet-500/10 border-violet-500/20 text-violet-400",
  Admission:   "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  Recruitment: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  Tender:      "bg-orange-500/10 border-orange-500/20 text-orange-400",
  General:     "bg-muted/40 border-border/40 text-muted-foreground",
}

function Badge({ category }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px]
                      font-semibold border shrink-0 ${COLORS[category] ?? COLORS.General}`}>
      {category}
    </span>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return ""
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (isNaN(diff)) return ""
  if (diff < 60)   return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
}

export default function UniversityNoticesWidget() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState("All")
  const { data: identity } = useAcademicIdentity()

  const universityId   = identity?.university?.$id
  const noticesUrl     = identity?.university?.noticesUrl
  const universityName = identity?.university?.name

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey:  ["university-notices", universityId],
    queryFn:   () => fetchUniversityNotices({ universityId, noticesUrl }),
    enabled:   !!universityId && !!noticesUrl,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  })

  // Don't render if university has no noticesUrl
  if (!noticesUrl) return null

  const all      = data?.notices ?? []
  const filtered = activeCategory === "All" ? all : all.filter(n => n.category === activeCategory)
  const preview  = filtered.slice(0, 5)
  const usingFallback = Boolean(data?.fallbackReason)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-border/40">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20
                          flex items-center justify-center shrink-0">
            <Bell size={13} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">University Notices</p>
            {data?.lastFetched && (
              <p className="text-[10px] text-muted-foreground">
                Updated {timeAgo(data.lastFetched)}
                {data.stale && " · stale"}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => refetch()} disabled={isFetching}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                       hover:bg-muted/40 transition-all active:scale-95" title="Refresh">
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
          </button>
          <button onClick={() => navigate("/dashboard/notices")}
            className="inline-flex items-center gap-1 text-[11px] font-medium
                       text-muted-foreground hover:text-foreground transition-colors">
            View all <ArrowUpRight size={11} />
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1 px-4 py-2.5 overflow-x-auto border-b border-border/30"
           style={{ scrollbarWidth: "none" }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all
                        ${activeCategory === cat
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {usingFallback && !isLoading && (
          <div className="mb-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2.5 py-2 text-[11px] text-amber-600">
            Live notices are temporarily unavailable. Showing cached results.
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5 animate-pulse">
                <div className="h-3.5 bg-muted/40 rounded w-3/4" />
                <div className="h-3 bg-muted/30 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 py-4 text-destructive/70">
            <AlertCircle size={14} />
            <p className="text-xs">Failed to load.{" "}
              <button onClick={() => refetch()} className="underline">Retry</button>
            </p>
          </div>
        ) : preview.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No {activeCategory !== "All" ? activeCategory.toLowerCase() + " " : ""}notices found
          </p>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeCategory}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="divide-y divide-border/30">
              {preview.map((notice, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="py-2.5 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs text-foreground leading-snug line-clamp-2">
                        {notice.title}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge category={notice.category} />
                        {notice.date && (
                          <span className="text-[10px] text-muted-foreground">{notice.date}</span>
                        )}
                      </div>
                    </div>
                    {notice.url && (
                      <a href={notice.url} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 p-1 rounded-md text-muted-foreground/50
                                   hover:text-foreground hover:bg-muted/40 transition-all active:scale-90">
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Footer */}
        {!isLoading && !error && all.length > 0 && (
          <div className="pt-3 border-t border-border/30 flex items-center justify-between">
            <button onClick={() => navigate("/dashboard/notices")}
              className="text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
              {filtered.length > 5 ? `+${filtered.length - 5} more · ` : ""}View all in app
            </button>
            <a href={noticesUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground
                         hover:text-foreground transition-colors">
              {universityName} site <ExternalLink size={10} />
            </a>
          </div>
        )}
      </div>
    </motion.div>
  )
}

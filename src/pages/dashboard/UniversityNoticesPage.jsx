// src/pages/dashboard/UniversityNoticesPage.jsx
import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, ExternalLink, Search, X, RefreshCw, AlertCircle } from "lucide-react"
import { fetchUniversityNotices } from "@/services/university/noticesService"
import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import { BackButton } from "@/components"

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
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px]
                      font-semibold border shrink-0 ${COLORS[category] ?? COLORS.General}`}>
      {category}
    </span>
  )
}

function timeAgo(dateStr) {
  if (!dateStr) return ""
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000)
  if (diff < 60)   return `${diff} min ago`
  if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`
  return `${Math.floor(diff / 1440)} days ago`
}

export default function UniversityNoticesPage() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [search, setSearch] = useState("")
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

  const all = data?.notices ?? []

  const filtered = useMemo(() => {
    let list = activeCategory === "All" ? all : all.filter(n => n.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(n => n.title.toLowerCase().includes(q))
    }
    return list
  }, [all, activeCategory, search])

  const counts = useMemo(() => {
    const map = { All: all.length }
    CATEGORIES.slice(1).forEach(cat => { map[cat] = all.filter(n => n.category === cat).length })
    return map
  }, [all])

  return (
    <div className="space-y-5">
      <BackButton to="/dashboard" label="Overview" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <Bell size={18} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">University Notices</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {universityName ?? "Your University"}
              {data?.lastFetched && ` · Updated ${timeAgo(data.lastFetched)}`}
              {data?.stale && " · may be stale"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => refetch()} disabled={isFetching}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2
                       rounded-xl border border-border/60 bg-card/60 text-muted-foreground
                       hover:text-foreground hover:border-border transition-all active:scale-95">
            <RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          {noticesUrl && (
            <a href={noticesUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2
                         rounded-xl border border-border/60 bg-card/60 text-muted-foreground
                         hover:text-foreground hover:border-border transition-all active:scale-95">
              <ExternalLink size={12} />
              All notices on {universityName ?? "university"} site
            </a>
          )}
        </div>
      </motion.div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search notices…"
          className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl border border-border/60
                     bg-card/60 backdrop-blur-sm text-foreground placeholder:text-muted-foreground/50
                     focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40
                     transition-all" />
        {search && (
          <button onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                        transition-all duration-150 border
                        ${activeCategory === cat
                          ? "bg-foreground text-background border-foreground"
                          : "text-muted-foreground hover:text-foreground border-border/50 hover:border-border hover:bg-muted/30"}`}>
            {cat}
            {counts[cat] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full
                ${activeCategory === cat ? "bg-background/20" : "bg-muted/60"}`}>
                {counts[cat]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Notices list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/40 bg-card/40 p-4 animate-pulse">
              <div className="h-4 bg-muted/40 rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted/30 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl
                        border border-dashed border-destructive/30 gap-3">
          <AlertCircle size={20} className="text-destructive/50" />
          <p className="text-sm text-muted-foreground">Failed to load notices.</p>
          <button onClick={() => refetch()} className="text-xs text-primary hover:underline">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl
                        border border-dashed border-border/50 gap-2">
          <Bell size={20} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No {activeCategory !== "All" ? activeCategory.toLowerCase() + " " : ""}
            notices{search ? ` matching "${search}"` : ""}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div key={`${activeCategory}-${search}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }} className="space-y-2">
            {filtered.map((notice, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="group relative rounded-2xl border border-border/60 bg-card/60
                           backdrop-blur-sm hover:border-border hover:bg-card/80
                           transition-all duration-200 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-px opacity-0
                                group-hover:opacity-50 transition-opacity duration-300"
                  style={{ background: "linear-gradient(90deg, transparent, #ef4444, transparent)" }} />
                <div className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <p className="text-sm text-foreground leading-snug">{notice.title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge category={notice.category} />
                      {notice.date && (
                        <span className="text-[11px] text-muted-foreground">{notice.date}</span>
                      )}
                    </div>
                  </div>
                  {notice.url && (
                    <a href={notice.url} target="_blank" rel="noopener noreferrer"
                      className="shrink-0 flex items-center gap-1.5 text-[11px] font-medium
                                 text-muted-foreground hover:text-foreground px-2.5 py-1.5
                                 rounded-lg border border-border/50 hover:border-border
                                 bg-muted/20 hover:bg-muted/40 transition-all active:scale-95">
                      <ExternalLink size={11} /> Open
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center pb-2">
          Showing {filtered.length} of {all.length} notices
        </p>
      )}
    </div>
  )
}
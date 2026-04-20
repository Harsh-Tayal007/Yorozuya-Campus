// src/pages/updates/UpdatesPage.jsx
import { useState, useEffect } from "react"
import { Megaphone, Pin, Loader2, Tag } from "lucide-react"
import { sortUpdateLogs, updateLogsService } from "@/services/updates/updateLogsService"

const TAG_CLR = {
  feature:     "bg-blue-500/15 text-blue-400 border-blue-500/30",
  fix:         "bg-green-500/15 text-green-400 border-green-500/30",
  improvement: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  breaking:    "bg-red-500/15 text-red-400 border-red-500/30",
}

function fmtDate(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "long", year: "numeric",
  })
}

function LogEntry({ log, isFirst, isLast }) {
  return (
    <div className="relative pl-8">
      {/* Timeline dot */}
      <div className={`absolute left-0 top-1.5 w-3 h-3 rounded-full border-2 z-10
                       ${isFirst
                         ? "border-primary bg-primary shadow-[0_0_8px_2px] shadow-primary/30"
                         : "border-border bg-background"}`} />

      {/* Timeline line - solid, high contrast, stops before last entry bottom */}
      {!isLast && (
        <div className="absolute left-[5px] top-4 bottom-0 w-0.5
                        bg-border dark:bg-border/80" />
      )}

      <div className={`rounded-xl border p-5 space-y-3 mb-8
                       ${log.pinned
                         ? "border-amber-500/30 bg-amber-500/5"
                         : "border-border bg-card"}`}>

        {/* Top row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {log.pinned && <Pin size={12} className="text-amber-400 shrink-0" />}
            <h2 className="text-base font-bold text-foreground">{log.title}</h2>
            {log.version && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted
                               text-muted-foreground font-mono border border-border/50">
                {log.version}
              </span>
            )}
          </div>
          <time className="text-xs text-muted-foreground/60 shrink-0">
            {fmtDate(log.publishedAt)}
          </time>
        </div>

        {/* Tags */}
        {log.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {log.tags.map(t => (
              <span key={t}
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TAG_CLR[t]}`}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Body - rendered as rich HTML from Tiptap */}
        {log.body && log.body !== "<p></p>" && (
          <div
            className="tiptap-render text-sm text-muted-foreground leading-relaxed"
            dangerouslySetInnerHTML={{ __html: log.body }}
          />
        )}
      </div>
    </div>
  )
}

const ALL_TAGS = ["feature", "fix", "improvement", "breaking"]

export default function UpdatesPage() {
  const [logs, setLogs]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeTag, setActiveTag] = useState(null)

  useEffect(() => {
    updateLogsService.list(true)
      .then(r => setLogs(r.documents))
      .finally(() => setLoading(false))
  }, [])

  const sorted = sortUpdateLogs(logs)

  const filtered = activeTag
    ? sorted.filter(l => l.tags?.includes(activeTag))
    : sorted

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone size={15} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Changelog</h1>
        </div>
        <p className="text-sm text-muted-foreground pl-10">
          Platform updates, fixes and new features.
        </p>
      </div>

      {/* Tag filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveTag(null)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs
                      font-medium border transition-colors
                      ${!activeTag
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "border-border text-muted-foreground hover:border-primary/30"}`}>
          <Tag size={10} /> All
        </button>
        {ALL_TAGS.map(t => (
          <button key={t}
            onClick={() => setActiveTag(activeTag === t ? null : t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
                        ${activeTag === t ? TAG_CLR[t] : "border-border text-muted-foreground hover:border-primary/30"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center gap-2 py-16 justify-center text-muted-foreground">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Megaphone size={28} className="mx-auto text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            {activeTag ? `No updates tagged "${activeTag}" yet.` : "No updates published yet."}
          </p>
        </div>
      ) : (
        <div className="relative">
          {filtered.map((log, i) => (
            <LogEntry
              key={log.$id}
              log={log}
              isFirst={i === 0}
              isLast={i === filtered.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

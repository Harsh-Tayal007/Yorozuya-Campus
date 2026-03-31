// src/pages/admin/updates/AdminUpdates.jsx
import { useState } from "react"
import { Pencil, Trash2, Plus, Eye, EyeOff, Pin, Loader2, AlertCircle, Megaphone } from "lucide-react"
import useUpdateLogs from "@/hooks/useUpdateLogs"

const TAGS = ["feature", "fix", "improvement", "breaking"]
const TAG_CLR = {
  feature:     "bg-blue-500/15 text-blue-500 dark:text-blue-400 border-blue-500/30",
  fix:         "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
  improvement: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  breaking:    "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
}
const EMPTY = { title: "", body: "", version: "", tags: [], isPublished: false, pinned: false }

function fmtDate(iso) {
  if (!iso) return ""
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function TagPill({ tag, selected, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                  ${selected ? TAG_CLR[tag] : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
      {tag}
    </button>
  )
}

function LogCard({ log, onEdit, onDelete, onTogglePublish, isLast }) {
  return (
    <div className="relative pl-9">
      {/* Timeline dot */}
      <div className={`absolute left-0 top-[18px] w-3.5 h-3.5 rounded-full border-2 z-10
                       ${log.isPublished
                         ? "border-primary bg-primary shadow-[0_0_0_4px] shadow-primary/15"
                         : "border-muted-foreground/40 bg-background"}`} />
      {/* Timeline line — thicker and more visible */}
      {!isLast && (
        <div className="absolute left-[6px] top-8 bottom-0 w-0.5
                        bg-gradient-to-b from-border via-border/60 to-transparent" />
      )}

      <div className={`rounded-xl border p-4 space-y-2.5 mb-6 transition-colors
                       ${log.isPublished
                         ? "border-border bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm"
                         : "border-dashed border-border/50 bg-muted/20"}`}>

        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {log.pinned && <Pin size={12} className="text-amber-400 shrink-0" />}
            <span className="font-semibold text-sm text-foreground">{log.title}</span>
            {log.version && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted
                               text-muted-foreground font-mono border border-border/50">
                {log.version}
              </span>
            )}
            {!log.isPublished && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-medium
                               bg-amber-500/10 text-amber-600 dark:text-amber-400
                               border border-amber-500/20">
                Draft
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onTogglePublish(log)}
              title={log.isPublished ? "Unpublish" : "Publish"}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground
                         hover:text-foreground transition-colors">
              {log.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button onClick={() => onEdit(log)}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground
                         hover:text-foreground transition-colors">
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(log.$id)}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground
                         hover:text-red-500 transition-colors">
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {log.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {log.tags.map(t => (
              <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TAG_CLR[t]}`}>
                {t}
              </span>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap leading-relaxed">
          {log.body}
        </p>

        {log.publishedAt && (
          <p className="text-[10px] text-muted-foreground/50">{fmtDate(log.publishedAt)}</p>
        )}
      </div>
    </div>
  )
}

export default function AdminUpdates() {
  const { logs, loading, saving, error, save, remove } = useUpdateLogs()
  const [form, setForm]           = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm]   = useState(false)

  const set       = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleTag = (tag) =>
    set("tags", form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag])

  const handleEdit = (log) => {
    setForm({
      title: log.title, body: log.body, version: log.version ?? "",
      tags: log.tags ?? [], isPublished: log.isPublished, pinned: log.pinned ?? false,
    })
    setEditingId(log.$id); setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleTogglePublish = async (log) =>
    save({
      title: log.title, body: log.body, version: log.version ?? "",
      tags: log.tags ?? [], pinned: log.pinned ?? false,
      isPublished: !log.isPublished,
    }, log.$id)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = await save(form, editingId)
    if (ok) { setForm(EMPTY); setEditingId(null); setShowForm(false) }
  }

  const handleCancel = () => { setForm(EMPTY); setEditingId(null); setShowForm(false) }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                          flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Megaphone size={17} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Update Logs</h1>
            <p className="text-xs text-muted-foreground">Publish platform changelogs visible to users</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                       bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus size={13} /> New Update
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-5 rounded-xl
                        bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit}
          className="rounded-xl border border-border mb-8
                     bg-white/60 dark:bg-white/[0.03]
                     backdrop-blur-sm shadow-sm p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">
            {editingId ? "Edit Update" : "New Update Log"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              className="sm:col-span-2 px-3 py-2 rounded-lg border border-border bg-muted/60
                         text-sm text-foreground placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-1 focus:ring-primary transition"
              placeholder="Title  e.g. Update March 31 2026"
              value={form.title} onChange={e => set("title", e.target.value)} required
            />
            <input
              className="px-3 py-2 rounded-lg border border-border bg-muted/60
                         text-sm text-foreground font-mono placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-1 focus:ring-primary transition"
              placeholder="Version  e.g. v1.2"
              value={form.version} onChange={e => set("version", e.target.value)}
            />
          </div>

          <textarea rows={6}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/60
                       text-sm text-foreground font-mono placeholder:text-muted-foreground/50
                       focus:outline-none focus:ring-1 focus:ring-primary resize-y transition"
            placeholder={"Markdown supported\n\n- Added notifications page\n- Fixed stats flush bug"}
            value={form.body} onChange={e => set("body", e.target.value)} required
          />

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">Tags</p>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(t => (
                <TagPill key={t} tag={t} selected={form.tags.includes(t)} onClick={() => toggleTag(t)} />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6">
            {[
              { key: "isPublished", label: "Publish now" },
              { key: "pinned",      label: "Pin to top"  },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() => set(key, !form[key])}>
                <div className={`w-8 h-4 rounded-full transition-colors relative
                                ${form[key] ? "bg-primary" : "bg-muted border border-border"}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow
                                   transition-transform duration-200
                                   ${form[key] ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button type="submit" disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold
                         bg-primary text-primary-foreground hover:bg-primary/90
                         disabled:opacity-50 transition-colors">
              {saving && <Loader2 size={12} className="animate-spin" />}
              {saving ? "Saving…" : editingId ? "Update" : "Publish"}
            </button>
            <button type="button" onClick={handleCancel}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-border
                         text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : logs.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">No update logs yet.</p>
      ) : (
        <div className="relative">
          {logs.map((log, i) => (
            <LogCard key={log.$id} log={log}
              isLast={i === logs.length - 1}
              onEdit={handleEdit}
              onDelete={remove}
              onTogglePublish={handleTogglePublish}
            />
          ))}
        </div>
      )}
    </div>
  )
}
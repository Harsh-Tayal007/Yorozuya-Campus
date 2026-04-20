// src/pages/admin/updates/AdminUpdates.jsx
import { useState } from "react"
import {
  Pencil, Trash2, Plus, Eye, EyeOff, Pin,
  Loader2, AlertCircle, Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import useUpdateLogs from "@/hooks/useUpdateLogs"
import TiptapEditor from "@/components/forum/TiptapEditor"
import { sortUpdateLogs } from "@/services/updates/updateLogsService"

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
    <button
      type="button"
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border
                  transition-all duration-150 cursor-pointer select-none active:scale-95
                  ${selected
                    ? TAG_CLR[tag]
                    : "border-border text-muted-foreground bg-muted/40 dark:bg-muted/20 hover:border-primary/40 hover:text-foreground"
                  }`}
    >
      {tag}
    </button>
  )
}

// ── Renders stored Tiptap HTML output in the card ────────────────────────────
function LogBody({ html }) {
  if (!html || html === "<p></p>") return null
  return (
    <div
      className="tiptap-render text-xs text-muted-foreground leading-relaxed mt-1"
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
      {!isLast && (
        <div className="absolute left-[6px] top-8 bottom-0 w-0.5
                        bg-gradient-to-b from-border via-border/60 to-transparent" />
      )}

      <div className={`rounded-xl border mb-6 transition-colors overflow-hidden
                       ${log.isPublished
                         ? "border-border bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm"
                         : "border-dashed border-border/50 bg-muted/20"}`}>

        {/* Card header */}
        <div className="flex items-start justify-between gap-2 flex-wrap px-4 pt-4 pb-2">
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
            <button
              onClick={() => onTogglePublish(log)}
              title={log.isPublished ? "Unpublish" : "Publish"}
              className="p-1.5 rounded-lg bg-transparent hover:bg-muted active:scale-90
                         text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
            >
              {log.isPublished ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
            <button
              onClick={() => onEdit(log)}
              className="p-1.5 rounded-lg bg-transparent hover:bg-muted active:scale-90
                         text-muted-foreground hover:text-foreground transition-all duration-150 cursor-pointer"
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={() => onDelete(log.$id)}
              className="p-1.5 rounded-lg bg-transparent hover:bg-red-500/10 active:scale-90
                         text-muted-foreground hover:text-red-500 transition-all duration-150 cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Tags */}
        {log.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-4 pb-2">
            {log.tags.map(t => (
              <span key={t} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TAG_CLR[t]}`}>
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Body - rich Tiptap HTML with fade */}
        {log.body && log.body !== "<p></p>" && (
          <div className="relative px-4 pb-3">
            <div className="relative max-h-[96px] overflow-hidden">
              <LogBody html={log.body} />
              <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none
                              bg-gradient-to-t from-white/90 dark:from-card/90 to-transparent" />
            </div>
          </div>
        )}

        {/* Footer date */}
        {log.publishedAt && (
          <div className="px-4 py-2 border-t border-border/40 bg-muted/20">
            <p className="text-[10px] text-muted-foreground/40">{fmtDate(log.publishedAt)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Reusable toggle switch ────────────────────────────────────────────────────
function Toggle({ checked, onChange, label }) {
  return (
    <div className="flex items-center gap-2 cursor-pointer select-none" onClick={onChange}>
      <div className={`w-8 h-4 rounded-full transition-colors relative
                      ${checked ? "bg-primary" : "bg-muted border border-border"}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow
                         transition-transform duration-200
                         ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function AdminUpdates() {
  const { logs, loading, saving, error, save, remove } = useUpdateLogs()
  const sortedLogs = sortUpdateLogs(logs)
  const [form, setForm]           = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm]   = useState(false)

  const set       = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleTag = (tag) =>
    set("tags", form.tags.includes(tag) ? form.tags.filter(t => t !== tag) : [...form.tags, tag])

  const handleEdit = (log) => {
    setForm({
      title:       log.title,
      body:        log.body,
      version:     log.version  ?? "",
      tags:        log.tags     ?? [],
      isPublished: log.isPublished,
      pinned:      log.pinned   ?? false,
    })
    setEditingId(log.$id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleTogglePublish = async (log) =>
    save({
      title: log.title, body: log.body, version: log.version ?? "",
      tags: log.tags ?? [], pinned: log.pinned ?? false,
      isPublished: !log.isPublished,
    }, log.$id)

  const handleSubmit = async () => {
    const isBodyEmpty = !form.body?.trim() || form.body === "<p></p>"
    if (!form.title.trim() || isBodyEmpty) return
    const ok = await save(form, editingId)
    if (ok) { setForm(EMPTY); setEditingId(null); setShowForm(false) }
  }

  const handleCancel = () => { setForm(EMPTY); setEditingId(null); setShowForm(false) }

  const isBodyEmpty = !form.body?.trim() || form.body === "<p></p>"
  const canSubmit   = form.title.trim() && !isBodyEmpty

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

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
          <Button
            size="sm"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-full text-xs h-8 px-3"
          >
            <Plus size={13} /> New Update
          </Button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-5 rounded-xl
                        bg-destructive/10 border border-destructive/20 text-sm text-destructive">
          <AlertCircle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* ── Form - mirrors CreateReplyBox card layout ── */}
      {showForm && (
        <div className="rounded-xl border border-border mb-8 overflow-hidden
                        bg-white/60 dark:bg-white/[0.03] backdrop-blur-sm shadow-sm">

          {/* Title + version - top input row separated by a bottom border */}
          <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-border">
            <input
              className="sm:col-span-2 px-4 py-3 sm:border-r sm:border-border
                         bg-transparent text-sm font-medium text-foreground
                         placeholder:text-muted-foreground/40
                         focus:outline-none"
              placeholder="Update title"
              value={form.title}
              onChange={e => set("title", e.target.value)}
            />
            <input
              className="px-4 py-3 bg-transparent text-sm text-foreground font-mono
                         placeholder:text-muted-foreground/40 border-t sm:border-t-0 border-border
                         focus:outline-none"
              placeholder="Version  (e.g. v1.0)"
              value={form.version}
              onChange={e => set("version", e.target.value)}
            />
          </div>

          {/* Tiptap rich text editor */}
          <TiptapEditor
            content={form.body}
            onChange={v => set("body", v)}
            onSubmit={handleSubmit}
            placeholder="Describe what changed - supports bold, lists, headings…"
            autoFocus={false}
          />

          {/* Tags row */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-t border-border flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-widest
                             text-muted-foreground/50 shrink-0">
              Tags
            </span>
            {TAGS.map(t => (
              <TagPill key={t} tag={t} selected={form.tags.includes(t)} onClick={() => toggleTag(t)} />
            ))}
          </div>

          {/* Bottom action bar - toggles left, buttons right */}
          <div className="flex items-center justify-between gap-3 px-3 py-2
                          border-t border-border bg-muted/10">
            <div className="flex items-center gap-4">
              <Toggle
                checked={form.isPublished}
                onChange={() => set("isPublished", !form.isPublished)}
                label="Publish now"
              />
              <Toggle
                checked={form.pinned}
                onChange={() => set("pinned", !form.pinned)}
                label="Pin"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-3 rounded-full text-xs"
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 px-3 rounded-full text-xs"
                onClick={handleSubmit}
                disabled={saving || !canSubmit}
              >
                {saving
                  ? <Loader2 size={12} className="animate-spin" />
                  : editingId ? "Update" : "Publish"
                }
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 justify-center text-muted-foreground">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : sortedLogs.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-12">No update logs yet.</p>
      ) : (
        <div className="relative">
          {sortedLogs.map((log, i) => (
            <LogCard
              key={log.$id}
              log={log}
              isLast={i === sortedLogs.length - 1}
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

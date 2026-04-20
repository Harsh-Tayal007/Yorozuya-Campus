import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import {
  fetchContactMessages,
  updateMessageStatus,
  updateMessage
} from "@/services/admin/contactMessagesService"
import {
  Mail,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  AlertCircle,
  Save,
  ChevronDown,
  MessageSquare,
  Inbox,
  StickyNote,
  Monitor,
  User2,
  ArrowLeft,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { AnimatePresence, motion } from "framer-motion"

const STATUS_CONFIG = {
  new: {
    label: "New",
    color: "bg-blue-500/15 text-blue-400 border border-blue-500/25",
    dot: "bg-blue-400",
    icon: Mail,
  },
  seen: {
    label: "Seen",
    color: "bg-amber-500/15 text-amber-400 border border-amber-500/25",
    dot: "bg-amber-400",
    icon: Eye,
  },
  resolved: {
    label: "Resolved",
    color: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25",
    dot: "bg-emerald-400",
    icon: CheckCircle2,
  },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.seen
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}

// ── Mobile: expandable message card ──────────────────────────────────────────
function MobileMessageCard({ msg, onStatusChange, updating, currentUser }) {
  const [open, setOpen] = useState(false)
  const [adminNote, setAdminNote] = useState(msg.admin_note || "")
  const [saving, setSaving] = useState(false)

  async function handleSaveNote() {
    setSaving(true)
    try {
      await updateMessage(msg.$id, {
        admin_note: adminNote.trim() || null,
        handled_by: currentUser?.username || currentUser?.email || null,
      })
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  const isNew = msg.status === "new"

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden transition-colors
        ${isNew
          ? "border-blue-500/25 bg-blue-500/5"
          : "border-border/60 bg-card/60"
        } backdrop-blur-sm`}
    >
      {/* Header row - always visible */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className={`p-2 rounded-xl shrink-0 border
          ${isNew
            ? "bg-blue-500/10 border-blue-500/20"
            : "bg-muted/30 border-border/40"
          }`}>
          <MessageSquare size={13} className={isNew ? "text-blue-400" : "text-muted-foreground"} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className={`text-sm font-semibold truncate ${isNew ? "text-blue-300" : "text-foreground"}`}>
              {msg.name}
            </p>
          </div>
          <p className="text-xs text-muted-foreground truncate">{msg.email}</p>
          <p className="text-xs text-foreground/60 line-clamp-1 mt-0.5">{msg.message}</p>
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusBadge status={msg.status} />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock size={9} />
            {formatDistanceToNow(new Date(msg.$createdAt), { addSuffix: true })}
          </div>
        </div>

        <ChevronDown
          size={14}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ml-1
            ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Expandable detail */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/40 px-4 py-4 space-y-4">
              {/* Message body */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1.5">Message</p>
                <div className="rounded-xl border border-border/40 bg-muted/20 px-3 py-3 text-sm text-foreground/80 whitespace-pre-wrap">
                  {msg.message}
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Clock size={11} />
                  {new Date(msg.$createdAt).toLocaleString()}
                </div>
                {msg.source && (
                  <span className="px-2 py-0.5 rounded-lg bg-muted/40 border border-border/40 text-[10px]">
                    {msg.source}
                  </span>
                )}
              </div>

              {/* Status actions */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Change Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
                    const Icon = cfg.icon
                    const isActive = msg.status === status
                    return (
                      <button
                        key={status}
                        onClick={() => onStatusChange(msg.$id, status)}
                        disabled={updating || isActive}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                          border transition-all disabled:opacity-50 disabled:cursor-not-allowed
                          ${isActive
                            ? "bg-muted/40 text-muted-foreground border-border/40 cursor-default"
                            : "bg-card/60 border-border/60 hover:bg-muted/40 text-foreground"
                          }`}
                      >
                        <Icon size={12} />
                        Mark {cfg.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Admin note */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Admin Note (Internal)
                </p>
                <textarea
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Add internal notes…"
                  rows={3}
                  className="w-full rounded-xl border border-border/60 bg-card/60 px-3 py-2.5 text-sm
                    text-foreground placeholder:text-muted-foreground/40
                    focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500
                    transition-all resize-none"
                />
                <button
                  onClick={handleSaveNote}
                  disabled={saving || adminNote === (msg.admin_note || "")}
                  className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                    bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium
                    transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving
                    ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
                    : <><Save size={12} /> Save Note</>
                  }
                </button>
              </div>

              {/* Metadata footer */}
              {(msg.user_agent || msg.handled_by) && (
                <div className="pt-3 border-t border-border/40 space-y-2">
                  {msg.user_agent && (
                    <div className="flex items-start gap-2">
                      <Monitor size={11} className="text-muted-foreground/50 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-muted-foreground/60 break-all">{msg.user_agent}</p>
                    </div>
                  )}
                  {msg.handled_by && (
                    <div className="flex items-center gap-2">
                      <User2 size={11} className="text-muted-foreground/50 shrink-0" />
                      <p className="text-[10px] text-muted-foreground/60">
                        {msg.handled_by}
                        {msg.handled_at && (
                          <span className="ml-1.5">· {new Date(msg.handled_at).toLocaleString()}</span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Desktop: sidebar list item ────────────────────────────────────────────────
function MessageListItem({ msg, isSelected, onClick }) {
  const isNew = msg.status === "new"
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 border-b border-border/40 transition-colors
        ${isSelected ? "bg-indigo-500/10" : "hover:bg-muted/20"}
        ${isNew && !isSelected ? "bg-blue-500/5" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className={`text-sm font-semibold truncate
          ${isNew ? "text-blue-300" : "text-foreground"}`}>
          {msg.name}
        </p>
        <StatusBadge status={msg.status} />
      </div>
      <p className="text-xs text-muted-foreground truncate mb-1.5">{msg.email}</p>
      <p className="text-xs text-foreground/60 line-clamp-2 mb-2">{msg.message}</p>
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock size={9} />
        {formatDistanceToNow(new Date(msg.$createdAt), { addSuffix: true })}
      </div>
    </button>
  )
}

// ── Desktop: detail pane ──────────────────────────────────────────────────────
function MessageDetail({ msg, onStatusChange, onSaveNote, updating, adminNote, setAdminNote }) {
  if (!msg) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px]
        rounded-2xl border border-dashed border-border/50 text-center">
        <div className="p-4 rounded-2xl bg-muted/20 mb-3">
          <Inbox size={22} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">Select a message to view details</p>
      </div>
    )
  }

  return (
    <motion.div
      key={msg.$id}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/40 bg-muted/10">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">{msg.name}</h2>
            <a
              href={`mailto:${msg.email}`}
              className="text-sm text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
            >
              {msg.email}
            </a>
          </div>
          <StatusBadge status={msg.status} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock size={11} />
            {new Date(msg.$createdAt).toLocaleString()}
          </div>
          {msg.source && (
            <span className="px-2 py-0.5 rounded-lg bg-muted/40 border border-border/40 text-[10px] text-muted-foreground">
              {msg.source}
            </span>
          )}
        </div>
      </div>

      <div className="px-6 py-5 space-y-6">
        {/* Message body */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <MessageSquare size={11} /> Message
          </p>
          <div className="rounded-xl border border-border/40 bg-muted/20 px-4 py-3.5 text-sm text-foreground/80 whitespace-pre-wrap">
            {msg.message}
          </div>
        </div>

        {/* Status actions */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Actions
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
              const Icon = cfg.icon
              const isActive = msg.status === status
              return (
                <button
                  key={status}
                  onClick={() => onStatusChange(msg.$id, status)}
                  disabled={updating || isActive}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                    border transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    ${isActive
                      ? "bg-muted/40 text-muted-foreground border-border/40"
                      : "bg-card/60 border-border/60 hover:bg-muted/40 hover:border-indigo-500/30 text-foreground"
                    }`}
                >
                  <Icon size={12} />
                  Mark as {cfg.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Admin note */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <StickyNote size={11} /> Admin Note (Internal)
          </p>
          <textarea
            value={adminNote}
            onChange={e => setAdminNote(e.target.value)}
            placeholder="Add internal notes about this message…"
            rows={4}
            className="w-full rounded-xl border border-border/60 bg-card/40 px-3 py-2.5 text-sm
              text-foreground placeholder:text-muted-foreground/40
              focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500
              transition-all resize-none"
          />
          <button
            onClick={onSaveNote}
            disabled={updating || adminNote === (msg.admin_note || "")}
            className="mt-2.5 flex items-center gap-1.5 px-4 py-2 rounded-xl
              bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating
              ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
              : <><Save size={13} /> Save Note</>
            }
          </button>
        </div>

        {/* Metadata */}
        {(msg.user_agent || msg.handled_by) && (
          <div className="pt-4 border-t border-border/40 space-y-3">
            {msg.user_agent && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <Monitor size={10} /> User Agent
                </p>
                <p className="text-xs text-foreground/50 break-all">{msg.user_agent}</p>
              </div>
            )}
            {msg.handled_by && (
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1.5">
                  <User2 size={10} /> Handled By
                </p>
                <p className="text-xs text-foreground/50">
                  {msg.handled_by}
                  {msg.handled_at && (
                    <span className="ml-2 text-muted-foreground/40">
                      · {new Date(msg.handled_at).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function AdminContactMessages() {
  const { currentUser } = useAuth()
  const [messages, setMessages] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(false)
  const [adminNote, setAdminNote] = useState("")
  // Mobile: show detail pane or list
  const [mobileView, setMobileView] = useState("list") // "list" | "detail"

  useEffect(() => { loadMessages() }, [])

  useEffect(() => {
    if (selectedMessage) setAdminNote(selectedMessage.admin_note || "")
  }, [selectedMessage])

  async function loadMessages() {
    setLoading(true)
    setError("")
    try {
      const data = await fetchContactMessages()
      setMessages(data)
      if (!selectedMessage && data.length > 0) setSelectedMessage(data[0])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(messageId, newStatus) {
    setUpdating(true)
    try {
      await updateMessageStatus(messageId, newStatus)
      setMessages(prev => prev.map(m => m.$id === messageId ? { ...m, status: newStatus } : m))
      if (selectedMessage?.$id === messageId)
        setSelectedMessage(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  async function handleSaveNote() {
    if (!selectedMessage) return
    setUpdating(true)
    try {
      await updateMessage(selectedMessage.$id, {
        admin_note: adminNote.trim() || null,
        handled_by: currentUser?.username || currentUser?.email || null,
      })
      setMessages(prev =>
        prev.map(m =>
          m.$id === selectedMessage.$id ? { ...m, admin_note: adminNote.trim() || null } : m
        )
      )
      setSelectedMessage(prev => ({ ...prev, admin_note: adminNote.trim() || null }))
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdating(false)
    }
  }

  const newCount = messages.filter(m => m.status === "new").length

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ── Error ──
  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/25 bg-destructive/10 p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertCircle size={15} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <Mail size={16} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Contact Messages</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {messages.length} total message{messages.length !== 1 ? "s" : ""}
            {newCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                bg-blue-500/15 text-blue-400 border border-blue-500/25 text-[10px] font-bold">
                {newCount} new
              </span>
            )}
          </p>
        </div>
      </motion.div>

      {/* ── Empty state ── */}
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl
          border border-dashed border-border/50 py-20">
          <div className="p-4 rounded-2xl bg-muted/20 mb-3">
            <Inbox size={22} className="text-muted-foreground/30" />
          </div>
          <h3 className="text-sm font-semibold mb-1">No messages yet</h3>
          <p className="text-xs text-muted-foreground">Contact form submissions will appear here</p>
        </div>
      ) : (
        <>
          {/* ══════════════ DESKTOP LAYOUT ══════════════ */}
          <div className="hidden lg:grid lg:grid-cols-[340px_1fr] gap-4">
            {/* Sidebar list */}
            <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="max-h-[calc(100vh-220px)] overflow-y-auto">
                {messages.map(msg => (
                  <MessageListItem
                    key={msg.$id}
                    msg={msg}
                    isSelected={selectedMessage?.$id === msg.$id}
                    onClick={() => setSelectedMessage(msg)}
                  />
                ))}
              </div>
            </div>

            {/* Detail pane */}
            <MessageDetail
              msg={selectedMessage}
              onStatusChange={handleStatusChange}
              onSaveNote={handleSaveNote}
              updating={updating}
              adminNote={adminNote}
              setAdminNote={setAdminNote}
            />
          </div>

          {/* ══════════════ MOBILE LAYOUT ══════════════ */}
          <div className="lg:hidden space-y-3">
            {messages.map((msg, i) => (
              <motion.div
                key={msg.$id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <MobileMessageCard
                  msg={msg}
                  onStatusChange={handleStatusChange}
                  updating={updating}
                  currentUser={currentUser}
                />
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
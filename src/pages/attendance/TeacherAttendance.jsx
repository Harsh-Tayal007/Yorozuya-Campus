import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Plus, ChevronRight, Users, BookOpen, Hash,
  Copy, Check, RefreshCw, UserMinus, BarChart2,
  Pencil, Trash2, ChevronDown
} from "lucide-react"
import { Link } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  useClasses, useCreateClass, useUpdateClass,
  useDeleteClass, useRemoveStudent, useClassRoster
} from "@/hooks/attendance/useClasses"
import {
  useActiveSession, useStartSession, useCloseSession,
  useSessionRecords, useManualMark, useSessionTokens,
  useSuspendSession
} from "@/hooks/attendance/useAttendanceSession"

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = `w-full h-9 px-3 rounded-xl border border-border/60 bg-card/60
  text-sm text-foreground placeholder:text-muted-foreground/50
  focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500
  hover:border-border transition-all duration-150`

// ── LEET badge ────────────────────────────────────────────────────────────────
function LeetBadge() {
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded
                     bg-amber-500/15 text-amber-400 border border-amber-500/20
                     uppercase tracking-wide">LEET</span>
  )
}

// ── Invite code badge ─────────────────────────────────────────────────────────
function InviteCodeBadge({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy}
      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg
                 bg-indigo-500/10 border border-indigo-500/20
                 text-indigo-400 text-xs font-mono hover:bg-indigo-500/20 transition-all">
      <Hash size={10} />{code}
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  )
}

// ── Custom subject dropdown ───────────────────────────────────────────────────
function SubjectDropdown({ subjects, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useState(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  })

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`${inputCls} flex items-center justify-between text-left`}
      >
        <span className={value ? "text-foreground" : "text-muted-foreground/50"}>
          {value || "Select subject"}
        </span>
        <ChevronDown size={14}
          className={`text-muted-foreground transition-transform duration-200 shrink-0
                      ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-[calc(100%+6px)] left-0 right-0
                       bg-card border border-border/60 rounded-xl shadow-xl
                       overflow-hidden backdrop-blur-sm"
          >
            {subjects.map(s => (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false) }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors duration-100
                            hover:bg-muted/60
                            ${value === s
                              ? "text-indigo-400 bg-indigo-500/10"
                              : "text-foreground"}`}
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Subject list editor (used in create + edit modals) ────────────────────────
function SubjectListEditor({ subjects, setSubjects }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">Subjects</p>
      {subjects.map((s, i) => (
        <div key={i} className="flex gap-2">
          <input
            placeholder={`Subject ${i + 1}`}
            value={s}
            onChange={e => {
              const n = [...subjects]; n[i] = e.target.value; setSubjects(n)
            }}
            className={inputCls + " flex-1"}
          />
          {subjects.length > 1 && (
            <button
              onClick={() => setSubjects(subjects.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-destructive px-2 transition-colors">
              ×
            </button>
          )}
        </div>
      ))}
      <button
        onClick={() => setSubjects([...subjects, ""])}
        className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
        + Add subject
      </button>
    </div>
  )
}

// ── Create class modal ────────────────────────────────────────────────────────
function CreateClassModal({ onClose }) {
  const [form, setForm] = useState({ name: "", branch: "", semester: "", totalStrength: "" })
  const [subjects, setSubjects] = useState([""])
  const createClass = useCreateClass()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.branch || !form.semester || !form.totalStrength) return
    const validSubjects = subjects.filter(s => s.trim())
    if (validSubjects.length === 0) return
    await createClass.mutateAsync({
      name: form.name, branch: form.branch,
      semester: parseInt(form.semester),
      subjects: validSubjects,
      totalStrength: parseInt(form.totalStrength),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl
                   w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold">Create New Class</h2>
        <div className="space-y-3">
          <input
            placeholder="e.g. CSE A · 4th Sem · Morning Batch"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Branch (e.g. CSE)"
              value={form.branch} onChange={e => set("branch", e.target.value)}
              className={inputCls} />
            <input placeholder="Semester" type="number" min="1" max="8"
              value={form.semester} onChange={e => set("semester", e.target.value)}
              className={inputCls} />
          </div>
          <input placeholder="Total strength" type="number" min="1"
            value={form.totalStrength} onChange={e => set("totalStrength", e.target.value)}
            className={inputCls} />
          <SubjectListEditor subjects={subjects} setSubjects={setSubjects} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-border/60 text-sm
                       text-muted-foreground hover:bg-muted transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={createClass.isPending}
            className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       text-white text-sm font-medium transition-all disabled:opacity-50">
            {createClass.isPending ? "Creating…" : "Create"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Edit class modal ──────────────────────────────────────────────────────────
function EditClassModal({ cls, onClose }) {
  const [form, setForm] = useState({
    name: cls.name,
    branch: cls.branch,
    semester: String(cls.semester),
    totalStrength: String(cls.totalStrength),
  })
  const [subjects, setSubjects] = useState([...cls.subjects])
  const updateClass = useUpdateClass()
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    if (!form.name || !form.branch || !form.semester || !form.totalStrength) return
    const validSubjects = subjects.filter(s => s.trim())
    if (validSubjects.length === 0) return
    await updateClass.mutateAsync({
      classId: cls.$id,
      updates: {
        name: form.name,
        branch: form.branch,
        semester: parseInt(form.semester),
        subjects: validSubjects,
        totalStrength: parseInt(form.totalStrength),
      }
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl
                   w-full max-w-md p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-base font-bold">Edit Class</h2>
        <div className="space-y-3">
          <input
            placeholder="e.g. CSE A · 4th Sem · Morning Batch"
            value={form.name}
            onChange={e => set("name", e.target.value)}
            className={inputCls}
          />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Branch"
              value={form.branch} onChange={e => set("branch", e.target.value)}
              className={inputCls} />
            <input placeholder="Semester" type="number" min="1" max="8"
              value={form.semester} onChange={e => set("semester", e.target.value)}
              className={inputCls} />
          </div>
          <input placeholder="Total strength" type="number" min="1"
            value={form.totalStrength} onChange={e => set("totalStrength", e.target.value)}
            className={inputCls} />
          <SubjectListEditor subjects={subjects} setSubjects={setSubjects} />
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-border/60 text-sm
                       text-muted-foreground hover:bg-muted transition-all">Cancel</button>
          <button onClick={handleSubmit} disabled={updateClass.isPending}
            className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       text-white text-sm font-medium transition-all disabled:opacity-50">
            {updateClass.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Delete class modal ────────────────────────────────────────────────────────
function DeleteClassModal({ cls, onClose }) {
  const [confirmText, setConfirmText] = useState("")
  const deleteClass = useDeleteClass()
  const confirmed = confirmText === "CONFIRM"

  const handleDelete = async () => {
    if (!confirmed) return
    await deleteClass.mutateAsync(cls.$id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-destructive/30 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-destructive">Delete Class</h2>
          <p className="text-xs text-muted-foreground">
            This will permanently delete <span className="text-foreground font-semibold">{cls.name}</span> and
            all associated data — enrolled students, sessions, attendance records, and tokens.
            This action cannot be undone.
          </p>
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-xs text-destructive/80">
            Type <span className="font-mono font-bold text-destructive">CONFIRM</span> to enable deletion
          </p>
        </div>

        <input
          placeholder="Type CONFIRM"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          className={inputCls + (confirmed ? " border-destructive/50 ring-2 ring-destructive/20" : "")}
          autoFocus
        />

        <div className="flex gap-2">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-border/60 text-sm
                       text-muted-foreground hover:bg-muted transition-all">Cancel</button>
          <button
            onClick={handleDelete}
            disabled={!confirmed || deleteClass.isPending}
            className="flex-1 px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/80
                       text-white text-sm font-medium transition-all
                       disabled:opacity-30 disabled:cursor-not-allowed">
            {deleteClass.isPending ? "Deleting…" : "Delete Everything"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── End session modal ─────────────────────────────────────────────────────────
function EndSessionModal({ session, cls, onClose }) {
  const [physicalCount, setPhysicalCount] = useState("")
  const closeSession   = useCloseSession(cls.$id)
  const suspendSession = useSuspendSession(cls.$id)
  const { data: records = [] } = useSessionRecords(session.$id)

  const markedCount = records.length
  const physical    = parseInt(physicalCount)
  const mismatch    = !isNaN(physical) && physical !== markedCount
  const canClose    = !isNaN(physical) && physical > 0

  const handleEnd = async () => {
    if (!canClose) return
    await closeSession.mutateAsync({ sessionId: session.$id, physicalCount: physical })
    onClose()
  }

  const handleSuspend = async () => {
    await suspendSession.mutateAsync(session.$id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-border/60 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-base font-bold">End Session</h2>
        <p className="text-xs text-muted-foreground">
          {markedCount} student{markedCount !== 1 ? "s" : ""} marked digitally.
          Count the room and enter the physical number below.
        </p>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Physical count
          </label>
          <input type="number" min="0" max={cls.totalStrength}
            placeholder="Enter count…" value={physicalCount}
            onChange={e => setPhysicalCount(e.target.value)}
            className={inputCls} autoFocus />
        </div>
        {physicalCount !== "" && !isNaN(physical) && (
          mismatch ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
              <p className="text-xs font-semibold text-amber-400">Count mismatch</p>
              <p className="text-xs text-muted-foreground">
                Digital: <span className="text-foreground font-medium">{markedCount}</span> ·
                Physical: <span className="text-foreground font-medium">{physical}</span>
              </p>
              <p className="text-xs text-amber-400/80 mt-1">
                Verbally confirm who is present, then end. Physical count saves as final.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
              <p className="text-xs text-emerald-400 font-semibold">✓ Counts match</p>
            </div>
          )
        )}
        <div className="flex flex-col gap-2 pt-1">
          <button onClick={handleEnd} disabled={!canClose || closeSession.isPending}
            className="w-full px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500
                       text-white text-sm font-medium transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed">
            {closeSession.isPending ? "Ending…" : "End Session"}
          </button>
          <button onClick={handleSuspend} disabled={suspendSession.isPending}
            className="w-full px-4 py-2 rounded-xl border border-amber-500/30
                       bg-amber-500/5 text-amber-400 text-sm font-medium
                       hover:bg-amber-500/10 transition-all disabled:opacity-50">
            {suspendSession.isPending ? "Suspending…" : "Suspend (no report column)"}
          </button>
          <button onClick={onClose}
            className="w-full px-4 py-2 rounded-xl border border-border/60 text-sm
                       text-muted-foreground hover:bg-muted transition-all">Cancel</button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Session panel ─────────────────────────────────────────────────────────────
function SessionPanel({ cls }) {
  const [mode, setMode]         = useState("token")
  const [subject, setSubject]   = useState(cls.subjects?.[0] ?? "")
  const [showEndModal, setShowEndModal] = useState(false)

  const { data: session, isLoading: sessionLoading } = useActiveSession(cls.$id)
  const startSession  = useStartSession(cls.$id)
  const { data: records = [] }       = useSessionRecords(session?.$id)
  const { data: roster = [] }        = useClassRoster(cls.$id)
  const { data: sessionTokens = [] } = useSessionTokens(session?.$id)
  const manualMark = useManualMark(session, cls.$id)

  const tokenMap   = Object.fromEntries(sessionTokens.map(t => [t.studentId, t]))
  const presentIds = new Set(records.map(r => r.studentId))
  const absentRoster = roster.filter(e => !presentIds.has(e.studentId))

  if (sessionLoading) return <div className="h-20 animate-pulse rounded-xl bg-muted/30" />

  return (
    <div className="space-y-4">
      {!session ? (
        <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-muted/20">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Start Attendance Session
          </p>
          <SubjectDropdown
            subjects={cls.subjects ?? []}
            value={subject}
            onChange={setSubject}
          />
          <div className="flex gap-2">
            {["token", "manual"].map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${mode === m ? "bg-indigo-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}>
                {m === "token" ? "Unique Token" : "Manual"}
              </button>
            ))}
          </div>
          <button onClick={() => startSession.mutate({ subjectName: subject, mode })}
            disabled={startSession.isPending}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500
                       text-white text-sm font-medium transition-all disabled:opacity-50">
            {startSession.isPending ? "Starting…" : "Start Session"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 rounded-xl
                          border border-emerald-500/30 bg-emerald-500/5">
            <div>
              <p className="text-xs text-muted-foreground">
                Active · {session.subjectName} · {session.mode === "token" ? "Unique Token" : "Manual"}
              </p>
              <p className="text-sm font-semibold text-emerald-400 mt-0.5">
                {records.length} / {cls.totalStrength} present
              </p>
            </div>
            <button onClick={() => setShowEndModal(true)}
              className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive
                         border border-destructive/20 text-xs font-medium
                         hover:bg-destructive/20 transition-all">
              End / Suspend
            </button>
          </div>

          {/* Present list */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Present ({records.length})
            </p>
            {records.length === 0 ? (
              <p className="text-xs text-muted-foreground/50 py-2 text-center">No one marked yet</p>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {records.map(r => {
                  const student = roster.find(e => e.studentId === r.studentId)
                  return (
                    <div key={r.$id}
                      className="flex items-center justify-between px-3 py-2
                                 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="flex items-center gap-2">
                        <span
                          title={student?.studentName}
                          className="text-xs font-mono text-muted-foreground cursor-default
                                     hover:text-foreground transition-colors"
                        >
                          {r.rollNumber}
                        </span>
                        {student?.isLeet && <LeetBadge />}
                      </div>
                      <span className="text-[10px] text-emerald-400">✓</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Pending list */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {session.mode === "manual" ? "Not Yet Marked" : "Pending"} ({absentRoster.length})
            </p>
            {absentRoster.length === 0 ? (
              <p className="text-xs text-emerald-400/70 py-2 text-center">All students marked!</p>
            ) : (
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {absentRoster.map(e => {
                  const tokenDoc = tokenMap[e.studentId]
                  return (
                    <div key={e.$id}
                      className="flex items-center justify-between px-3 py-2
                                 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          title={e.studentName}
                          className="text-xs font-mono text-muted-foreground shrink-0
                                     cursor-default hover:text-foreground transition-colors"
                        >
                          {e.rollNumber}
                        </span>
                        {e.isLeet && <LeetBadge />}
                        {tokenDoc && (
                          <span className="text-xs font-mono text-indigo-400
                                           bg-indigo-500/10 px-1.5 py-0.5 rounded shrink-0">
                            {tokenDoc.token}
                          </span>
                        )}
                      </div>
                      {session.mode === "manual" && (
                        <button
                          onClick={() => manualMark.mutate({ studentId: e.studentId, rollNumber: e.rollNumber })}
                          disabled={manualMark.isPending}
                          className="text-xs px-2 py-1 rounded-lg bg-emerald-600/10
                                     text-emerald-400 border border-emerald-500/20
                                     hover:bg-emerald-600/20 transition-all shrink-0 ml-2">
                          Mark
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {showEndModal && session && (
          <EndSessionModal session={session} cls={cls} onClose={() => setShowEndModal(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Class card ────────────────────────────────────────────────────────────────
function ClassCard({ cls }) {
  const [expanded, setExpanded]       = useState(false)
  const [showEdit, setShowEdit]       = useState(false)
  const [showDelete, setShowDelete]   = useState(false)
  const qc = useQueryClient()
  const { data: roster = [] } = useClassRoster(cls.$id)
  const removeStudent = useRemoveStudent()

  return (
    <>
      <motion.div layout
        className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center px-4 py-4 hover:bg-muted/10 transition-colors">
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-3 min-w-0 flex-1 text-left"
          >
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
              <BookOpen size={14} className="text-indigo-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{cls.name}</p>
              <p className="text-xs text-muted-foreground">
                {cls.branch} · Sem {cls.semester} · {roster.length}/{cls.totalStrength} enrolled
              </p>
            </div>
          </button>

          {/* Right side controls */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            <InviteCodeBadge code={cls.inviteCode} />
            <button
              onClick={e => { e.stopPropagation(); setShowEdit(true) }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                         hover:bg-muted transition-colors"
              title="Edit class">
              <Pencil size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setShowDelete(true) }}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive
                         hover:bg-destructive/10 transition-colors"
              title="Delete class">
              <Trash2 size={13} />
            </button>
            <button onClick={() => setExpanded(e => !e)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                         hover:bg-muted transition-colors">
              <ChevronRight size={14}
                className={`transition-transform duration-200 ${expanded ? "rotate-90" : ""}`} />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="border-t border-border/40 px-4 py-4 space-y-5">
              <SessionPanel cls={cls} />

              {/* Roster */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground
                                 uppercase tracking-wide flex items-center gap-1.5">
                    <Users size={11} /> Enrolled ({roster.length})
                  </p>
                  <div className="flex items-center gap-3">
                    <Link to={`/dashboard/attendance/class/${cls.$id}`}
                      className="flex items-center gap-1 text-xs text-indigo-400
                                 hover:text-indigo-300 transition-colors"
                      onClick={e => e.stopPropagation()}>
                      <BarChart2 size={11} /> Report
                    </Link>
                    <button
                      onClick={() => qc.invalidateQueries({ queryKey: ["enrollments", "class", cls.$id] })}
                      className="flex items-center gap-1 text-xs text-muted-foreground
                                 hover:text-foreground transition-colors">
                      <RefreshCw size={11} /> Refresh
                    </button>
                  </div>
                </div>

                {roster.length === 0 ? (
                  <p className="text-xs text-muted-foreground/50 py-3 text-center">
                    No students yet. Share the invite code.
                  </p>
                ) : (
                  <div className="space-y-1 max-h-52 overflow-y-auto">
                    {roster.map(e => (
                      <div key={e.$id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg
                                   border border-border/40 hover:bg-muted/20 transition-colors group">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            title={e.studentName}
                            className="text-xs font-mono text-muted-foreground shrink-0
                                       cursor-default hover:text-foreground transition-colors"
                          >
                            {e.rollNumber}
                          </span>
                          {e.isLeet && <LeetBadge />}
                        </div>
                        <button
                          onClick={() => removeStudent.mutate({ enrollmentId: e.$id, classId: cls.$id })}
                          disabled={removeStudent.isPending}
                          className="opacity-0 group-hover:opacity-100 transition-opacity
                                     text-xs px-2 py-1 rounded-lg text-destructive/70
                                     hover:text-destructive hover:bg-destructive/10
                                     border border-transparent hover:border-destructive/20
                                     disabled:opacity-30 shrink-0 ml-2 flex items-center gap-1">
                          <UserMinus size={11} /> Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {showEdit && <EditClassModal cls={cls} onClose={() => setShowEdit(false)} />}
        {showDelete && <DeleteClassModal cls={cls} onClose={() => setShowDelete(false)} />}
      </AnimatePresence>
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TeacherAttendance() {
  const { classes, isLoading } = useClasses()
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">Attendance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Manage your classes and sessions</p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl
                     bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium
                     transition-all active:scale-[0.97]">
          <Plus size={13} /> New Class
        </button>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted/30" />)}
        </div>
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl
                        border border-dashed border-border/50">
          <BookOpen size={24} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No classes yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Create your first class to get started</p>
        </div>
      ) : (
        <motion.div layout className="space-y-3">
          {classes.map(cls => <ClassCard key={cls.$id} cls={cls} />)}
        </motion.div>
      )}

      <AnimatePresence>
        {showCreate && <CreateClassModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </div>
  )
}
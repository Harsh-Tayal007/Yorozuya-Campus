import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Link } from "react-router-dom"
import {
    ClipboardCheck, Users, BookOpen,
    ChevronDown, ArrowUpRight, Search, UserPlus, UserMinus,
    Power, GraduationCap,
    Zap, Trash2
} from "lucide-react"
import { getAllClasses } from "@/services/attendance/classService"
import { getSessionsByClass } from "@/services/attendance/sessionService"
import { getEnrollmentsByClass } from "@/services/attendance/classService"
import { Query } from "appwrite"
import { databases } from "@/lib/appwrite"
import { DATABASE_ID } from "@/config/appwrite"
import { useUpdateClassTeachers, useToggleClassActive, useHardDeleteStudent } from "@/hooks/attendance/useClasses"
import { toast } from "sonner"
import client from "@/lib/appwrite"
import { SESSIONS_COLLECTION_ID } from "@/config/appwrite"
import { useQueryClient } from "@tanstack/react-query"

const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

function useAllTeachers() {
    return useQuery({
        queryKey: ["all-teachers"],
        queryFn: async () => {
            const res = await databases.listDocuments(
                DATABASE_ID, USERS_COLLECTION_ID,
                [Query.equal("role", "teacher"), Query.limit(200),
                Query.select(["userId", "name", "username"])]
            )
            const map = {}
            for (const doc of res.documents) {
                map[doc.userId] = doc.name || doc.username || doc.userId.slice(0, 10)
            }
            return map
        },
        staleTime: 1000 * 60 * 5,
    })
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pctColor(pct) {
    if (pct >= 75) return "text-emerald-400"
    if (pct >= 50) return "text-amber-400"
    return "text-destructive"
}

function pctBg(pct) {
    if (pct >= 75) return "bg-emerald-500"
    if (pct >= 50) return "bg-amber-500"
    return "bg-destructive"
}

// ── Stat card (matches AdminDashboard StatCard style) ─────────────────────────
function StatCard({ icon: Icon, label, value, accent, loading }) {
    return (
        <div className="rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm
                    px-4 py-4 flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${accent}18`, color: accent }}>
                <Icon size={17} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest
                      text-muted-foreground truncate mb-0.5">{label}</p>
                {loading ? (
                    <div className="h-7 w-16 rounded-md bg-muted animate-pulse" />
                ) : (
                    <p className="text-2xl font-bold text-foreground tabular-nums leading-none">
                        {value ?? "-"}
                    </p>
                )}
            </div>
        </div>
    )
}

function AssignTeachersModal({ cls, teacherMap, allTeacherIds, onClose }) {
    const [assigned, setAssigned] = useState([...(cls.teacherIds ?? [])])
    const updateTeachers = useUpdateClassTeachers()

    // All known teachers not yet assigned
    const available = allTeacherIds.filter(id => !assigned.includes(id))

    const handleAdd = (id) => setAssigned(a => [...a, id])
    const handleRemove = (id) => {
        if (assigned.length === 1) {
            toast.error("A class must have at least one teacher")
            return
        }
        setAssigned(a => a.filter(t => t !== id))
    }

    const handleSave = async () => {
        await updateTeachers.mutateAsync({ classId: cls.$id, teacherIds: assigned })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4
                    bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border/60 rounded-2xl shadow-2xl
                   w-full max-w-sm p-6 space-y-4"
            >
                <div>
                    <h2 className="text-base font-bold">Assign Teachers</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{cls.name}</p>
                </div>

                {/* Currently assigned */}
                <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        Assigned ({assigned.length})
                    </p>
                    {assigned.length === 0 ? (
                        <p className="text-xs text-muted-foreground/50">No teachers assigned</p>
                    ) : (
                        <div className="space-y-1">
                            {assigned.map(id => (
                                <div key={id}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl
                             border border-border/40 bg-muted/10">
                                    <span className="text-sm font-medium text-foreground">
                                        {teacherMap?.[id] ?? id.slice(0, 12) + "…"}
                                    </span>
                                    <button
                                        onClick={() => handleRemove(id)}
                                        className="text-muted-foreground hover:text-destructive
                               transition-colors p-1 rounded-lg hover:bg-destructive/10">
                                        <UserMinus size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Available to add */}
                {available.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                            Add Teacher
                        </p>
                        <div className="space-y-1 max-h-36 overflow-y-auto">
                            {available.map(id => (
                                <div key={id}
                                    className="flex items-center justify-between px-3 py-2 rounded-xl
                             border border-border/40 hover:bg-muted/20 transition-colors">
                                    <span className="text-sm text-muted-foreground">
                                        {teacherMap?.[id] ?? id.slice(0, 12) + "…"}
                                    </span>
                                    <button
                                        onClick={() => handleAdd(id)}
                                        className="text-muted-foreground hover:text-emerald-400
                               transition-colors p-1 rounded-lg hover:bg-emerald-500/10">
                                        <UserPlus size={13} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {available.length === 0 && assigned.length === allTeacherIds.length && (
                    <p className="text-xs text-muted-foreground/50 text-center py-1">
                        All teachers are assigned to this class
                    </p>
                )}

                <div className="flex gap-2 pt-1">
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-xl border border-border/60 text-sm
                       text-muted-foreground hover:bg-muted transition-all">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={updateTeachers.isPending}
                        className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       text-white text-sm font-medium transition-all disabled:opacity-50">
                        {updateTeachers.isPending ? "Saving…" : "Save"}
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

function HardDeleteStudentModal({ enrollment, classId, onClose }) {
  const [confirmText, setConfirmText] = useState("")
  const hardDelete = useHardDeleteStudent()
  const confirmed = confirmText === "CONFIRM"

  const handleDelete = async () => {
    if (!confirmed) return
    await hardDelete.mutateAsync({
      enrollmentId: enrollment.$id,
      classId,
      studentId: enrollment.studentId
    })
    onClose()
  }

  const inputCls = `w-full h-9 px-3 rounded-xl border border-border/60 bg-card/60
    text-sm text-foreground placeholder:text-muted-foreground/50
    focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500
    hover:border-border transition-all duration-150`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-card border border-destructive/30 rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-destructive">Permanently Delete Student</h2>
          <p className="text-xs text-muted-foreground">
            This will fully remove the student (<span className="text-foreground font-semibold">{enrollment.rollNumber}</span>) from this class, including <strong>all attendance records and tokens</strong>. The roll number will become available again. 
          </p>
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
          <p className="text-xs text-destructive/80">
            Type <span className="font-mono font-bold text-destructive">CONFIRM</span> to delete
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
            disabled={!confirmed || hardDelete.isPending}
            className="flex-1 px-4 py-2 rounded-xl bg-destructive hover:bg-destructive/80
                       text-white text-sm font-medium transition-all
                       disabled:opacity-30 disabled:cursor-not-allowed">
            {hardDelete.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Per-class row ─────────────────────────────────────────────────────────────
function ClassRow({ cls, index, teacherMap, allTeacherIds }) {
    const [expanded, setExpanded] = useState(false)
    const [showAssign, setShowAssign] = useState(false)
    const [showStudents, setShowStudents] = useState(false)
    const [deletingEnrollment, setDeletingEnrollment] = useState(null)

    const toggleActive = useToggleClassActive()

    const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
        queryKey: ["sessions", cls.$id],
        queryFn: () => getSessionsByClass(cls.$id),
        staleTime: 1000 * 60 * 2,
    })

    const { data: enrollments = [], isLoading: enrollLoading } = useQuery({
        queryKey: ["enrollments", "class", cls.$id],
        queryFn: () => getEnrollmentsByClass(cls.$id),
        staleTime: 1000 * 60 * 2,
    })

    const closedSessions = sessions.filter(s => !s.isActive && !s.suspended)
    const activeSessions = sessions.filter(s => s.isActive)

    // Class avg attendance across all closed sessions
    const avgPct = closedSessions.length > 0 && enrollments.length > 0
        ? Math.round(
            closedSessions.reduce((sum, s) => sum + (s.presentCount ?? 0), 0) /
            (closedSessions.length * cls.totalStrength) * 100
        )
        : null

    const isLoading = sessionsLoading || enrollLoading

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.3 }}
            className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm overflow-hidden"
        >
            {/* Row header */}
            <button
                onClick={() => setExpanded(e => !e)}
                className="w-full flex items-center gap-3 px-4 py-3.5
                   hover:bg-muted/20 transition-colors text-left"
            >
                <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 shrink-0">
                    <BookOpen size={13} className="text-indigo-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{cls.name}</p>
                            {!cls.isActive && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded
                     bg-destructive/10 text-destructive border border-destructive/20
                     uppercase tracking-wide shrink-0">
                                    Inactive
                                </span>
                            )}
                        </div>
                        {activeSessions.length > 0 && (
                            <span className="flex items-center gap-1 text-[9px] font-bold uppercase
                               tracking-wide px-1.5 py-0.5 rounded-lg
                               bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Live
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {cls.branch} · Sem {cls.semester}
                    </p>
                </div>

                {/* Stats summary */}
                <div className="hidden sm:flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Users size={11} />
                        {isLoading ? "…" : `${enrollments.length}/${cls.totalStrength}`}
                    </span>
                    <span>
                        {isLoading ? "…" : `${closedSessions.length} sessions`}
                    </span>
                    {avgPct !== null && (
                        <span className={`font-bold ${pctColor(avgPct)}`}>
                            {avgPct}% avg
                        </span>
                    )}
                </div>

                {/* Report link */}
                <Link
                    to={`/dashboard/attendance/class/${cls.$id}`}
                    onClick={e => e.stopPropagation()}
                    className="hidden sm:flex items-center gap-1 text-xs text-indigo-400
                     hover:text-indigo-300 transition-colors shrink-0 px-2 py-1
                     rounded-lg hover:bg-indigo-500/10"
                >
                    Report <ArrowUpRight size={11} />
                </Link>

                <button
                    onClick={e => {
                        e.stopPropagation()
                        toggleActive.mutate({ classId: cls.$id, isActive: !cls.isActive })
                    }}
                    disabled={toggleActive.isPending}
                    title={cls.isActive ? "Deactivate class" : "Activate class"}
                    className={`hidden sm:flex items-center gap-1 text-xs px-2 py-1 rounded-lg
              border transition-all shrink-0 disabled:opacity-40
              ${cls.isActive
                            ? "text-muted-foreground border-border/40 hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5"
                            : "text-emerald-400 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                        }`}
                >
                    <Power size={11} />
                    {cls.isActive ? "Deactivate" : "Activate"}
                </button>

                <ChevronDown size={14}
                    className={`text-muted-foreground transition-transform duration-200 shrink-0
                      ${expanded ? "rotate-180" : ""}`} />
            </button>

            {/* Expanded detail */}
            {expanded && (
                <div className="border-t border-border/40 px-4 py-4 space-y-4">

                    {/* Mobile stats */}
                    <div className="flex sm:hidden items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                            <Users size={11} />
                            {enrollments.length}/{cls.totalStrength} enrolled
                        </span>
                        <span>{closedSessions.length} sessions</span>
                        {avgPct !== null && (
                            <span className={`font-bold ${pctColor(avgPct)}`}>{avgPct}% avg</span>
                        )}
                        <Link to={`/dashboard/attendance/class/${cls.$id}`}
                            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                            Full Report <ArrowUpRight size={11} />
                        </Link>
                    </div>

                    {/* Per-subject summary */}
                    {cls.subjects?.length > 0 && closedSessions.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-semibold text-muted-foreground
                             uppercase tracking-wide">Subject breakdown</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {cls.subjects.map(subject => {
                                    const subSessions = closedSessions.filter(s =>
                                        s.subjectName === subject
                                    )
                                    const total = subSessions.length
                                    if (total === 0) return null
                                    const avgPresent = total > 0
                                        ? Math.round(
                                            subSessions.reduce((s, sess) => s + (sess.presentCount ?? 0), 0) /
                                            (total * cls.totalStrength) * 100
                                        )
                                        : 0
                                    return (
                                        <div key={subject}
                                            className="rounded-xl border border-border/40 bg-muted/10 px-3 py-2 space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-foreground truncate">
                                                    {subject}
                                                </span>
                                                <span className={`text-xs font-bold shrink-0 ml-2 ${pctColor(avgPresent)}`}>
                                                    {avgPresent}%
                                                </span>
                                            </div>
                                            <div className="h-1 rounded-full bg-muted/40 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${pctBg(avgPresent)}`}
                                                    style={{ width: `${avgPresent}%` }}
                                                />
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">
                                                {total} session{total !== 1 ? "s" : ""} · class avg
                                            </p>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Recent sessions */}
                    {closedSessions.length > 0 && (
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                Recent sessions
                            </p>
                            <div className="space-y-1 max-h-40 overflow-y-auto">
                                {closedSessions.slice(-5).reverse().map(s => (
                                    <div key={s.$id}
                                        className="flex items-center justify-between px-3 py-2
                               rounded-lg border border-border/30 text-xs">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-foreground font-medium truncate">
                                                {s.subjectName}
                                            </span>
                                            <span className="text-muted-foreground shrink-0">
                                                {new Date(s.startTime).toLocaleDateString("en-IN", {
                                                    day: "2-digit", month: "short", year: "numeric"
                                                })}
                                            </span>
                                        </div>
                                        <span className={`font-bold shrink-0 ml-3 ${pctColor(cls.totalStrength > 0
                                            ? Math.round((s.presentCount / cls.totalStrength) * 100)
                                            : 0)
                                            }`}>
                                            {s.presentCount}/{cls.totalStrength}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {closedSessions.length === 0 && !isLoading && (
                        <p className="text-xs text-muted-foreground/50 text-center py-2">
                            No completed sessions yet
                        </p>
                    )}

                    {/* Teachers assigned */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                                Assigned Teachers ({cls.teacherIds?.length ?? 0})
                            </p>
                            <button
                                onClick={() => setShowAssign(true)}
                                className="flex items-center gap-1 text-xs text-indigo-400
                 hover:text-indigo-300 transition-colors"
                            >
                                <UserPlus size={11} /> Manage
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {(cls.teacherIds ?? []).map(id => (
                                <span key={id}
                                    className="text-xs px-2 py-1 rounded-lg border border-border/40
                   bg-muted/20 text-foreground">
                                    {teacherMap?.[id] ?? id.slice(0, 10) + "…"}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Enrolled students */}
                    <div className="space-y-1.5">
                        <button
                            onClick={() => setShowStudents(v => !v)}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground
               hover:text-foreground transition-colors w-full text-left"
                        >
                            <GraduationCap size={11} className="shrink-0" />
                            <span className="font-semibold uppercase tracking-wide text-[10px]">
                                Enrolled Students ({enrollments.length})
                            </span>
                            <ChevronDown size={11}
                                className={`ml-auto transition-transform duration-200
                  ${showStudents ? "rotate-180" : ""}`} />
                        </button>

                        <AnimatePresence>
                            {showStudents && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className="overflow-hidden"
                                >
                                    {enrollments.length === 0 ? (
                                        <p className="text-xs text-muted-foreground/50 text-center py-3">
                                            No students enrolled
                                        </p>
                                    ) : (
                                        <div className="space-y-1 max-h-56 overflow-y-auto">
                                            {enrollments
                                                .slice()
                                                .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
                                                .map(e => (
                                                    <div key={e.$id}
                                                        className="flex items-center justify-between px-3 py-2
                             rounded-lg border border-border/30 bg-muted/10 text-xs">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="font-mono text-muted-foreground shrink-0">
                                                                {e.rollNumber}
                                                            </span>
                                                            <span
                                                                className="text-foreground truncate"
                                                                title={e.studentName}
                                                            >
                                                                {e.studentName}
                                                            </span>
                                                            {e.isLeet && (
                                                                <span className="text-[8px] font-bold px-1 py-0.5 rounded
                                       bg-amber-500/15 text-amber-400
                                       border border-amber-500/20 uppercase shrink-0">
                                                                    LEET
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0 ml-2">
                                                            <span className="text-muted-foreground/50 text-[10px]">
                                                                {new Date(e.joinedAt).toLocaleDateString("en-IN", {
                                                                    day: "2-digit", month: "short", year: "numeric"
                                                                })}
                                                            </span>
                                                            <button
                                                                onClick={() => setDeletingEnrollment(e)}
                                                                className="p-1 rounded-lg text-destructive/70 hover:text-destructive
                                                                           hover:bg-destructive/10 border border-transparent 
                                                                           hover:border-destructive/20 transition-all">
                                                                <Trash2 size={13} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <AnimatePresence>
                        {showAssign && (
                            <AssignTeachersModal
                                cls={cls}
                                teacherMap={teacherMap}
                                allTeacherIds={allTeacherIds}
                                onClose={() => setShowAssign(false)}
                            />
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {deletingEnrollment && (
                            <HardDeleteStudentModal
                                enrollment={deletingEnrollment}
                                classId={cls.$id}
                                onClose={() => setDeletingEnrollment(null)}
                            />
                        )}
                    </AnimatePresence>
                </div>
            )}
        </motion.div>
    )
}

function TeacherDropdown({ teacherIds, teacherMap, value, onChange }) {
    const [open, setOpen] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const selected = value === "all"
        ? "All teachers"
        : teacherMap?.[value] ?? value.slice(0, 12) + "…"

    return (
        <div ref={ref} className="relative min-w-[160px]">
            <button
                onClick={() => setOpen(o => !o)}
                className="w-full h-9 px-3 rounded-xl border border-border/60 bg-card/60
                   text-sm text-foreground flex items-center justify-between gap-2
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/25
                   focus:border-indigo-500 hover:border-border transition-all"
            >
                <span className="truncate">{selected}</span>
                <ChevronDown size={13}
                    className={`text-muted-foreground shrink-0 transition-transform duration-200
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
                        {[{ id: "all", label: "All teachers" },
                        ...teacherIds.map(id => ({
                            id,
                            label: teacherMap?.[id] ?? id.slice(0, 12) + "…"
                        }))
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => { onChange(item.id); setOpen(false) }}
                                className={`w-full text-left px-3 py-2.5 text-sm transition-colors
                            hover:bg-muted/60
                            ${value === item.id
                                        ? "text-indigo-400 bg-indigo-500/10"
                                        : "text-foreground"}`}
                            >
                                {item.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

function useActiveSessions(classIds) {
    const qc = useQueryClient()

    useEffect(() => {
        if (!classIds.length) return
        const unsub = client.subscribe(
            `databases.${import.meta.env.VITE_APPWRITE_DATABASE_ID}.collections.${SESSIONS_COLLECTION_ID}.documents`,
            (response) => {
                if (classIds.includes(response.payload.classId)) {
                    qc.invalidateQueries({ queryKey: ["active-sessions-count"] })
                }
            }
        )
        return unsub
    }, [JSON.stringify(classIds)])

    return useQuery({
        queryKey: ["active-sessions-count", classIds],
        queryFn: async () => {
            if (!classIds.length) return 0
            const results = await Promise.all(
                classIds.map(id => getSessionsByClass(id))
            )
            return results.flat().filter(s => s.isActive).length
        },
        enabled: classIds.length > 0,
        staleTime: 0,
    })
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminAttendance() {
    const [search, setSearch] = useState("")
    const [filterTeacher, setFilterTeacher] = useState("all")

    const { data: allClasses = [], isLoading } = useQuery({
        queryKey: ["classes-all"],
        queryFn: getAllClasses,
        staleTime: 1000 * 60 * 2,
    })


    // Unique teacher IDs for filter
    const { data: allTeachersMap = {} } = useAllTeachers()
    const allTeacherIds = Object.keys(allTeachersMap)
    // still need teacherIds for the filter dropdown (only assigned teachers)
    const teacherIds = [...new Set(allClasses.flatMap(c => c.teacherIds ?? []))]
    // merge both maps so names resolve everywhere
    const teacherMap = { ...allTeachersMap }

    const filtered = allClasses.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.branch.toLowerCase().includes(search.toLowerCase())
        const matchTeacher = filterTeacher === "all" ||
            c.teacherIds?.includes(filterTeacher)
        return matchSearch && matchTeacher
    })

    const totalClasses = allClasses.length
    const totalStrength = allClasses.reduce((s, c) => s + (c.totalStrength ?? 0), 0)
    const allClassIds = allClasses.map(c => c.$id)
    const { data: activeCount = 0 } = useActiveSessions(allClassIds)

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <ClipboardCheck size={16} className="text-emerald-500" />
                </div>
                <div>
                    <h1 className="text-xl font-bold tracking-tight">Attendance Overview</h1>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Read-only view of all classes across the platform
                    </p>
                </div>
            </motion.div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard icon={BookOpen} label="Total Classes" value={totalClasses} accent="#6366f1" loading={isLoading} />
                <StatCard icon={Users} label="Total Strength" value={totalStrength} accent="#10b981" loading={isLoading} />
                <StatCard icon={ClipboardCheck} label="Teachers" value={teacherIds.length} accent="#f59e0b" loading={isLoading} />
                <StatCard icon={Zap} label="Live Sessions" value={activeCount} accent="#10b981" loading={isLoading} />
            </div>
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={13}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by class name or branch…"
                        className="w-full h-9 pl-8 pr-3 rounded-xl border border-border/60 bg-card/60
                       text-sm text-foreground placeholder:text-muted-foreground/50
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/25
                       focus:border-indigo-500 hover:border-border transition-all"
                    />
                </div>
                <TeacherDropdown
                    teacherIds={teacherIds}
                    teacherMap={teacherMap}
                    value={filterTeacher}
                    onChange={setFilterTeacher}
                />
            </div>

            {/* Class list */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i =>
                        <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/30" />
                    )}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 rounded-2xl
                        border border-dashed border-border/50">
                    <ClipboardCheck size={22} className="text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">No classes found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {filtered.length} class{filtered.length !== 1 ? "es" : ""}
                    </p>
                    {filtered.map((cls, i) => (
                        <ClassRow
                            key={cls.$id}
                            cls={cls}
                            index={i}
                            teacherMap={teacherMap}
                            allTeacherIds={allTeacherIds}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
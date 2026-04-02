import { useState } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowLeft, Trash2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getEnrollmentsByClass, getAllClasses } from "@/services/attendance/classService"
import { getSessionsByClass, deleteSession } from "@/services/attendance/sessionService"
import { getRecordsBySession, addRecordManually, removeRecord } from "@/services/attendance/recordService"
import { toast } from "sonner"

// ── Format date with year ─────────────────────────────────────────────────────
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  })
}

// ── Subject name: split on space, second word on new line ─────────────────────
function SubjectLabel({ name }) {
  const parts = name.trim().split(" ")
  if (parts.length === 1) return <span>{name}</span>
  return (
    <span className="leading-tight">
      {parts[0]}
      <br />
      <span className="text-muted-foreground/50">{parts.slice(1).join(" ")}</span>
    </span>
  )
}

// ── Data hook ─────────────────────────────────────────────────────────────────
function useClassReport(classId) {
  const { data: allClasses = [] } = useQuery({
    queryKey: ["classes-all"],
    queryFn: getAllClasses,
    staleTime: 1000 * 60 * 5,
  })
  const cls = allClasses.find(c => c.$id === classId)

  const { data: roster = [], isLoading: rosterLoading } = useQuery({
    queryKey: ["enrollments", "class", classId],
    queryFn: () => getEnrollmentsByClass(classId),
    enabled: !!classId,
  })

  const { data: allSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["sessions", classId],
    queryFn: () => getSessionsByClass(classId),
    enabled: !!classId,
  })

  const sessions = allSessions
    .filter(s => !s.isActive && !s.suspended)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

  const { data: allRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["all-records", classId],
    queryFn: async () => {
      const results = await Promise.all(sessions.map(s => getRecordsBySession(s.$id)))
      return results.flat()
    },
    enabled: sessions.length > 0,
    staleTime: 0,
  })

  return {
    cls, roster, sessions, allRecords,
    isLoading: rosterLoading || sessionsLoading || recordsLoading,
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ClassAttendanceReport() {
  const { classId } = useParams()
  const { user } = useAuth()
  const qc = useQueryClient()
  const { cls, roster, sessions, allRecords, isLoading } = useClassReport(classId)

  const [toggling, setToggling] = useState({})
  const [deleting, setDeleting] = useState({})
  const [confirmDel, setConfirmDel] = useState(null) // sessionId pending confirm

  const [tooltip, setTooltip] = useState(null) // { x, y, student }

  // "studentId_sessionId" → record doc
  const recordMap = Object.fromEntries(
    allRecords.map(r => [`${r.studentId}_${r.sessionId}`, r])
  )

  // ── Toggle P/A ──────────────────────────────────────────────────────────────
  const handleToggle = async (student, session) => {
    const key = `${student.studentId}_${session.$id}`
    if (toggling[key]) return
    setToggling(t => ({ ...t, [key]: true }))
    try {
      const existing = recordMap[key]
      if (existing) {
        await removeRecord(existing.$id)
      } else {
        await addRecordManually({
          sessionId: session.$id,
          classId,
          subjectName: session.subjectName,
          studentId: student.studentId,
          rollNumber: student.rollNumber,
          teacherId: user.$id,
        })
      }
      qc.invalidateQueries({ queryKey: ["all-records", classId] })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setToggling(t => ({ ...t, [key]: false }))
    }
  }

  // ── Delete session column ───────────────────────────────────────────────────
  const handleDeleteSession = async (sessionId) => {
    setDeleting(d => ({ ...d, [sessionId]: true }))
    try {
      await deleteSession(sessionId)
      qc.invalidateQueries({ queryKey: ["sessions", classId] })
      qc.invalidateQueries({ queryKey: ["all-records", classId] })
      toast.success("Session deleted")
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(d => ({ ...d, [sessionId]: false }))
      setConfirmDel(null)
    }
  }

  // Group sessions by date, preserving sort order
  const sessionsByDate = sessions.reduce((acc, s) => {
    const date = formatDate(s.startTime)
    if (!acc[date]) acc[date] = []
    acc[date].push(s)
    return acc
  }, {})
  const dates = Object.keys(sessionsByDate)

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-muted/40 rounded-xl" />
        <div className="h-64 bg-muted/30 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3">
        <Link to="/dashboard/attendance"
          className="p-2 rounded-xl border border-border/60 hover:bg-muted
                     text-muted-foreground hover:text-foreground transition-all">
          <ArrowLeft size={14} />
        </Link>
        <div>
          <h2 className="text-base font-bold">
            {cls?.name ?? classId} — Attendance Report
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {roster.length} students · {sessions.length} sessions ·{" "}
            <span className="text-indigo-400">Click P/A to toggle · Click 🗑 to delete column</span>
          </p>
        </div>
      </motion.div>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl
                        border border-dashed border-border/50">
          <p className="text-sm text-muted-foreground">No completed sessions yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            Records appear after you end a session
          </p>
        </div>
      ) : (
        /* Outer container: full width, horizontal scroll */
        <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm
                        overflow-x-auto w-full">
          <table className="text-xs border-collapse"
            style={{ minWidth: `${120 + sessions.length * 56 + 72}px` }}>
            <thead>
              {/* ── Date row ── */}
              <tr className="border-b border-border/40">
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground
                                sticky left-0 bg-card/95 backdrop-blur-sm z-20
                                min-w-[120px] border-r border-border/30">
                  Student
                </th>
                {dates.map(date => (
                  <th key={date}
                    colSpan={sessionsByDate[date].length}
                    className="px-2 py-2.5 text-center font-semibold text-muted-foreground
                               border-l border-border/30 whitespace-nowrap">
                    {date}
                  </th>
                ))}
                <th className="px-4 py-3 font-semibold text-muted-foreground text-center
                                border-l border-border/30 whitespace-nowrap min-w-[64px]">
                  %
                </th>
              </tr>

              {/* ── Subject + delete row ── */}
              <tr className="border-b border-border/40 bg-muted/10">
                <th className="sticky left-0 bg-card/95 backdrop-blur-sm z-20
                                border-r border-border/30" />
                {sessions.map(s => (
                  <th key={s.$id}
                    className="px-1 py-2 text-center border-l border-border/20
                               min-w-[52px] max-w-[64px]">
                    <div className="flex flex-col items-center gap-1">
                      {/* Subject name — wraps on space */}
                      <span className="text-[10px] font-medium text-muted-foreground/80
                                       leading-tight text-center">
                        <SubjectLabel name={s.subjectName} />
                      </span>
                      {/* Delete button */}
                      {confirmDel === s.$id ? (
                        <div className="flex gap-1 mt-0.5">
                          <button
                            onClick={() => handleDeleteSession(s.$id)}
                            disabled={deleting[s.$id]}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-destructive/20
                                       text-destructive border border-destructive/30
                                       hover:bg-destructive/30 transition-all disabled:opacity-40">
                            {deleting[s.$id] ? "…" : "Yes"}
                          </button>
                          <button
                            onClick={() => setConfirmDel(null)}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-muted/60
                                       text-muted-foreground border border-border/40
                                       hover:bg-muted transition-all">
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDel(s.$id)}
                          className="opacity-30 hover:opacity-90 transition-opacity
                                     text-destructive p-0.5 rounded">
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="border-l border-border/30" />
              </tr>
            </thead>

            <tbody>
              {roster.map((e, i) => {
                const presentCount = sessions.filter(s =>
                  recordMap[`${e.studentId}_${s.$id}`]
                ).length
                const pct = sessions.length > 0
                  ? Math.round((presentCount / sessions.length) * 100) : 0

                return (
                  <tr key={e.$id}
                    className={`border-b border-border/30 last:border-0
                      ${i % 2 === 0 ? "bg-transparent" : "bg-muted/10"}`}>

                    {/* Student name — sticky */}
                    <td className="px-4 py-2.5 sticky left-0 bg-card/95 backdrop-blur-sm z-10
               border-r border-border/30">
                      <span
                        className="font-mono text-foreground text-[11px] cursor-default
               underline decoration-dotted decoration-muted-foreground/40"
                        onMouseEnter={(ev) => {
                          const rect = ev.currentTarget.getBoundingClientRect()
                          setTooltip({
                            x: rect.left + rect.width / 2,
                            y: rect.bottom + 10,
                            name: e.studentName,
                            isLeet: e.isLeet,
                          })
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        {e.rollNumber}
                      </span>
                    </td>

                    {/* P/A cells */}
                    {sessions.map(s => {
                      const key = `${e.studentId}_${s.$id}`
                      const present = !!recordMap[key]
                      const busy = toggling[key]
                      return (
                        <td key={s.$id}
                          className="text-center px-1 py-2.5 border-l border-border/20">
                          <button
                            onClick={() => handleToggle(e, s)}
                            disabled={busy}
                            title={present ? "Click to mark Absent" : "Click to mark Present"}
                            className={`w-7 h-7 rounded-lg font-bold transition-all
                                       hover:scale-110 active:scale-95 disabled:opacity-40
                                       ${present
                                ? "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
                                : "bg-muted/40 text-muted-foreground/40 hover:bg-red-500/10 hover:text-red-400"
                              }`}>
                            {busy ? "…" : present ? "P" : "A"}
                          </button>
                        </td>
                      )
                    })}

                    {/* Percentage */}
                    <td className="text-center px-4 py-2.5 border-l border-border/30">
                      <span className={`font-semibold ${pct >= 75 ? "text-emerald-400"
                        : pct >= 50 ? "text-amber-400"
                          : "text-destructive"
                        }`}>
                        {pct}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: tooltip.x, top: tooltip.y, transform: "translateX(-50%)" }}
        >
          {/* Arrow */}
          <div className="flex justify-center mb-0">
            <div className="w-2.5 h-2.5 rotate-45 bg-popover border-l border-t
                      border-border/60 -mb-1.5 z-10 relative" />
          </div>
          {/* Box */}
          <div className="bg-popover border border-border/60 shadow-xl rounded-xl
                    px-3 py-1.5 flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-xs font-medium text-foreground">{tooltip.name}</span>
            {tooltip.isLeet && (
              <span className="text-[8px] font-bold px-1 py-0.5 rounded
                         bg-amber-500/15 text-amber-400
                         border border-amber-500/20 uppercase">
                LEET
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
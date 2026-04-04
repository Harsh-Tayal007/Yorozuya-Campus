import { useState, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ArrowLeft, Download, Trash2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getEnrollmentsByClass, getAllClasses } from "@/services/attendance/classService"
import { getSessionsByClass, deleteSession } from "@/services/attendance/sessionService"
import { getRecordsBySession, addRecordManually, removeRecord } from "@/services/attendance/recordService"
import { toast } from "sonner"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell
} from "recharts"

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

function exportCSV(cls, roster, sessions, recordMap) {
  // Group sessions by date for a date sub-header row
  const dateRow = ["", "", "", ...sessions.map(s =>
    new Date(s.startTime).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    })
  ), "", "", ""]

  const subjectRow = ["Roll No", "Name", "LEET",
    ...sessions.map(s => s.subjectName),
    "Present", "Total", "%"
  ]

  const rows = roster.map(e => {
    const cells = sessions.map(s =>
      recordMap[`${e.studentId}_${s.$id}`] ? "P" : "A"
    )
    const presentCount = cells.filter(c => c === "P").length
    const pct = sessions.length > 0
      ? Math.round((presentCount / sessions.length) * 100) : 0
    return [
      // Prefix roll number with \t so Excel keeps it as text
      "\t" + e.rollNumber,
      e.studentName,
      e.isLeet ? "Yes" : "No",
      ...cells,
      presentCount,
      sessions.length,
      `${pct}%`,
    ]
  })

  // Title + blank + date row + subject row + data rows
  const allRows = [
    [`${cls?.name ?? "Class"} — Attendance Report`],
    [`Exported: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`],
    [],
    dateRow,
    subjectRow,
    ...rows,
  ]

  const csv = allRows
    .map(row => row.map(cell =>
      `"${String(cell ?? "").replace(/"/g, '""')}"`
    ).join(","))
    .join("\n")

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${cls?.name ?? "attendance"}-report-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Scroll chart wrapper (same pattern as AdminStats) ─────────────────────────
function ScrollChart({ data, minWidth = 600, height = 240, children }) {
  const scrollRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  const onMouseDown = (e) => {
    setIsDragging(true)
    setStartX(e.pageX - scrollRef.current.offsetLeft)
    setScrollLeft(scrollRef.current.scrollLeft)
  }
  const onMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX) * 1.2
    scrollRef.current.scrollLeft = scrollLeft - walk
  }
  const onMouseUp = () => setIsDragging(false)

  const actualWidth = Math.max(minWidth, data.length * 52)

  return (
    <div
      ref={scrollRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="overflow-x-auto scrollbar-thin scrollbar-thumb-border
                 scrollbar-track-transparent cursor-grab active:cursor-grabbing
                 -mx-1 px-1"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <div style={{ width: actualWidth, height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
      {data.length > 8 && (
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
          ← drag to scroll →
        </p>
      )}
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-popover border border-border/60 rounded-xl shadow-xl
                    px-3 py-2 text-xs space-y-1 min-w-[140px]">
      <p className="font-mono font-semibold text-foreground mb-1">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: p.fill }} />
            {p.dataKey}
          </span>
          <span className="font-bold text-foreground">{p.value}%</span>
        </div>
      ))}
    </div>
  )
}

// ── Subject analytics ─────────────────────────────────────────────────────────
// ── Date filter presets ───────────────────────────────────────────────────────
const PRESETS = [
  { label: "All time", days: null },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "3mo", days: 90 },
]

function SubjectAnalytics({ sessions, roster, recordMap }) {
  if (sessions.length === 0 || roster.length === 0) return null

  // ── Filter state ────────────────────────────────────────────────────────────
  const [preset, setPreset] = useState("All time")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [showRange, setShowRange] = useState(false)

  // ── Compute filtered sessions ───────────────────────────────────────────────
  const filteredSessions = sessions.filter(s => {
    const d = new Date(s.startTime)

    // Custom range takes priority over preset
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate) : null
      const to = toDate ? new Date(toDate) : null
      if (to) to.setHours(23, 59, 59, 999) // include full end day
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    }

    // Preset
    const p = PRESETS.find(p => p.label === preset)
    if (!p || p.days === null) return true
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - p.days)
    return d >= cutoff
  })

  const handlePreset = (label) => {
    setPreset(label)
    setFromDate("")
    setToDate("")
    setShowRange(false)
  }

  const isCustomActive = !!(fromDate || toDate)

  // ── Chart data ──────────────────────────────────────────────────────────────
  const subjects = [...new Set(filteredSessions.map(s => s.subjectName))]

  const chartData = roster.map(e => {
    const entry = { rollNumber: e.rollNumber, name: e.studentName }
    for (const subject of subjects) {
      const subSessions = filteredSessions.filter(s => s.subjectName === subject)
      const present = subSessions.filter(s =>
        recordMap[`${e.studentId}_${s.$id}`]
      ).length
      entry[subject] = subSessions.length > 0
        ? Math.round((present / subSessions.length) * 100)
        : 0
    }
    return entry
  })

  const subjectStats = subjects.map(subject => {
    const subSessions = filteredSessions.filter(s => s.subjectName === subject)
    const total = subSessions.length
    const avgPct = roster.length > 0 && total > 0
      ? Math.round(
        roster.reduce((sum, e) => {
          const present = subSessions.filter(s =>
            recordMap[`${e.studentId}_${s.$id}`]
          ).length
          return sum + (present / total) * 100
        }, 0) / roster.length
      )
      : 0
    return { subject, total, avgPct }
  })

  const COLORS = [
    "#6366f1", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#06b6d4", "#f97316", "#84cc16",
  ]

  const minWidth = Math.max(500, roster.length * 60)

  const inputCls = `h-8 px-2 rounded-lg border border-border/60 bg-card/60
    text-xs text-foreground placeholder:text-muted-foreground/50
    focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500
    hover:border-border transition-all duration-150`

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-4">

      {/* ── Header row ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Subject Analytics
        </p>

        {/* Filter controls */}
        <div className="flex flex-col gap-2 items-end">
          {/* Preset buttons */}
          <div className="flex items-center gap-1 flex-wrap justify-end">
            {PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => handlePreset(p.label)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium
                  ${preset === p.label && !isCustomActive
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
              >
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setShowRange(v => !v)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all font-medium
                ${isCustomActive
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              Custom
            </button>
          </div>

          {/* Custom range inputs */}
          {showRange && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="flex items-center gap-2 flex-wrap justify-end"
            >
              <input
                type="date"
                value={fromDate}
                onChange={e => { setFromDate(e.target.value); setPreset("") }}
                className={inputCls}
              />
              <span className="text-xs text-muted-foreground">→</span>
              <input
                type="date"
                value={toDate}
                onChange={e => { setToDate(e.target.value); setPreset("") }}
                className={inputCls}
              />
              {isCustomActive && (
                <button
                  onClick={() => { setFromDate(""); setToDate(""); setPreset("All time"); setShowRange(false) }}
                  className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Subject summary stats ── */}
      {subjectStats.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {subjectStats.map(({ subject, total, avgPct }) => (
            <div key={subject}
              className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{subject}</span>
              <span className="text-muted-foreground/60">
                {total} session{total !== 1 ? "s" : ""}
              </span>
              <span className={`font-bold ${avgPct >= 75 ? "text-emerald-400"
                : avgPct >= 50 ? "text-amber-400"
                  : "text-destructive"
                }`}>
                {avgPct}% avg
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Chart or empty state ── */}
      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10
                        rounded-xl border border-dashed border-border/50">
          <p className="text-sm text-muted-foreground">No sessions in this range</p>
          <button
            onClick={() => { setPreset("All time"); setFromDate(""); setToDate(""); setShowRange(false) }}
            className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 transition-colors"
          >
            Reset to all time
          </button>
        </div>
      ) : (
        <>
          <ScrollChart data={chartData} minWidth={minWidth} height={220}>
            <BarChart data={chartData} barGap={2} barCategoryGap="30%">
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(128,128,128,0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="rollNumber"
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                axisLine={false} tickLine={false}
                interval={0} tickMargin={6}
              />
              <YAxis
                domain={[0, 100]}
                tickFormatter={v => `${v}%`}
                tick={{ fontSize: 10, fill: "currentColor", opacity: 0.5 }}
                axisLine={false} tickLine={false} width={36}
              />
              <CartesianGrid
                horizontal vertical={false}
                strokeDasharray="6 3"
                stroke="rgba(239,68,68,0.25)"
                horizontalValues={[75]}
              />
              <Tooltip content={<ChartTooltip />}
                cursor={{ fill: "rgba(128,128,128,0.06)", radius: 4 }} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                iconType="circle" iconSize={8}
              />
              {subjects.map((subject, i) => (
                <Bar key={subject} dataKey={subject}
                  fill={COLORS[i % COLORS.length]}
                  radius={[4, 4, 0, 0]} maxBarSize={14}
                />
              ))}
            </BarChart>
          </ScrollChart>
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Dashed red line = 75% attendance threshold
          </p>
        </>
      )}
    </div>
  )
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
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold">
            {cls?.name ?? classId} — Attendance Report
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {roster.length} students · {sessions.length} sessions ·{" "}
            <span className="text-indigo-400">Click P/A to toggle · Click 🗑 to delete column</span>
          </p>
        </div>
        {sessions.length > 0 && (
          <button
            onClick={() => exportCSV(cls, roster, sessions, recordMap)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl
               border border-border/60 bg-card/60 hover:bg-muted
               text-xs font-medium text-muted-foreground hover:text-foreground
               transition-all active:scale-[0.97] shrink-0"
          >
            <Download size={13} /> Export CSV
          </button>
        )}
      </motion.div>

      <SubjectAnalytics
        sessions={sessions}
        roster={roster}
        recordMap={recordMap}
      />

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
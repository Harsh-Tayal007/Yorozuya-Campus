import { useState, useRef, useEffect } from "react"
import { useParams, Link } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion } from "framer-motion"
import { ArrowLeft, Download, Trash2, Printer, ChevronDown } from "lucide-react"
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

// Returns only sessions that happened after the student joined
function getEligibleSessions(sessions, enrollment) {
  const joinedAt = new Date(enrollment.joinedAt)
  return sessions.filter(s => new Date(s.startTime) >= joinedAt)
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
    const cells = sessions.map(s => {
      const notEnrolledYet = new Date(s.startTime) < new Date(e.joinedAt)
      if (notEnrolledYet) return "-"
      return recordMap[`${e.studentId}_${s.$id}`] ? "P" : "A"
    })
    const eligibleCells = cells.filter(c => c !== "-")
    const presentCount = eligibleCells.filter(c => c === "P").length
    const pct = eligibleCells.length > 0
      ? Math.round((presentCount / eligibleCells.length) * 100) : 0
    return [
      "\t" + e.rollNumber,
      e.studentName,
      e.isLeet ? "Yes" : "No",
      ...cells,
      presentCount,
      eligibleCells.length,
      eligibleCells.length === 0 ? "-" : `${pct}%`,
    ]
  })

  // Title + blank + date row + subject row + data rows
  const allRows = [
    [`${cls?.name ?? "Class"} - Attendance Report`],
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
    const joinedAt = new Date(e.joinedAt)
    const entry = { rollNumber: e.rollNumber, name: e.studentName }
    for (const subject of subjects) {
      const subSessions = filteredSessions.filter(s =>
        s.subjectName === subject &&
        new Date(s.startTime) >= joinedAt   // only sessions after enrollment
      )
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
    // For class avg, only count eligible sessions per student
    const eligibleStudents = roster.filter(e =>
      new Date(e.joinedAt) <= new Date(subSessions[subSessions.length - 1]?.startTime)
    )
    const avgPct = eligibleStudents.length > 0 && total > 0
      ? Math.round(
        eligibleStudents.reduce((sum, e) => {
          const joinedAt = new Date(e.joinedAt)
          const eligible = subSessions.filter(s =>
            new Date(s.startTime) >= joinedAt
          )
          const present = eligible.filter(s =>
            recordMap[`${e.studentId}_${s.$id}`]
          ).length
          return sum + (eligible.length > 0 ? (present / eligible.length) * 100 : 0)
        }, 0) / eligibleStudents.length
      )
      : 0
    return { subject, total, avgPct }
  })

  const COLORS = [
    "#6366f1", // indigo
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
    "#ec4899", // pink
    "#14b8a6", // teal
    "#a855f7", // purple
    "#eab308", // yellow
    "#3b82f6", // blue
    "#f43f5e", // rose
    "#22c55e", // green
    "#64748b", // slate
    "#0ea5e9", // sky
    "#d946ef", // fuchsia
    "#78716c", // stone
    "#fb923c", // light orange
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

function PrintRegisterModal({ cls, sessions, roster, recordMap, onClose }) {
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [perPage, setPerPage] = useState("10")

  const inputCls = `w-full h-9 px-3 rounded-xl border border-border/60 bg-card/60
    text-sm text-foreground placeholder:text-muted-foreground/50
    focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500
    hover:border-border transition-all duration-150`

  const handleGenerate = () => {
    const from = fromDate ? new Date(fromDate) : null
    const to = toDate ? new Date(toDate) : null
    if (to) to.setHours(23, 59, 59, 999)

    const filtered = sessions.filter(s => {
      const d = new Date(s.startTime)
      if (from && d < from) return false
      if (to && d > to) return false
      return true
    })

    if (filtered.length === 0) {
      toast.error("No sessions in this date range")
      return
    }

    const maxPerPage = Math.max(1, parseInt(perPage) || 10)
    const chunks = []
    for (let i = 0; i < filtered.length; i += maxPerPage) {
      chunks.push(filtered.slice(i, i + maxPerPage))
    }

    const formatDate = (iso) => new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    })

    const pagesHtml = chunks.map((chunk, pageIdx) => {
      const pageFrom = formatDate(chunk[0].startTime)
      const pageTo = formatDate(chunk[chunk.length - 1].startTime)

      // Group sessions by date - preserving order
      const dateGroups = {}
      const dateOrder = []
      chunk.forEach(s => {
        const date = formatDate(s.startTime)
        if (!dateGroups[date]) { dateGroups[date] = []; dateOrder.push(date) }
        dateGroups[date].push(s)
      })

      // Top date row - one th per date spanning its sessions
      const dateHeaderRow = dateOrder.map(date => `
    <th colspan="${dateGroups[date].length}"
        style="border:1px solid #ccc;padding:5px 8px;font-size:11px;
               font-weight:700;text-align:center;background:#efefef">
      ${date}
    </th>
  `).join("")

      // Sub-header row - subject name per session
      const subjectHeaderRow = chunk.map(s => `
    <th style="border:1px solid #ccc;padding:5px 8px;font-size:11px;
               text-align:center;background:#f5f5f5;min-width:52px;font-weight:600">
      ${s.subjectName}
    </th>
  `).join("")

      const dataRows = roster
        .slice()
        .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
        .map((e, ri) => {
          const cells = chunk.map(s => {
            const notEnrolled = new Date(s.startTime) < new Date(e.joinedAt)
            if (notEnrolled) return `
          <td style="border:1px solid #ccc;text-align:center;
              padding:5px;color:#bbb;font-size:12px">-</td>`
            const present = !!recordMap[`${e.studentId}_${s.$id}`]
            return `
          <td style="border:1px solid #ccc;text-align:center;padding:5px;
              font-weight:700;font-size:12px;
              color:${present ? "#16a34a" : "#dc2626"}">
            ${present ? "P" : "A"}
          </td>`
          }).join("")

          const eligibleSessions = chunk.filter(s =>
            new Date(s.startTime) >= new Date(e.joinedAt)
          )
          const presentCount = eligibleSessions.filter(s =>
            recordMap[`${e.studentId}_${s.$id}`]
          ).length
          const pct = eligibleSessions.length > 0
            ? Math.round((presentCount / eligibleSessions.length) * 100) : null

          return `
        <tr style="background:${ri % 2 === 0 ? "#fff" : "#fafafa"}">
          <td style="border:1px solid #ccc;padding:5px 8px;font-family:monospace;
              font-size:11px;white-space:nowrap">${e.rollNumber}</td>
          <td style="border:1px solid #ccc;padding:5px 8px;font-size:12px">
            ${e.studentName}
            ${e.isLeet
              ? '<span style="font-size:9px;background:#fef3c7;color:#92400e;padding:1px 4px;border-radius:3px;margin-left:4px">LEET</span>'
              : ""}
          </td>
          ${cells}
          <td style="border:1px solid #ccc;text-align:center;padding:5px;
              font-weight:700;font-size:12px;
              color:${pct === null ? "#999" : pct >= 75 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626"}">
            ${pct === null ? "-" : pct + "%"}
          </td>
        </tr>`
        }).join("")

      return `
    <div class="page" ${pageIdx > 0 ? 'style="page-break-before:always"' : ""}>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;
                  margin-bottom:12px;padding-bottom:10px;border-bottom:2px solid #333">
        <div style="display:flex;align-items:center;gap:12px">
          <img src="/pwa-192.png" width="36" height="36"
               style="border-radius:8px" alt="Unizuya" />
          <div>
            <div style="font-size:18px;font-weight:700;color:#111">${cls?.name ?? "Class"}</div>
            <div style="font-size:11px;color:#666;margin-top:2px">
              ${cls?.branch ?? ""} · Semester ${cls?.semester ?? ""} · ${roster.length} students
            </div>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-size:11px;color:#666">Attendance Register</div>
          <div style="font-size:11px;color:#333;font-weight:600;margin-top:2px">
            ${pageFrom}${pageFrom !== pageTo ? " to " + pageTo : ""}
          </div>
          <div style="font-size:10px;color:#999;margin-top:2px">
            Page ${pageIdx + 1} of ${chunks.length}
          </div>
        </div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-family:sans-serif">
        <thead>
          <!-- Date spanning row -->
          <tr>
            <th rowspan="2" style="border:1px solid #ccc;padding:6px 8px;font-size:11px;
                text-align:left;background:#f0f0f0;white-space:nowrap;vertical-align:middle">
              Roll No
            </th>
            <th rowspan="2" style="border:1px solid #ccc;padding:6px 8px;font-size:11px;
                text-align:left;background:#f0f0f0;min-width:140px;vertical-align:middle">
              Student Name
            </th>
            ${dateHeaderRow}
            <th rowspan="2" style="border:1px solid #ccc;padding:6px 8px;font-size:11px;
                text-align:center;background:#f0f0f0;min-width:48px;vertical-align:middle">
              %
            </th>
          </tr>
          <!-- Subject sub-header row -->
          <tr>
            ${subjectHeaderRow}
          </tr>
        </thead>
        <tbody>${dataRows}</tbody>
      </table>

      <div style="margin-top:32px;display:flex;justify-content:space-between;align-items:flex-end">
        <div style="font-size:10px;color:#999">
          Generated by Unizuya · ${new Date().toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric"
      })} · P = Present, A = Absent, - = Not enrolled yet
        </div>
        <div style="text-align:center">
          <div style="width:180px;border-top:1px solid #333;
                      padding-top:4px;font-size:11px;color:#555">
            Teacher Signature
          </div>
        </div>
      </div>
    </div>`
    }).join("")

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${cls?.name ?? "Attendance"} Register</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: sans-serif; color: #111; background: #fff; padding: 24px; }
    .page { max-width: 100%; }
    @media print {
      body { padding: 12px; }
      @page { margin: 1cm; size: landscape; }
    }
  </style>
</head>
<body>${pagesHtml}</body>
</html>`

    const win = window.open("", "_blank")
    win.document.write(html)
    win.document.close()
    // Auto-trigger print dialog
    win.onload = () => win.print()
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
          <h2 className="text-base font-bold">Print Attendance Register</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generates a printable register grouped by date range. Each page fits the sessions you choose.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              From date
            </label>
            <input type="date" value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              To date
            </label>
            <input type="date" value={toDate}
              onChange={e => setToDate(e.target.value)}
              className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Max sessions per page
            </label>
            <input type="number" min="1" max="20"
              value={perPage}
              onChange={e => setPerPage(e.target.value)}
              placeholder="e.g. 6 for weekly, 10 for bi-weekly"
              className={inputCls} />
            <p className="text-[10px] text-muted-foreground/60">
              Leave date range empty to include all sessions
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-border/60 text-sm
                       text-muted-foreground hover:bg-muted transition-all">
            Cancel
          </button>
          <button onClick={handleGenerate}
            className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       text-white text-sm font-medium transition-all
                       flex items-center justify-center gap-1.5">
            <Printer size={13} /> Generate
          </button>
        </div>
      </motion.div>
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

  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const exportMenuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

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
      await deleteSession(sessionId, user.$id)
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
            {cls?.name ?? classId} - Attendance Report
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {roster.length} students · {sessions.length} sessions ·{" "}
            <span className="text-indigo-400">Click P/A to toggle · Click 🗑 to delete column</span>
          </p>
        </div>
        {sessions.length > 0 && (
          <div ref={exportMenuRef} className="relative shrink-0">
            <button
              onClick={() => setShowExportMenu(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl
                 border border-border/60 bg-card/60 hover:bg-muted
                 text-xs font-medium text-muted-foreground hover:text-foreground
                 transition-all active:scale-[0.97]"
            >
              <Download size={13} />
              Export
              <ChevronDown size={11}
                className={`transition-transform duration-200 ${showExportMenu ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-[calc(100%+6px)] z-50
                     bg-card border border-border/60 rounded-xl shadow-xl
                     overflow-hidden backdrop-blur-sm min-w-[160px]"
                >
                  <button
                    onClick={() => {
                      exportCSV(cls, roster, sessions, recordMap)
                      setShowExportMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm
                       text-foreground hover:bg-muted/60 transition-colors text-left"
                  >
                    <Download size={13} className="text-muted-foreground" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => {
                      setShowPrintModal(true)
                      setShowExportMenu(false)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm
                       text-foreground hover:bg-muted/60 transition-colors text-left"
                  >
                    <Printer size={13} className="text-muted-foreground" />
                    Print Register
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
                      {/* Subject name - wraps on space */}
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
                const eligibleSessions = getEligibleSessions(sessions, e)
                const presentCount = eligibleSessions.filter(s =>
                  recordMap[`${e.studentId}_${s.$id}`]
                ).length
                const pct = eligibleSessions.length > 0
                  ? Math.round((presentCount / eligibleSessions.length) * 100) : 0

                return (
                  <tr key={e.$id}
                    className={`border-b border-border/30 last:border-0
        ${i % 2 === 0 ? "bg-transparent" : "bg-muted/10"}`}>

                    {/* Student name - sticky */}
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
                      const notEnrolledYet = new Date(s.startTime) < new Date(e.joinedAt)

                      return (
                        <td key={s.$id}
                          className="text-center px-1 py-2.5 border-l border-border/20">
                          {notEnrolledYet ? (
                            <span className="text-muted-foreground/20 text-xs font-mono">-</span>
                          ) : (
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
                          )}
                        </td>
                      )
                    })}

                    {/* Percentage */}
                    <td className="text-center px-4 py-2.5 border-l border-border/30">
                      <span className={`font-semibold ${pct >= 75 ? "text-emerald-400"
                        : pct >= 50 ? "text-amber-400"
                          : "text-destructive"
                        }`}>
                        {eligibleSessions.length === 0 ? "-" : `${pct}%`}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showPrintModal && (
          <PrintRegisterModal
            cls={cls}
            sessions={sessions}
            roster={roster}
            recordMap={recordMap}
            onClose={() => setShowPrintModal(false)}
          />
        )}
      </AnimatePresence>

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
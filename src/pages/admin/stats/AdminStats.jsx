import { useState, useEffect, useCallback, useRef } from "react"
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell,
} from "recharts"
import {
  Users, Eye, UserPlus, Sparkles,
  Mail, RefreshCw, TrendingUp, Loader2, Info, ChevronDown, ChevronUp
} from "lucide-react"
import { databases, account } from "@/lib/appwrite"
import { Query } from "appwrite"

const WORKER = "https://unizuya-stats.harshtayal710.workers.dev"

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString()
const shortDate = (d) => {
  if (!d) return ""
  const [, m, day] = d.split("-")
  return `${day}/${m}`
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent = "#3b82f6", loading }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-4 flex items-center gap-3 min-w-0">
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
            {value ?? "—"}
          </p>
        )}
        {sub && !loading && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
        )}
      </div>
    </div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-border bg-background/95 shadow-xl
                    backdrop-blur-sm px-3 py-2.5 text-xs pointer-events-none">
      <p className="font-semibold text-foreground mb-2 pb-1.5 border-b border-border">{label}</p>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold text-foreground ml-auto pl-3">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Scrollable chart wrapper (horizontal scroll on mobile) ────────────────────
function ScrollChart({ data, minWidth = 600, height = 240, children }) {
  const scrollRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  // Mouse drag to scroll on desktop too
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
      {/* Scroll hint on mobile */}
      {data.length > 7 && (
        <p className="text-[10px] text-muted-foreground/50 text-center mt-2 sm:hidden">
          ← scroll to see more →
        </p>
      )}
    </div>
  )
}

// ── Progress bar ──────────────────────────────────────────────────────────────
function QuotaBar({ label, used, limit, color, note }) {
  const pct = Math.min((used / limit) * 100, 100)
  const danger = pct > 80
  const warn = pct > 60
  const barColor = danger ? "#ef4444" : warn ? "#f59e0b" : color
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground">{label}</span>
          {note && (
            <span className="text-[10px] text-muted-foreground/60">{note}</span>
          )}
        </div>
        <span className={`text-xs tabular-nums font-semibold
                          ${danger ? "text-red-500" : warn ? "text-amber-500" : "text-muted-foreground"}`}>
          {fmt(used)} / {fmt(limit)}
          <span className="ml-1 font-normal text-[10px] opacity-70">({pct.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: barColor }} />
      </div>
    </div>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, hint, children }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          {title}
        </p>
        {hint && (
          <span className="group relative cursor-help">
            <Info size={11} className="text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
            <span className="absolute left-5 top-0 z-10 hidden group-hover:block
                             w-56 text-[11px] leading-snug bg-background border border-border
                             rounded-lg shadow-xl px-2.5 py-2 text-muted-foreground">
              {hint}
            </span>
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 rounded-xl
                    border border-dashed border-border gap-2">
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <TrendingUp size={15} className="text-muted-foreground/40" />
      </div>
      <p className="text-xs text-muted-foreground text-center max-w-xs px-4">{message}</p>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
export default function AdminStats() {
  const [today, setToday] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastSync, setLastSync] = useState(null)
  const [selected, setSelected] = useState(null) // clicked bar data

  const [limits, setLimits] = useState({ cgpa: 10, timetable: 1 })
  const [limitsLoading, setLimitsLoading] = useState(true)
  const [limitsSaving, setLimitsSaving] = useState(false)
  const [limitsSaved, setLimitsSaved] = useState(false)

  const [usersExpanded, setUsersExpanded] = useState(false)

  const [usernameMap, setUsernameMap] = useState({})


  const resolveUsernames = async (userIds) => {
    if (!userIds.length) return {}
    try {
      const res = await databases.listDocuments(
        import.meta.env.VITE_APPWRITE_DATABASE_ID,
        import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
        [Query.equal("userId", userIds)]
      )
      const map = {}
      for (const doc of res.documents) {
        map[doc.userId] = doc.username ?? doc.name ?? doc.userId.slice(0, 8)
      }
      return map
    } catch (e) {
      console.error("resolveUsernames failed:", e)
      return {}
    }
  }

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [tRes, hRes] = await Promise.all([
        fetch(`${WORKER}/stats/today`),
        fetch(`${WORKER}/stats`),
      ])
      if (!tRes.ok || !hRes.ok) throw new Error("Worker returned an error")
      const tData = await tRes.json()
      const hData = await hRes.json()
      setToday(tData)
      // Resolve usernames for top token users
      const topUsers = tData.top_token_users ?? []
      if (topUsers.length) {
        const map = await resolveUsernames(topUsers.map(u => u.userId))
        setUsernameMap(map)
      }
      const docs = hData.documents ?? []
      const sorted = [...docs].sort((a, b) => a.date.localeCompare(b.date))
      setHistory(sorted)
      setLastSync(new Date())
      setSelected(null)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }, [])

  // ADD after the load useCallback, before useEffect(() => { load() }, [load])

  const loadLimits = useCallback(async () => {
    setLimitsLoading(true)
    try {
      const res = await fetch(`${WORKER}/ai-limits`)
      if (res.ok) setLimits(await res.json())
    } catch { }
    finally { setLimitsLoading(false) }
  }, [])

  useEffect(() => { loadLimits() }, [loadLimits])

  const saveLimits = async () => {
    setLimitsSaving(true)
    try {
      await fetch(`${WORKER}/ai-limits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(limits),
      })
      setLimitsSaved(true)
      setTimeout(() => setLimitsSaved(false), 2000)
    } catch (e) { console.error(e) }
    finally { setLimitsSaving(false) }
  }

  useEffect(() => { load() }, [load])

  // ── Build chart data: history (sorted asc) + today appended ──────────────
  // We always include today even if history is empty so chart isn't blank
  const buildActivityData = () => {
    // Exclude today's date from history to avoid duplicate bar
    const todayDate = today?.date
    const hist = history
      .filter(d => d.date !== todayDate)
      .slice(-14)
      .map(d => ({
        date: shortDate(d.date),
        fullDate: d.date,
        isToday: false,
        "Active users": d.active_users ?? 0,
        "Page views": d.page_views ?? 0,
        "New signups": d.new_signups ?? 0,
      }))

    if (today) hist.push({
      date: shortDate(today.date) + " ★",
      fullDate: today.date,
      isToday: true,
      "Active users": today.active_users ?? 0,
      "Page views": today.page_views ?? 0,
      "New signups": today.new_signups ?? 0,
    })

    return hist
  }

  const buildGeminiData = () => {
    const todayDate = today?.date  // ← add this
    const rows = history
      .filter(d => d.date !== todayDate)  // ← add this filter
      .slice(-14)
      .map(d => ({
        date: shortDate(d.date),
        isToday: false,
        "Total": d.gemini_tokens_total ?? 0,
        "CGPA": d.gemini_tokens_cgpa ?? 0,
        "Timetable": d.gemini_tokens_timetable ?? 0,
      }))
    if (today) rows.push({
      date: shortDate(today.date) + " ★",
      isToday: true,
      "Total": today.gemini_tokens_total ?? 0,
      "CGPA": today.gemini_tokens_cgpa ?? 0,
      "Timetable": today.gemini_tokens_timetable ?? 0,
    })
    return rows
  }

  const activityData = buildActivityData()
  const geminiData = buildGeminiData()

  // ── Summary totals ────────────────────────────────────────────────────────
  // Include today's live data in totals so numbers aren't 0 before first flush
  const todayActive = today?.active_users ?? 0
  const todayViews = today?.page_views ?? 0
  const todaySignups = today?.new_signups ?? 0
  const todayTokens = today?.gemini_tokens_total ?? 0
  const todayEmails = today?.resend_emails_sent ?? 0

  const histMAU = history.slice(-30).reduce((s, d) => s + (d.active_users ?? 0), 0)
  const histWAU = history.slice(-7).reduce((s, d) => s + (d.active_users ?? 0), 0)
  const histTokens = history.slice(-30).reduce((s, d) => s + (d.gemini_tokens_total ?? 0), 0)
  const histEmails = history.slice(-30).reduce((s, d) => s + (d.resend_emails_sent ?? 0), 0)

  // Add today to these so they're non-zero from day 1
  const totalMAU = histMAU + todayActive
  const totalWAU = histWAU + todayActive
  const totalTokens = histTokens + todayTokens
  const totalEmails = histEmails + todayEmails

  // Quota: use page_views as proxy for worker requests
  const totalWorkerReqs = history.reduce((s, d) => s + (d.page_views ?? 0), 0) + todayViews

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Stats</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Live today + 30-day history · flushed to Appwrite at midnight UTC
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {lastSync && (
            <span className="text-xs text-muted-foreground hidden sm:block">
              Updated {lastSync.toLocaleTimeString()}
            </span>
          )}
          <button onClick={load} disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg
                       border border-border hover:bg-muted transition-colors disabled:opacity-50">
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20
                        text-sm text-destructive flex items-center gap-2">
          <Info size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* ── TODAY LIVE ── */}
      <Section
        title="Today — live"
        hint="Counts are live from Cloudflare KV — updated instantly on every visit. Flushed to Appwrite database at midnight UTC."
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Active users" value={fmt(todayActive)}
            accent="#3b82f6" loading={loading} />
          <StatCard icon={Eye} label="Page views" value={fmt(todayViews)}
            accent="#8b5cf6" loading={loading}
            sub="across all layouts combined" />
          <StatCard icon={UserPlus} label="New signups" value={fmt(todaySignups)}
            accent="#10b981" loading={loading} />
          <StatCard icon={Mail} label="Emails sent" value={fmt(todayEmails)}
            accent="#f59e0b" loading={loading} />
        </div>
      </Section>

      {/* ── 30-DAY SUMMARY ── */}
      <Section
        title="30-day summary"
        hint="Includes today's live data so these numbers are never 0 on day 1. History accumulates after each midnight flush."
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Users} label="MAU (30 days)" value={fmt(totalMAU)}
            accent="#3b82f6" sub="sum of daily actives" loading={loading} />
          <StatCard icon={TrendingUp} label="WAU (7 days)" value={fmt(totalWAU)}
            accent="#8b5cf6" sub="last 7 days" loading={loading} />
          <StatCard icon={Sparkles} label="Gemini tokens" value={fmt(totalTokens)}
            accent="#ec4899" sub="this month" loading={loading} />
          <StatCard icon={Mail} label="Emails sent" value={fmt(totalEmails)}
            accent="#f59e0b" sub="this month" loading={loading} />
        </div>
      </Section>

      {/* ── USER ACTIVITY CHART ── */}
      <Section
        title="User activity — last 14 days + today ★"
        hint="Page views = every layout mount (PublicLayout, UserLayout, AdminLayout). Active users = unique userId seen today. Drag or touch-scroll to pan on small screens."
      >
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">

          {/* Selected bar detail (mobile-friendly alternative to hover) */}
          {selected && (
            <div className="mb-4 p-3 rounded-lg bg-muted/60 border border-border
                            flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-semibold text-foreground">{selected.date}</span>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {fmt(selected["Active users"])} users
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                  {fmt(selected["Page views"])} views
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  {fmt(selected["New signups"])} signups
                </span>
              </div>
              <button onClick={() => setSelected(null)}
                className="text-[11px] text-muted-foreground hover:text-foreground">✕</button>
            </div>
          )}

          {activityData.length === 0 ? (
            <EmptyChart message="No data yet. Visit a few pages then click Refresh — or wait for midnight flush." />
          ) : (
            <ScrollChart data={activityData} minWidth={Math.max(500, activityData.length * 80)} height={240}>
              <BarChart
                data={activityData}
                barGap={2}
                barCategoryGap="35%"
                onClick={(d) => d?.activePayload && setSelected(d.activePayload[0]?.payload)}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-tertiary, rgba(0,0,0,0.08))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  axisLine={false}
                  tickLine={false}
                  interval={0}
                  tickMargin={8}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  axisLine={false} tickLine={false}
                  width={30}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: "rgba(128,128,128,0.06)", radius: 4 }}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 16 }}
                  iconType="circle" iconSize={8}
                />
                <Bar dataKey="Active users" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={16} cursor="pointer">
                  {activityData.map((entry, i) => (
                    <Cell key={i} fill={entry.isToday ? "#2563eb" : "#3b82f6"}
                      fillOpacity={entry.isToday ? 1 : 0.75} />
                  ))}
                </Bar>
                <Bar dataKey="Page views" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={16} cursor="pointer">
                  {activityData.map((entry, i) => (
                    <Cell key={i} fill={entry.isToday ? "#7c3aed" : "#8b5cf6"}
                      fillOpacity={entry.isToday ? 1 : 0.75} />
                  ))}
                </Bar>
                <Bar dataKey="New signups" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={16} cursor="pointer">
                  {activityData.map((entry, i) => (
                    <Cell key={i} fill={entry.isToday ? "#059669" : "#10b981"}
                      fillOpacity={entry.isToday ? 1 : 0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ScrollChart>
          )}
        </div>
      </Section>

      {/* ── GEMINI TOKEN CHART ── */}
      <Section
        title="Gemini token usage — last 14 days + today ★"
        hint="Tokens are tracked per tool call. Total = CGPA + Timetable + any future tools."
      >
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          {geminiData.every(d => d["Total"] === 0) ? (
            <EmptyChart message="No Gemini calls tracked yet. Use the CGPA AI Scan or Timetable AI Scan to generate data." />
          ) : (
            <ScrollChart data={geminiData} minWidth={Math.max(500, geminiData.length * 80)} height={220}>
              <LineChart data={geminiData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--color-border-tertiary, rgba(0,0,0,0.08))"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  axisLine={false} tickLine={false}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "currentColor", opacity: 0.5 }}
                  axisLine={false} tickLine={false}
                  width={42}
                  allowDecimals={false}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ stroke: "rgba(128,128,128,0.15)", strokeWidth: 1 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 16 }} iconType="circle" iconSize={8} />
                <Line dataKey="Total" stroke="#ec4899" strokeWidth={2.5}
                  dot={{ r: 3, fill: "#ec4899" }} activeDot={{ r: 5 }} />
                <Line dataKey="CGPA" stroke="#f97316" strokeWidth={1.5}
                  dot={{ r: 2, fill: "#f97316" }} strokeDasharray="5 3" activeDot={{ r: 4 }} />
                <Line dataKey="Timetable" stroke="#a855f7" strokeWidth={1.5}
                  dot={{ r: 2, fill: "#a855f7" }} strokeDasharray="5 3" activeDot={{ r: 4 }} />
              </LineChart>
            </ScrollChart>
          )}

          {/* ── Top token users today ──────────────────────────────────── */}
          <div className="mt-4 pt-4 border-t border-border">
            <button
              onClick={() => setUsersExpanded(v => !v)}
              className="w-full flex items-center justify-between text-left group">
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  Top token users today
                </p>
                {(today?.top_token_users?.length ?? 0) > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold
                                   bg-pink-500/10 text-pink-500">
                    {today.top_token_users.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground/50
                              group-hover:text-muted-foreground transition-colors">
                <span className="text-[10px]">{usersExpanded ? "collapse" : "expand"}</span>
                {usersExpanded
                  ? <ChevronUp size={13} />
                  : <ChevronDown size={13} />}
              </div>
            </button>

            {usersExpanded && (
              <div className="mt-3 space-y-1.5">
                {loading ? (
                  <div className="flex items-center gap-2 py-3">
                    <Loader2 size={13} className="animate-spin text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Loading…</span>
                  </div>
                ) : !today?.top_token_users?.length ? (
                  <p className="text-xs text-muted-foreground py-3 text-center">
                    No AI scans recorded today yet.
                  </p>
                ) : (
                  <>
                    <div className="grid text-[10px] font-semibold uppercase tracking-widest
                                    text-muted-foreground/50 px-2 mb-2"
                      style={{ gridTemplateColumns: "1fr 80px 60px 60px 44px" }}>
                      <span>User ID</span>
                      <span className="text-right">Tokens</span>
                      <span className="text-right">CGPA</span>
                      <span className="text-right">TT</span>
                      <span className="text-right">Scans</span>
                    </div>

                    {today.top_token_users.map((u, i) => {
                      const isHeavy = u.tokens > 20000
                      const isMid = u.tokens > 8000
                      const tokenColor = isHeavy ? "text-red-500"
                        : isMid ? "text-amber-500"
                          : "text-emerald-500"
                      return (
                        <div key={u.userId}
                          className={`grid items-center px-2 py-2 rounded-lg text-xs
                                      transition-colors hover:bg-muted/40
                                      ${i === 0
                              ? "bg-pink-500/5 border border-pink-500/10"
                              : "border border-transparent"}`}
                          style={{ gridTemplateColumns: "1fr 80px 60px 60px 44px" }}>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`shrink-0 w-4 h-4 rounded text-[10px] font-bold
                                             flex items-center justify-center
                                             ${i === 0
                                ? "bg-pink-500 text-white"
                                : "bg-muted text-muted-foreground"}`}>
                              {i + 1}
                            </span>

                            <a href={`/profile/${usernameMap[u.userId] ?? u.userId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={u.userId}
                              className="text-[11px] text-primary hover:underline truncate font-medium">
                              {usernameMap[u.userId] ?? `${u.userId.slice(0, 8)}…`}
                            </a>
                          </div>
                          <span className={`text-right font-bold tabular-nums ${tokenColor}`}>
                            {fmt(u.tokens)}
                          </span>
                          <span className="text-right tabular-nums text-muted-foreground">
                            {fmt(u.cgpa)}
                          </span>
                          <span className="text-right tabular-nums text-muted-foreground">
                            {fmt(u.timetable)}
                          </span>
                          <span className="text-right tabular-nums font-semibold text-foreground">
                            {u.scans}
                          </span>
                        </div>
                      )
                    })}

                    <p className="text-[10px] text-muted-foreground/40 text-right pt-1">
                      User IDs truncated · resets at midnight UTC
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

        </div>   {/* closes the card div */}
      </Section> {/* closes the Gemini Section */}

      {/* ── AI SCAN LIMITS ── */}
      <Section
        title="AI scan limits — per user per day"
        hint="Controls how many Gemini AI Scans each user can trigger per day. Resets at midnight UTC. Stored in Cloudflare KV — takes effect immediately."
      >
        <div className="rounded-xl border border-border bg-card px-5 py-5">
          {limitsLoading ? (
            <div className="flex items-center gap-2 py-4">
              <Loader2 size={14} className="animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Loading limits…</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
                {[
                  { key: "cgpa", label: "CGPA Calculator", sub: "~500–2k tokens/scan", color: "#f97316", maxForBar: 20 },
                  { key: "timetable", label: "Timetable Builder", sub: "~9.5k tokens/scan", color: "#a855f7", maxForBar: 5 },
                ].map(({ key, label, sub, color, maxForBar }) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground">{label}</p>
                        <p className="text-[11px] text-muted-foreground">{sub}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setLimits(l => ({ ...l, [key]: Math.max(0, (l[key] ?? 1) - 1) }))}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center
                               text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-bold text-sm">
                          −
                        </button>
                        <input
                          type="number" min="0" max="99"
                          value={limits[key] ?? ""}
                          onChange={e => setLimits(l => ({ ...l, [key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="w-12 h-7 text-center text-sm font-bold rounded-lg border border-border
                               bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary
                               [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => setLimits(l => ({ ...l, [key]: (l[key] ?? 0) + 1 }))}
                          className="w-7 h-7 rounded-lg border border-border flex items-center justify-center
                               text-muted-foreground hover:text-foreground hover:bg-muted transition-colors font-bold text-sm">
                          +
                        </button>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(((limits[key] ?? 0) / maxForBar) * 100, 100)}%`, background: color }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground/60">
                      Est. max tokens/user/day: ~{((limits[key] ?? 0) * (key === "timetable" ? 9500 : 1500)).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-border gap-3 flex-wrap">
                <p className="text-[11px] text-muted-foreground/60">
                  Stored in Cloudflare KV · applies globally to all users instantly
                </p>
                <button
                  onClick={saveLimits}
                  disabled={limitsSaving}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-colors
              ${limitsSaved
                      ? "border border-emerald-400/60 text-emerald-500 bg-emerald-500/5"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"}
              ${limitsSaving ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {limitsSaved ? "✓ Saved!" : limitsSaving ? "Saving…" : "Save limits"}
                </button>
              </div>
            </>
          )}
        </div>
      </Section>

      {/* ── SERVICE QUOTAS ── */}
      <Section
        title="Service quotas — free tier limits"
        hint="Worker requests estimated from page_views count. Gemini token limit is per day, others per month."
      >
        <div className="rounded-xl border border-border bg-card px-5 py-5 space-y-5">
          <QuotaBar
            label="Cloudflare Worker requests"
            note="(estimated from page views, resets daily)"
            used={todayViews}
            limit={100000}
            color="#3b82f6"
          />
          <QuotaBar
            label="Resend emails"
            note="(monthly)"
            used={totalEmails}
            limit={3000}
            color="#f59e0b"
          />
          <QuotaBar
            label="Gemini 2.5 Flash tokens"
            note="(daily free limit)"
            used={todayTokens}
            limit={1000000}
            color="#ec4899"
          />
          <QuotaBar
            label="Appwrite DB operations"
            note="(monthly free tier: 750k)"
            used={totalWorkerReqs * 2}
            limit={750000}
            color="#8b5cf6"
          />
          <p className="text-[11px] text-muted-foreground/50 pt-1 border-t border-border">
            Cloudflare: 100k req/day · Resend: 3,000 emails/month · Gemini Flash: 1M tokens/day · Appwrite: 750k operations/month
          </p>
        </div>
      </Section>

    </div>
  )
}
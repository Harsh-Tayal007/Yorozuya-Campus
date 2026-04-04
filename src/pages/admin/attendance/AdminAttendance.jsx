import { useQuery } from "@tanstack/react-query"
import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Link } from "react-router-dom"
import {
    ClipboardCheck, Users, BookOpen,
    ChevronDown, ArrowUpRight, Search
} from "lucide-react"
import { getAllClasses } from "@/services/attendance/classService"
import { getSessionsByClass } from "@/services/attendance/sessionService"
import { getEnrollmentsByClass } from "@/services/attendance/classService"
import { Query } from "appwrite"
import { databases } from "@/lib/appwrite"
import { DATABASE_ID } from "@/config/appwrite"

const USERS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

function useTeacherNames(teacherIds) {
    return useQuery({
        queryKey: ["teacher-names", teacherIds],
        queryFn: async () => {
            if (!teacherIds.length) return {}
            const res = await databases.listDocuments(
                DATABASE_ID, USERS_COLLECTION_ID,
                [Query.equal("userId", teacherIds), Query.limit(100),
                Query.select(["userId", "username", "name"])]
            )
            const map = {}
            for (const doc of res.documents) {
                map[doc.userId] = doc.name || doc.username || doc.userId.slice(0, 10)
            }
            return map
        },
        enabled: teacherIds.length > 0,
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
                        {value ?? "—"}
                    </p>
                )}
            </div>
        </div>
    )
}

// ── Per-class row ─────────────────────────────────────────────────────────────
function ClassRow({ cls, index }) {
    const [expanded, setExpanded] = useState(false)

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
                        <p className="text-sm font-semibold text-foreground truncate">{cls.name}</p>
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
    const teacherIds = [...new Set(allClasses.flatMap(c => c.teacherIds ?? []))]
    const { data: teacherMap = {} } = useTeacherNames(teacherIds)

    const filtered = allClasses.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.branch.toLowerCase().includes(search.toLowerCase())
        const matchTeacher = filterTeacher === "all" ||
            c.teacherIds?.includes(filterTeacher)
        return matchSearch && matchTeacher
    })

    const totalClasses = allClasses.length
    const totalStrength = allClasses.reduce((s, c) => s + (c.totalStrength ?? 0), 0)
    const activeCount = 0 // realtime would be needed for live count — kept as placeholder

    return (
        <div className="space-y-6 max-w-5xl">

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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard icon={BookOpen} label="Total Classes" value={totalClasses} accent="#6366f1" loading={isLoading} />
                <StatCard icon={Users} label="Total Strength" value={totalStrength} accent="#10b981" loading={isLoading} />
                <StatCard icon={ClipboardCheck} label="Teachers" value={teacherIds.length} accent="#f59e0b" loading={isLoading} />
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
                        <ClassRow key={cls.$id} cls={cls} index={i} />
                    ))}
                </div>
            )}
        </div>
    )
}
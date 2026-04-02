import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ClipboardCheck, Hash, BookOpen, Clock,
  CheckCircle2, AlertCircle, RefreshCw
} from "lucide-react"
import { useStudentClasses } from "@/hooks/attendance/useClasses"
import {
  useStudentActiveSessions, useMarkAttendance,
  useMySessionToken
} from "@/hooks/attendance/useAttendanceSession"
import { useAuth } from "@/context/AuthContext"
import { useQueryClient } from "@tanstack/react-query"
import { getAllClasses } from "@/services/attendance/classService"
import { useQuery } from "@tanstack/react-query"

const inputCls = `w-full h-10 px-3 rounded-xl border border-border/60 bg-card/60
  text-sm text-foreground placeholder:text-muted-foreground/50
  focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-500
  hover:border-border transition-all duration-150`

// ── Join Class Modal ──────────────────────────────────────────────────────────
function JoinClassModal({ onClose }) {
  const [code, setCode]   = useState("")
  const [name, setName]   = useState("")
  const [roll, setRoll]   = useState("")
  const [isLeet, setIsLeet] = useState(false)
  const { joinClass }     = useStudentClasses()

  const handle = async () => {
    if (!code || !name || !roll) return
    await joinClass.mutateAsync({
      inviteCode: code.toUpperCase(),
      studentName: name,
      rollNumber: roll,
      isLeet,
    })
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
        <h2 className="text-base font-bold">Join a Class</h2>
        <div className="space-y-3">
          <input
            placeholder="Invite code (e.g. AB12CD)"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            className={inputCls + " font-mono tracking-widest"}
          />
          <input
            placeholder="Your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputCls}
          />
          <input
            placeholder="Roll number"
            value={roll}
            onChange={e => setRoll(e.target.value)}
            className={inputCls}
          />

          {/* LEET toggle */}
          <button
            onClick={() => setIsLeet(v => !v)}
            className={`w-full flex items-center justify-between px-3 py-2.5
                        rounded-xl border transition-all duration-150
                        ${isLeet
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-border/60 bg-muted/20 hover:bg-muted/40"
                        }`}
          >
            <div className="text-left">
              <p className={`text-xs font-semibold ${isLeet ? "text-amber-400" : "text-muted-foreground"}`}>
                LEET Student
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Lateral entry — joined from 2nd year
              </p>
            </div>
            <div className={`w-8 h-4 rounded-full transition-all duration-200 relative
                            ${isLeet ? "bg-amber-500" : "bg-muted-foreground/30"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white
                              transition-all duration-200 shadow-sm
                              ${isLeet ? "left-4" : "left-0.5"}`} />
            </div>
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 px-4 py-2 rounded-xl border border-border/60 text-sm
                       text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
            Cancel
          </button>
          <button onClick={handle} disabled={joinClass.isPending}
            className="flex-1 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500
                       text-white text-sm font-medium transition-all disabled:opacity-50">
            {joinClass.isPending ? "Joining…" : "Join"}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ── Token display + mark for a live session ───────────────────────────────────
function ActiveSessionCard({ session, enrollment }) {
  const { user } = useAuth()
  const [inputToken, setInputToken] = useState("")
  const [markedDone, setMarkedDone] = useState(false)

  const { data: myTokenDoc } = useMySessionToken(session.$id, user.$id)
  const markAttendance = useMarkAttendance(session)

  const handle = async () => {
    await markAttendance.mutateAsync({
      token: inputToken,
      rollNumber: enrollment.rollNumber,
    })
    setMarkedDone(true)
  }

  const tokenExpired = myTokenDoc?.used

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/20">
            <ClipboardCheck size={14} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold">{session.subjectName}</p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Clock size={10} />
              Started {new Date(session.startTime).toLocaleTimeString([], {
                hour: "2-digit", minute: "2-digit"
              })}
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide
                         px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400
                         border border-emerald-500/20 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </div>

      {markedDone ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <p className="text-sm text-emerald-400 font-medium">Attendance marked!</p>
        </div>
      ) : session.mode === "manual" ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-muted/30 border border-border/40">
          <p className="text-xs text-muted-foreground">
            Manual attendance — your teacher will mark you.
          </p>
        </div>
      ) : tokenExpired ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <p className="text-sm text-emerald-400 font-medium">Already marked!</p>
        </div>
      ) : myTokenDoc ? (
        <div className="space-y-3">
          {/* Show assigned token prominently */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-center space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">
              Your token
            </p>
            <p className="text-4xl font-mono font-bold tracking-[0.35em] text-indigo-400">
              {myTokenDoc.token}
            </p>
          </div>
          {/* Token input */}
          <input
            placeholder="Type your token above to confirm"
            value={inputToken}
            onChange={e => setInputToken(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={inputCls + " text-center font-mono text-xl tracking-[0.4em]"}
            maxLength={6}
          />
          <button
            onClick={handle}
            disabled={inputToken.length !== 6 || markAttendance.isPending}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500
                       text-white text-sm font-medium transition-all
                       disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]">
            {markAttendance.isPending ? "Marking…" : "Mark Present"}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl
                        bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={14} className="text-amber-400" />
          <p className="text-xs text-amber-400">
            Token not assigned yet. Refresh in a moment.
          </p>
        </div>
      )}
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function StudentAttendance() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [showJoin, setShowJoin] = useState(false)

  const { enrollments, isLoading: enrollLoading } = useStudentClasses()
  const enrolledClassIds = enrollments.map(e => e.classId)

  const { data: activeSessions = [], isLoading: sessionsLoading } =
    useStudentActiveSessions(enrolledClassIds)

  // Fetch all classes to resolve class names
  const { data: allClasses = [] } = useQuery({
    queryKey: ["classes-all"],
    queryFn: getAllClasses,
    staleTime: 1000 * 60 * 5,
  })
  const classNameMap = Object.fromEntries(allClasses.map(c => [c.$id, c.name]))

  const isLoading = enrollLoading || sessionsLoading

  const refreshRoster = () => {
    qc.invalidateQueries({ queryKey: ["enrollments", "student", user.$id] })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold">Attendance</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mark attendance and view your classes
          </p>
        </div>
        <button onClick={() => setShowJoin(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl
                     bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium
                     transition-all active:scale-[0.97]">
          <Hash size={13} /> Join Class
        </button>
      </motion.div>

      {/* Active sessions */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i =>
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted/30" />
          )}
        </div>
      ) : activeSessions.length > 0 ? (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Active Sessions ({activeSessions.length})
          </p>
          {activeSessions.map(s => {
            const enrollment = enrollments.find(e => e.classId === s.classId)
            if (!enrollment) return null
            return (
              <ActiveSessionCard key={s.$id} session={s} enrollment={enrollment} />
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 rounded-2xl
                        border border-dashed border-border/50">
          <ClipboardCheck size={22} className="text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">No active sessions</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            You'll see live sessions here when a teacher starts one
          </p>
        </div>
      )}

      {/* Enrolled classes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            My Classes ({enrollments.length})
          </p>
          <button
            onClick={refreshRoster}
            className="flex items-center gap-1 text-xs text-muted-foreground
                       hover:text-foreground transition-colors"
          >
            <RefreshCw size={11} /> Refresh
          </button>
        </div>

        {enrollments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 rounded-2xl
                          border border-dashed border-border/50">
            <BookOpen size={22} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No classes joined</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Ask your teacher for an invite code
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {enrollments.map(e => (
              <div key={e.$id}
                className="flex items-center justify-between px-4 py-3 rounded-xl
                           border border-border/50 bg-card/40">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">
                      {classNameMap[e.classId] ?? e.classId}
                    </p>
                    {e.isLeet && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded
                                       bg-amber-500/15 text-amber-400 border border-amber-500/20
                                       uppercase tracking-wide">
                        LEET
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {e.rollNumber}
                  </p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-lg border border-border/50
                                 text-muted-foreground bg-muted/30">
                  {e.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showJoin && <JoinClassModal onClose={() => setShowJoin(false)} />}
      </AnimatePresence>
    </div>
  )
}
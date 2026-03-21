import { useState, useEffect, useRef } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { GraduationCap, BookOpen, GitBranch, ChevronDown, Check, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import { getBranchesByProgram } from "@/services/university/branchService"

// ── Reusable Dropdown ─────────────────────────────────────────────────────────
const Dropdown = ({ value, onChange, options, disabled, placeholder, icon: Icon }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={`
          w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left
          transition-all duration-150 outline-none
          ${disabled
            ? "border-border/40 bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
            : open
              ? "border-violet-500 bg-background ring-2 ring-violet-500/20"
              : "border-border bg-background hover:border-violet-400/50"
          }
        `}
      >
        {Icon && <Icon size={15} className={`shrink-0 ${selected ? "text-violet-400" : "text-muted-foreground"}`} />}
        <span className={`flex-1 ${selected ? "text-foreground" : "text-muted-foreground/60"}`}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1.5 w-full z-[200] rounded-xl border border-border
                       bg-background shadow-xl overflow-hidden origin-top"
          >
            <div className="max-h-52 overflow-y-auto">
              {options.length === 0
                ? <p className="px-4 py-3 text-sm text-muted-foreground">No options available</p>
                : options.map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm
                      transition-colors hover:bg-muted text-left
                      ${opt.value === value ? "text-violet-500 font-semibold bg-violet-500/5" : "text-foreground"}`}
                  >
                    {opt.label}
                    {opt.value === value && <Check size={13} className="text-violet-500 shrink-0" />}
                  </button>
                ))
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
const CompleteProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, completeAcademicProfile } = useAuth()

  const [universityId, setUniversityId] = useState("")
  const [programId,    setProgramId]    = useState("")
  const [branchId,     setBranchId]     = useState("")
  const [saving,       setSaving]       = useState(false)
  const [error,        setError]        = useState(null)

  // Reset program/branch when university changes
  const prevUniRef = useRef("")
  useEffect(() => {
    if (prevUniRef.current && prevUniRef.current !== universityId) {
      setProgramId(""); setBranchId("")
    }
    prevUniRef.current = universityId
  }, [universityId])

  const prevProgramRef = useRef("")
  useEffect(() => {
    if (prevProgramRef.current && prevProgramRef.current !== programId) {
      setBranchId("")
    }
    prevProgramRef.current = programId
  }, [programId])

  const { data: universities = [] } = useQuery({
    queryKey: ["universities"],
    queryFn: getUniversities,
  })

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["programs", universityId],
    queryFn: () => getProgramsByUniversity(universityId),
    enabled: !!universityId,
  })

  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["branches", programId],
    queryFn: () => getBranchesByProgram(programId),
    enabled: !!programId,
  })

  const canSubmit = universityId && programId && branchId && !saving

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit) return
    try {
      setSaving(true)
      setError(null)
      await completeAcademicProfile({ universityId, programId, branchId })
      // Redirect back to where they were, or dashboard
      const from = location.state?.from?.pathname || "/dashboard"
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.message || "Failed to save. Please try again.")
      setSaving(false)
    }
  }

  return (
    <div className="
      relative min-h-screen flex items-center justify-center overflow-hidden px-4
      bg-gradient-to-br from-slate-100 via-white to-slate-200
      dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]
    ">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-30
        bg-violet-400 dark:bg-violet-600 top-[-120px] right-[-120px]" />
      <div className="pointer-events-none absolute w-[300px] h-[300px] rounded-full blur-3xl opacity-20
        bg-indigo-400 dark:bg-indigo-700 bottom-[-80px] left-[-80px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="
          bg-white/90 dark:bg-[#0f1b2e]/80 backdrop-blur-2xl
          border border-slate-200/80 dark:border-white/[0.07]
          shadow-2xl shadow-slate-200/60 dark:shadow-black/60
          rounded-2xl p-8
        ">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 w-12 h-12 rounded-2xl
              bg-gradient-to-br from-violet-500 to-indigo-600
              flex items-center justify-center shadow-lg shadow-violet-500/30">
              <GraduationCap size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              One last step!
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Tell us about your academic background so we can personalise your dashboard.
            </p>
            {currentUser?.name && (
              <p className="text-xs text-violet-500 dark:text-violet-400 mt-1 font-medium">
                Welcome, {currentUser.name.split(" ")[0]} 👋
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* University */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <GraduationCap size={11} /> University
              </label>
              <Dropdown
                value={universityId}
                onChange={setUniversityId}
                options={universities.map(u => ({ value: u.$id, label: u.name }))}
                placeholder="Select your university"
                icon={GraduationCap}
              />
            </div>

            {/* Program */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <BookOpen size={11} />
                Program
                {programsLoading && <Loader2 size={10} className="animate-spin ml-1" />}
              </label>
              <Dropdown
                value={programId}
                onChange={setProgramId}
                options={programs.map(p => ({ value: p.$id, label: p.name }))}
                disabled={!universityId || programsLoading}
                placeholder={programsLoading ? "Loading programs…" : !universityId ? "Select university first" : "Select your program"}
                icon={BookOpen}
              />
            </div>

            {/* Branch */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                <GitBranch size={11} />
                Branch / Specialisation
                {branchesLoading && <Loader2 size={10} className="animate-spin ml-1" />}
              </label>
              <Dropdown
                value={branchId}
                onChange={setBranchId}
                options={branches.map(b => ({ value: b.$id, label: b.name }))}
                disabled={!programId || branchesLoading}
                placeholder={branchesLoading ? "Loading branches…" : !programId ? "Select program first" : "Select your branch"}
                icon={GitBranch}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Progress indicator */}
            <div className="flex gap-1.5 pt-1">
              {[universityId, programId, branchId].map((val, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  val ? "bg-violet-500" : "bg-slate-200 dark:bg-white/10"
                }`} />
              ))}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={!canSubmit}
              whileHover={{ scale: canSubmit ? 1.01 : 1 }}
              whileTap={{ scale: canSubmit ? 0.98 : 1 }}
              className="
                w-full h-11 rounded-xl font-semibold text-sm text-white
                bg-gradient-to-r from-violet-600 to-indigo-600
                hover:from-violet-500 hover:to-indigo-500
                shadow-lg shadow-violet-600/25
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
                flex items-center justify-center gap-2
              "
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Setting up your dashboard…
                </>
              ) : (
                <>
                  Go to Dashboard
                  <Check size={15} />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400 dark:text-slate-500">
            You can change these later in Settings → Academic
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default CompleteProfile
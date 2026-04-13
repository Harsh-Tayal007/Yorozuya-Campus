// src/pages/Home.jsx
import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  FileText, BookOpen, MessageSquare, Layers,
  GraduationCap, Zap, ChevronRight, ChevronDown, Construction,
  Check, X, Eye, EyeOff, ArrowRight, Users,
  ClipboardList, BarChart2, Bell, Shield,
  RefreshCw, Loader2,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { getPublicStats } from "@/services/admin/statsService"
import { Skeleton } from "@/components/ui/skeleton"
import { account } from "@/lib/appwrite"
import {
  resolveLoginEmail,
  generateUsernameCandidate,
  isUsernameAvailable,
} from "@/services/admin/authService"
import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import { getBranchesByProgram } from "@/services/university/branchService"

// ─────────────────────────────────────────────
// Google icon
// ─────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5.1l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-3-11.3-7.3L6 33.8C9.4 39.7 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6.3 5.2C41 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
  </svg>
)

const inputCls = `w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10
  bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm
  placeholder:text-slate-400 dark:placeholder:text-slate-600
  outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition`

// ─────────────────────────────────────────────
// Custom Select — no Radix, no body scroll lock
// Renders its dropdown in-flow (no portal) so it
// never triggers body overflow changes. Shows 4
// items at a time, scrollable, scrollbar hidden.
// ─────────────────────────────────────────────
function NativeSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const selected = options.find(o => o.value === value)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    // Use capture so clicks on other dropdowns also close this one
    document.addEventListener("mousedown", handler, true)
    return () => document.removeEventListener("mousedown", handler, true)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  const ITEM_H = 36   // px per item
  const VISIBLE = 4   // items visible at once

  return (
    <div ref={ref} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full h-10 px-3.5 flex items-center justify-between gap-2
          rounded-xl border text-sm transition-all duration-150 text-left
          ${disabled
            ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
            : "cursor-pointer border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"
          }
          ${open ? "border-blue-500 ring-2 ring-blue-500/10" : ""}
          text-slate-900 dark:text-white`}
      >
        <span className={selected ? "" : "text-slate-400 dark:text-slate-600"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={`flex-shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200
            ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown — in-flow, absolutely positioned relative to trigger */}
      {open && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)]
            rounded-xl border border-slate-200 dark:border-white/10
            bg-white dark:bg-[#0f1b2e]
            shadow-xl shadow-black/20
            overflow-hidden"
          style={{
            zIndex: 99999,
            // Show exactly VISIBLE items, then scroll for the rest
            maxHeight: `${ITEM_H * VISIBLE}px`,
            overflowY: options.length > VISIBLE ? "scroll" : "hidden",
            scrollbarWidth: "none",        // Firefox
            msOverflowStyle: "none",       // IE/Edge
          }}
        >
          <style>{`
            /* Hide webkit scrollbar inside this dropdown */
            .nsel-list::-webkit-scrollbar { display: none; }
          `}</style>
          <div className="nsel-list">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                style={{ height: ITEM_H }}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full px-3.5 flex items-center gap-2 text-sm text-left
                  transition-colors duration-100
                  ${opt.value === value
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
              >
                {opt.value === value && <Check size={12} className="flex-shrink-0 text-blue-500" />}
                <span className={opt.value === value ? "ml-0" : "ml-[20px]"}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Animated background blobs
// ─────────────────────────────────────────────
function AnimatedBlobs() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 520, height: 520,
          top: "-10%", left: "-8%",
          background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(99,102,241,0.06) 60%, transparent 80%)",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 420, height: 420,
          top: "20%", right: "-6%",
          background: "radial-gradient(circle, rgba(99,102,241,0.10) 0%, rgba(139,92,246,0.05) 60%, transparent 80%)",
          filter: "blur(40px)",
        }}
        animate={{ x: [0, -25, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 3 }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 340, height: 340,
          top: "55%", left: "38%",
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, rgba(59,130,246,0.04) 60%, transparent 80%)",
          filter: "blur(50px)",
        }}
        animate={{ x: [0, 20, 0], y: [0, -20, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 6 }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 260, height: 260,
          bottom: "8%", left: "10%",
          background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)",
          filter: "blur(35px)",
        }}
        animate={{ x: [0, 15, 0], y: [0, -15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 9 }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 1 — Account
// ─────────────────────────────────────────────
function AccountStep({ data, setData, onNext }) {
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState("idle")
  const checkTimer = useRef(null)

  useEffect(() => { if (!data.username) generateSuggestion() }, []) // eslint-disable-line

  const generateSuggestion = async () => {
    const candidate = generateUsernameCandidate()
    setData(prev => ({ ...prev, username: candidate }))
    checkAvailability(candidate)
  }

  const checkAvailability = (val) => {
    if (!val || val.length < 3) { setUsernameStatus("idle"); return }
    clearTimeout(checkTimer.current)
    setUsernameStatus("checking")
    checkTimer.current = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(val)
        setUsernameStatus(available ? "available" : "taken")
      } catch { setUsernameStatus("idle") }
    }, 500)
  }

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
    setData(prev => ({ ...prev, username: val }))
    setErrors(prev => ({ ...prev, username: "" }))
    checkAvailability(val)
  }

  const validate = () => {
    const errs = {}
    if (!data.name?.trim() || data.name.trim().length < 2) errs.name = "Name must be at least 2 characters"
    if (!data.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errs.email = "Enter a valid email address"
    if (!data.password || data.password.length < 8) errs.password = "Password must be at least 8 characters"
    if (!data.username || data.username.length < 3) errs.username = "Username must be at least 3 characters"
    else if (usernameStatus === "taken") errs.username = "This username is taken. Pick another or re-roll"
    else if (usernameStatus === "checking") errs.username = "Still checking availability"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleChange = (field) => (e) => {
    setData(prev => ({ ...prev, [field]: e.target.value }))
    setErrors(prev => ({ ...prev, [field]: "" }))
  }

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Create your account</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step 1 of 3 — Basic info</p>
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Full name</label>
        <input className={inputCls} placeholder="John Doe" value={data.name || ""} onChange={handleChange("name")} />
        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Email</label>
        <input className={inputCls} type="email" placeholder="you@example.com" value={data.email || ""} onChange={handleChange("email")} />
        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Password</label>
        <div className="relative">
          <input className={`${inputCls} pr-10`} type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters" value={data.password || ""} onChange={handleChange("password")} />
          <button type="button" onClick={() => setShowPassword(p => !p)} disabled={!data.password}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition disabled:opacity-30">
            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        {data.password && (
          <div className="flex gap-1 mt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                data.password.length >= 8 + i * 4
                  ? i < 1 ? "bg-red-400" : i < 2 ? "bg-yellow-400" : i < 3 ? "bg-blue-400" : "bg-green-400"
                  : "bg-slate-200 dark:bg-white/10"
              }`} />
            ))}
          </div>
        )}
        {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
      </div>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Username</label>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold leading-none
            bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400
            border border-amber-200 dark:border-amber-500/25">permanent</span>
        </div>
        <div className="relative">
          <input className={`${inputCls} pr-14 font-mono`} placeholder="your_username"
            value={data.username || ""} onChange={handleUsernameChange} spellCheck={false} />
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            {usernameStatus === "checking" && <Loader2 size={12} className="animate-spin text-slate-400" />}
            {usernameStatus === "available" && <Check size={12} className="text-green-500" />}
            {usernameStatus === "taken" && <X size={12} className="text-red-500" />}
          </div>
          <button type="button" onClick={generateSuggestion}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition">
            <RefreshCw size={12} />
          </button>
        </div>
        {usernameStatus === "available" && !errors.username && (
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1"><Check size={10} /> Username available</p>
        )}
        {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
        <p className="text-[10px] text-slate-400 dark:text-slate-500">
          Lowercase letters, numbers and underscores only.{" "}
          <span className="text-amber-500 font-medium">This cannot be changed later.</span>
        </p>
      </div>
      <button onClick={() => { if (validate()) onNext() }}
        className="w-full h-10 mt-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
          hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold
          shadow-lg shadow-blue-600/20 transition-all duration-150 flex items-center justify-center gap-2">
        Continue <ChevronRight size={14} />
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 2 — Academic
// ─────────────────────────────────────────────
function AcademicStep({ data, setData, onNext, onBack }) {
  const [universities, setUniversities] = useState([])
  const [programs, setPrograms] = useState([])
  const [branches, setBranches] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => { getUniversities().then(res => setUniversities(res || [])).catch(() => {}) }, [])
  useEffect(() => {
    if (!data.universityId) { setPrograms([]); return }
    getProgramsByUniversity(data.universityId).then(res => setPrograms(res || [])).catch(() => {})
    setData(prev => ({ ...prev, programId: "", branchId: "" }))
  }, [data.universityId]) // eslint-disable-line
  useEffect(() => {
    if (!data.programId) { setBranches([]); return }
    getBranchesByProgram(data.programId).then(res => setBranches(res || [])).catch(() => {})
    setData(prev => ({ ...prev, branchId: "" }))
  }, [data.programId]) // eslint-disable-line

  const selCls = "h-10 text-sm bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Academic details</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step 2 of 3 — Help us personalise your experience</p>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">University</label>
        <NativeSelect
          value={data.universityId || ""}
          onChange={val => setData(prev => ({ ...prev, universityId: val }))}
          options={universities.map(u => ({ value: u.$id, label: u.name }))}
          placeholder="Select university"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Program</label>
        <NativeSelect
          value={data.programId || ""}
          onChange={val => setData(prev => ({ ...prev, programId: val }))}
          options={programs.map(p => ({ value: p.$id, label: p.name }))}
          placeholder="Select program"
          disabled={!data.universityId}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-slate-600 dark:text-slate-300">Branch</label>
        <NativeSelect
          value={data.branchId || ""}
          onChange={val => setData(prev => ({ ...prev, branchId: val }))}
          options={branches.map(b => ({ value: b.$id, label: b.name }))}
          placeholder="Select branch"
          disabled={!data.programId}
        />
      </div>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-white/10
          text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-150">
          Back
        </button>
        <button onClick={() => { if (!data.universityId || !data.programId || !data.branchId) { setError("Please select all fields"); return } setError(null); onNext() }}
          className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold
            shadow-lg shadow-blue-600/20 transition-all duration-150 flex items-center justify-center gap-2">
          Continue <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step 3 — Confirm
// ─────────────────────────────────────────────
function ConfirmStep({ data, universityName, programName, branchName, onBack, onSubmit, loading, error }) {
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [privacyError, setPrivacyError] = useState(false)

  const rows = [
    { label: "Name", value: data.name },
    { label: "Email", value: data.email },
    { label: "Password", value: "••••••••" },
    { label: "Username", value: `@${data.username}` },
    universityName && { label: "University", value: universityName },
    programName && { label: "Program", value: programName },
    branchName && { label: "Branch", value: branchName },
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Almost there!</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step 3 of 3 — Confirm and create</p>
      </div>
      <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3.5 space-y-2">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">{label}</span>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{value}</span>
          </div>
        ))}
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <div onClick={() => { setPrivacyAccepted(p => !p); setPrivacyError(false) }}
          className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center transition-colors duration-150 cursor-pointer
            ${privacyAccepted ? "bg-blue-600 border-blue-600" : privacyError ? "border-red-400 bg-white dark:bg-white/5" : "border-slate-300 dark:border-white/20 bg-white dark:bg-white/5"}`}>
          {privacyAccepted && <Check size={10} className="text-white" />}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          We use cookies and local storage for login sessions, preferences and app features. No tracking or ads.{" "}
          <Link to="/privacy" className="text-blue-500 hover:text-blue-600 underline underline-offset-2">Privacy Policy</Link>
        </span>
      </label>
      {privacyError && <p className="text-xs text-red-500">Please accept the Privacy Policy to continue.</p>}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
          <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={onBack} disabled={loading}
          className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-white/10 text-sm text-slate-600 dark:text-slate-300
            bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-150 disabled:opacity-50">
          Back
        </button>
        <button disabled={loading} onClick={() => { if (!privacyAccepted) { setPrivacyError(true); return } onSubmit() }}
          className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500
            text-white text-sm font-semibold shadow-lg shadow-blue-600/20 transition-all duration-150 disabled:opacity-60
            flex items-center justify-center gap-2">
          {loading
            ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>Creating account</>
            : <>Create account <Check size={13} /></>
          }
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────
const STEP_LABELS = ["Account", "Academic", "Confirm"]
function StepIndicator({ step }) {
  return (
    <div className="flex items-center justify-center mb-5">
      {STEP_LABELS.map((label, idx) => {
        const s = idx + 1
        const isActive = step === s
        const isDone = step > s
        return (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center gap-0.5">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200
                ${isDone ? "bg-green-500 text-white" : isActive ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500"}`}>
                {isDone ? <Check size={12} /> : s}
              </div>
              <span className={`text-[9px] font-medium tracking-wide transition-colors duration-200
                ${isActive ? "text-blue-600 dark:text-blue-400" : isDone ? "text-green-600 dark:text-green-400" : "text-slate-400 dark:text-slate-500"}`}>
                {label}
              </span>
            </div>
            {s < 3 && (
              <div className="w-12 mx-1 mb-3 h-px bg-slate-200 dark:bg-white/10 relative overflow-hidden">
                <div className={`absolute inset-0 bg-green-500 transition-all duration-300 ${isDone ? "opacity-100" : "opacity-0"}`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// Auth Modal
// ─────────────────────────────────────────────
function AuthModal({ open, mode, onClose, onSwitch }) {
  const { login, completeSignup } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [signupData, setSignupData] = useState({ name: "", email: "", password: "", username: "", universityId: "", programId: "", branchId: "" })
  const [universityName, setUniversityName] = useState("")
  const [programName, setProgramName] = useState("")
  const [branchName, setBranchName] = useState("")

  useEffect(() => {
    if (!signupData.universityId) return
    getUniversities().then(list => { const u = list.find(u => u.$id === signupData.universityId); if (u) setUniversityName(u.name) }).catch(() => {})
  }, [signupData.universityId])
  useEffect(() => {
    if (!signupData.programId || !signupData.universityId) return
    getProgramsByUniversity(signupData.universityId).then(list => { const p = list.find(p => p.$id === signupData.programId); if (p) setProgramName(p.name) }).catch(() => {})
  }, [signupData.programId]) // eslint-disable-line
  useEffect(() => {
    if (!signupData.branchId || !signupData.programId) return
    getBranchesByProgram(signupData.programId).then(list => { const b = list.find(b => b.$id === signupData.branchId); if (b) setBranchName(b.name) }).catch(() => {})
  }, [signupData.branchId]) // eslint-disable-line

  const [loginForm, setLoginForm] = useState({ identifier: "", password: "" })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const loginWithGoogle = () => {
    account.createOAuth2Session("google", `${window.location.origin}/oauth/callback`, `${window.location.origin}/`)
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    if (!loginForm.identifier || !loginForm.password) { setError("Please fill in all fields."); return }
    setLoading(true); setError(null)
    try {
      const email = await resolveLoginEmail(loginForm.identifier.trim())
      await login({ email, password: loginForm.password })
      onClose(); navigate("/dashboard")
    } catch (err) {
      setError(err?.message || "Login failed. Check your credentials.")
    } finally { setLoading(false) }
  }

  const handleFinalSubmit = async () => {
    setLoading(true); setError(null)
    try {
      await completeSignup(signupData)
      setSuccess(true)
      navigator.sendBeacon?.("https://unizuya-stats.harshtayal710.workers.dev/track/activity", JSON.stringify({ userId: null, isNewSignup: true }))
      setTimeout(() => { onClose(); navigate("/dashboard") }, 1200)
    } catch (err) {
      setError(err?.message || "Signup failed. Please try again.")
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!open) {
      setStep(1); setLoginForm({ identifier: "", password: "" }); setError(null); setShowPass(false); setSuccess(false)
      setSignupData({ name: "", email: "", password: "", username: "", universityId: "", programId: "", branchId: "" })
      setUniversityName(""); setProgramName(""); setBranchName("")
    }
  }, [open])
  useEffect(() => { setStep(1); setError(null); setShowPass(false); setSuccess(false) }, [mode])

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }} transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-sm max-h-[90vh] overflow-y-auto
                       [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                       bg-white dark:bg-[#0f1b2e]
                       rounded-2xl border border-slate-200 dark:border-white/[0.07] shadow-2xl p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center
              justify-center border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700
              dark:hover:text-white bg-slate-50 dark:bg-white/5 transition-colors">
              <X size={13} />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <GraduationCap size={18} className="text-white" />
              </div>
            </div>

            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-3 py-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                  <Check size={28} className="text-green-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account created!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Taking you to your dashboard...</p>
              </motion.div>
            )}

            {/* LOGIN */}
            {!success && mode === "login" && (
              <>
                <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-1">Welcome back</h2>
                <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-5">Sign in to your account</p>
                <button onClick={loginWithGoogle} className="w-full flex items-center justify-center gap-2.5 h-10 mb-4
                  border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50
                  dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-all shadow-sm">
                  <GoogleIcon /> Continue with Google
                </button>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                  <span className="text-xs text-slate-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                </div>
                <form onSubmit={handleLogin} className="space-y-3">
                  <input className={inputCls} placeholder="Email or username" value={loginForm.identifier}
                    onChange={e => { setLoginForm(f => ({ ...f, identifier: e.target.value })); setError(null) }} />
                  <div className="relative">
                    <input className={`${inputCls} pr-10`} type={showPass ? "text" : "password"}
                      placeholder="Password" value={loginForm.password}
                      onChange={e => { setLoginForm(f => ({ ...f, password: e.target.value })); setError(null) }} />
                    <button type="button" onClick={() => setShowPass(p => !p)} disabled={!loginForm.password}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition disabled:opacity-30">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div className="text-right">
                    <Link to="/forgot-password" onClick={onClose} className="text-xs text-blue-500 hover:text-blue-600 transition">
                      Forgot password?
                    </Link>
                  </div>
                  <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                    We use cookies and local storage for login sessions, preferences and app features. No tracking or ads.{" "}
                    <Link to="/privacy" onClick={onClose} className="text-blue-500 hover:text-blue-600 underline underline-offset-2">Privacy Policy</Link>
                  </p>
                  {error && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
                      <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
                    </div>
                  )}
                  <button type="submit" disabled={loading} className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
                    hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20
                    transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                      </svg>Signing in</> : "Sign in"}
                  </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  Don't have an account?{" "}
                  <button onClick={() => onSwitch("signup")} className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition">
                    Sign up
                  </button>
                </p>
              </>
            )}

            {/* SIGNUP */}
            {!success && mode === "signup" && (
              <>
                {step === 1 && (
                  <>
                    <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-1">Join Unizuya</h2>
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-4">Create your free account</p>
                    <button onClick={loginWithGoogle} className="w-full flex items-center justify-center gap-2.5 h-10 mb-4
                      border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50
                      dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl transition-all shadow-sm">
                      <GoogleIcon /> Continue with Google
                    </button>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                      <span className="text-xs text-slate-400 font-medium">OR</span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                    </div>
                  </>
                )}
                {step > 1 && <StepIndicator step={step} />}
                <AnimatePresence mode="wait">
                  <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }}>
                    {step === 1 && <AccountStep data={signupData} setData={setSignupData} onNext={() => setStep(2)} />}
                    {step === 2 && <AcademicStep data={signupData} setData={setSignupData} onBack={() => setStep(1)} onNext={() => setStep(3)} />}
                    {step === 3 && <ConfirmStep data={signupData} universityName={universityName} programName={programName} branchName={branchName}
                        onBack={() => setStep(2)} onSubmit={handleFinalSubmit} loading={loading} error={error} />}
                  </motion.div>
                </AnimatePresence>
                {step === 1 && (
                  <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <button onClick={() => onSwitch("login")} className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition">
                      Sign in
                    </button>
                  </p>
                )}
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────
// Roadmap Modal
// ─────────────────────────────────────────────
const ROADMAP_DONE = [
  "University, program and branch management", "Syllabus and unit uploads", "PYQ uploads and browsing",
  "Study resource uploads", "Student forum with threaded replies", "User profiles, karma and followers",
  "Bookmarks and saved threads", "Notification system", "Personalised academic dashboard",
  "University notices and events feed", "CGPA and grade calculator", "Study to-do list and task tracker",
  "Class timetable builder", "Shareable link option", "Attendance management tool",
]
const ROADMAP_UPCOMING = ["Direct messages and group chats", "AI-powered study assistant", "Collaborative notes", "Mobile app improvements"]

function RoadmapModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.22 }}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto bg-white dark:bg-[#0f1b2e] rounded-2xl
                       border border-slate-200 dark:border-white/[0.07] shadow-2xl p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center
              justify-center border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700
              dark:hover:text-white bg-slate-50 dark:bg-white/5 transition-colors">
              <X size={13} />
            </button>
            <div className="flex items-center gap-2.5 mb-1">
              <Zap size={15} className="text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Roadmap</h2>
              <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 mr-8">
                Work in progress
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Here's what's shipped and what's coming next.</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Shipped</p>
            <div className="space-y-0.5 mb-5">
              {ROADMAP_DONE.map(item => (
                <div key={item} className="flex items-center gap-2.5 py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500 bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 line-through opacity-70">{item}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">Coming up</p>
            <div className="space-y-0.5">
              {ROADMAP_UPCOMING.map(item => (
                <div key={item} className="flex items-center justify-between gap-2 py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-white/20 flex-shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">{item}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 opacity-50 flex-shrink-0">upcoming</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─────────────────────────────────────────────
// Features data
// ─────────────────────────────────────────────
const FEATURES = [
  { icon: FileText,      color: "bg-orange-500/10 text-orange-500", title: "Past year questions",         desc: "Browse PYQs sorted by university, course and subject. Stop digging through old drives and group chats." },
  { icon: BookOpen,      color: "bg-blue-500/10 text-blue-500",     title: "Syllabus and notes",          desc: "View your course syllabus, upload notes and download what others have shared, all in one spot." },
  { icon: MessageSquare, color: "bg-indigo-500/10 text-indigo-500", title: "Student forum",               desc: "Ask questions, get answers and have proper threaded discussions with students from your uni and beyond." },
  { icon: Layers,        color: "bg-emerald-500/10 text-emerald-500",title: "University-specific content",desc: "Content is filtered to your university and branch. No noise from courses that don't apply to you." },
  { icon: ClipboardList, color: "bg-pink-500/10 text-pink-500",     title: "Attendance tracker",          desc: "Log attendance using a token system. See exactly where you stand before exams catch you off guard." },
  { icon: BarChart2,     color: "bg-amber-500/10 text-amber-500",   title: "Academic tools",              desc: "CGPA calculator, timetable builder and a task tracker. The essentials that actually save time every semester." },
]

// ─────────────────────────────────────────────
// Redesigned Footer — matches HTML artifact
// ─────────────────────────────────────────────
function SiteFooter({ onOpenAuth }) {
  const { currentUser } = useAuth()

  const PLATFORM_LINKS = [
    { label: "Home", to: "/" },
    { label: "Forum", to: "/forum" },
    { label: "Universities", to: "/universities" },
    { label: "Resources", to: "/universities" },
    { label: "PYQs", to: "/universities" },
  ]

  return (
    <footer className="relative mt-16">
      {/* Gradient fade */}
      <div className="h-16 bg-gradient-to-b from-transparent via-slate-100/80 to-slate-100 dark:via-[#0a1120]/80 dark:to-[#0a1120] pointer-events-none" />

      <div className="bg-slate-100 dark:bg-[#0a1120] border-t border-slate-200/70 dark:border-white/[0.05]">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="col-span-2">
              <Link to="/" className="inline-block mb-3">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                  Unizuya
                </span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                An academic platform for students to access syllabus, past year questions, study resources and a
                student forum. Includes attendance management and productivity tools to simplify academic life.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20">
                <Construction size={11} className="text-amber-500" />
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Active development</span>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5">
                {PLATFORM_LINKS.map(link => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-4">
                Account
              </h4>
              <ul className="space-y-2.5">
                {currentUser ? (
                  <>
                    {[
                      { label: "Dashboard", to: "/dashboard" },
                      { label: "Profile", to: `/profile/${currentUser.username}` },
                      { label: "Settings", to: "/dashboard/settings" },
                    ].map(link => (
                      <li key={link.label}>
                        <Link to={link.to} className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </>
                ) : (
                  <>
                    <li>
                      <button onClick={() => onOpenAuth("login")} className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">
                        Login
                      </button>
                    </li>
                    <li>
                      <button onClick={() => onOpenAuth("signup")} className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">
                        Sign up
                      </button>
                    </li>
                    <li>
                      <Link to="/privacy" className="text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">
                        Privacy Policy
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-slate-200/60 dark:border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} Unizuya. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-xs text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150">
                Privacy Policy
              </Link>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <p className="text-xs text-slate-400 dark:text-slate-500">Built for students, by students</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.52, delay, ease: "easeOut" },
})

// ─────────────────────────────────────────────
// Main Home
// ─────────────────────────────────────────────
export default function Home() {
  const { currentUser, isLoading: authLoading } = useAuth()
  const [authModal, setAuthModal] = useState({ open: false, mode: "signup" })
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const featuresRef = useRef(null)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: getPublicStats,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  })

  const openAuth = (mode = "signup") => setAuthModal({ open: true, mode })
  const closeAuth = () => setAuthModal(a => ({ ...a, open: false }))
  const switchAuth = (mode) => setAuthModal({ open: true, mode })

  const scrollToFeatures = () => featuresRef.current?.scrollIntoView({ behavior: "smooth" })

  return (
    <div className="min-h-screen flex flex-col">

      <AnimatedBlobs />

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-16">

        {/* ── HERO — matching HTML artifact layout ── */}
        <section className="pt-10 text-center space-y-6">
          <motion.div {...fadeUp(0)} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                            border border-amber-400/35 bg-amber-400/8 text-amber-500 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Work in progress — more coming soon
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.07)} className="space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.12] tracking-tight">
              Your campus life,<br />
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                all in one place
              </span>
            </h1>
            <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Unizuya brings together syllabus, past year questions, study resources and a student forum so
              you spend less time hunting for things and more time actually studying.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.14)} className="flex flex-wrap justify-center gap-3">
            {authLoading ? (
              <Skeleton className="h-11 w-40 rounded-xl" />
            ) : currentUser ? (
              <Link to="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                           bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                           text-sm font-semibold shadow-lg shadow-blue-500/25
                           hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
                Go to Dashboard <ChevronRight size={14} />
              </Link>
            ) : (
              <>
                <button onClick={() => openAuth("signup")}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                             text-sm font-semibold shadow-lg shadow-blue-500/25
                             hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
                  Join for free <ChevronRight size={14} />
                </button>
                <button onClick={scrollToFeatures}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             border border-border bg-background/80 text-sm font-medium text-foreground
                             hover:bg-muted hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
                  See what's inside
                </button>
              </>
            )}
          </motion.div>
        </section>

        {/* ── STATS ── */}
        <motion.section {...fadeUp(0.18)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: stats?.syllabus,  label: "Syllabus items" },
              { value: stats?.units,     label: "Units covered" },
              { value: stats?.resources, label: "Study resources" },
              { value: stats?.pyqs,      label: "Past year papers" },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/8
                                         rounded-2xl px-4 py-5 text-center shadow-sm">
                {statsLoading ? (
                  <><Skeleton className="h-7 w-14 mx-auto mb-2 rounded-lg" /><Skeleton className="h-3 w-16 mx-auto rounded" /></>
                ) : (
                  <><p className="text-2xl font-bold text-foreground tabular-nums">{value ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p></>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── WHAT IS UNIZUYA — matching HTML artifact: left text + right visual card ── */}
        <motion.section {...fadeUp(0.22)} id="about">
          <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 items-start">

            {/* Left: label + big heading + text */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">
                What is Unizuya?
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-5 leading-tight">
                One platform, everything you need
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The name is inspired by the idea of a one-stop shop that handles many different
                  needs, like that one place in the neighbourhood that somehow does it all.
                </p>
                <p>
                  Students switch between four or five different platforms just to find syllabus,
                  past papers, notes and a place to ask questions. Unizuya puts all of that in one
                  spot, organised by university, branch and course.
                </p>
                <p>
                  Think of it as your academic companion, built by students who were tired of the
                  same scattered mess.
                </p>
              </div>
            </div>

            {/* Right: visual checklist card */}
            <div className="rounded-2xl p-6 sm:p-7"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(99,102,241,0.11) 100%)",
                border: "1px solid rgba(99,102,241,0.18)",
              }}>
              {[
                "Syllabus and unit notes",
                "Past year questions",
                "Uploadable study resources",
                "Student discussion forum",
                "CGPA and grade calculator",
                "Attendance tracking",
                "University notices and events",
              ].map((item, i) => (
                <div key={item} className={`flex items-center gap-3 py-2.5 text-sm text-foreground
                  ${i < 6 ? "border-b border-indigo-200/30 dark:border-white/[0.06]" : ""}`}>
                  <div className="w-5 h-5 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-indigo-500" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── FEATURES — matching HTML artifact: centered label + big heading + 3-col grid ── */}
        <section ref={featuresRef}>
          <motion.div {...fadeUp(0.26)} className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
              What you can do
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Built around how students actually work
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map(({ icon: Icon, color, title, desc }, i) => (
              <motion.div key={title} {...fadeUp(0.28 + i * 0.04)}>
                <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/8
                                rounded-2xl p-5 h-full shadow-sm
                                hover:border-indigo-400/40 hover:-translate-y-0.5
                                hover:shadow-[0_4px_24px_rgba(99,102,241,0.08)]
                                transition-all duration-300 group">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}
                                   group-hover:scale-110 transition-transform duration-200`}>
                    <Icon size={17} />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── ROADMAP TRIGGER ── */}
        <motion.div {...fadeUp(0.44)} className="flex justify-center">
          <button onClick={() => setRoadmapOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                       border border-border bg-white dark:bg-white/[0.03] shadow-sm
                       text-sm text-muted-foreground hover:text-foreground
                       hover:border-indigo-400/50 hover:shadow-md transition-all duration-200">
            <Zap size={13} className="text-indigo-500" />
            View roadmap — see what's done and what's next
            <ChevronRight size={13} />
          </button>
        </motion.div>

        {/* ── CTA — only shown to guests ── */}
        {!authLoading && !currentUser && (
          <motion.section {...fadeUp(0.46)}>
            <div className="rounded-2xl overflow-hidden relative"
              style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #312e81 100%)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {/* Inner blobs */}
              <div className="absolute top-[-50px] right-[-50px] w-[180px] h-[180px] rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
              <div className="absolute bottom-[-40px] left-[-40px] w-[150px] h-[150px] rounded-full bg-white/[0.03] blur-xl pointer-events-none" />

              <div className="relative z-10 px-6 sm:px-12 py-12 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/60 mb-5">
                  <Users size={11} /> Built for students, by students
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                  Ready to make campus life a little less chaotic?
                </h2>
                <p className="text-sm text-white/60 mb-7 max-w-md mx-auto leading-relaxed">
                  Join students who've already ditched the scattered approach. Everything you need, one place, no signup fees.
                </p>
                <div className="flex flex-wrap gap-5 justify-center mb-8">
                  {[
                    { icon: Shield, label: "Free to join" },
                    { icon: Bell,   label: "No ads, no tracking" },
                    { icon: Zap,    label: "Growing every week" },
                    { icon: Users,  label: "Built by students" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 flex-shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
                <button onClick={() => openAuth("signup")}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-[#312e81]
                             text-sm font-bold hover:bg-white/90 hover:scale-[1.02]
                             active:scale-[0.98] transition-all duration-150 shadow-lg">
                  Create a free account <ArrowRight size={14} />
                </button>
                <p className="mt-4 text-xs text-white/30">
                  Already have an account?{" "}
                  <button onClick={() => openAuth("login")} className="text-blue-400/70 hover:text-blue-300 transition underline underline-offset-2">
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </motion.section>
        )}

      </div>

      <SiteFooter onOpenAuth={openAuth} />

      <AuthModal open={authModal.open} mode={authModal.mode} onClose={closeAuth} onSwitch={switchAuth} />
      <RoadmapModal open={roadmapOpen} onClose={() => setRoadmapOpen(false)} />
    </div>
  )
}
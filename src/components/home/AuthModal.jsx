// src/components/home/AuthModal.jsx
// Downloaded only when the user actually clicks Login / Sign up
import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"
import {
  GraduationCap, X, Check, Eye, EyeOff, ChevronRight,
  ChevronDown, Loader2, RefreshCw,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { account } from "@/lib/appwrite"
import {
  resolveLoginEmail,
  generateUsernameCandidate,
  isUsernameAvailable,
} from "@/services/admin/authService"
import { getUniversities }       from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import { getBranchesByProgram }   from "@/services/university/branchService"

// ── Shared ──────────────────────────────────────────────
const inputCls = `w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-white/10
  bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white text-sm
  placeholder:text-slate-400 dark:placeholder:text-slate-600
  outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition`

const GoogleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5.1l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-3-11.3-7.3L6 33.8C9.4 39.7 16.2 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6.3 5.2C41 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
  </svg>
)

// ── NativeSelect ─────────────────────────────────────────
function NativeSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value)
  const ITEM_H = 36, VISIBLE = 4

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener("mousedown", h, true)
    return () => document.removeEventListener("mousedown", h, true)
  }, [open])

  useEffect(() => {
    if (!open) return
    const h = (e) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", h)
    return () => document.removeEventListener("keydown", h)
  }, [open])

  return (
    <div ref={ref} className="relative w-full">
      <button type="button" disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full h-10 px-3.5 flex items-center justify-between gap-2
          rounded-xl border text-sm transition-all duration-150 text-left
          ${disabled ? "opacity-40 cursor-not-allowed border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
            : "cursor-pointer border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/20"}
          ${open ? "border-blue-500 ring-2 ring-blue-500/10" : ""}
          text-slate-900 dark:text-white`}>
        <span className={selected ? "" : "text-slate-400 dark:text-slate-600"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={14} className={`flex-shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] rounded-xl border
          border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f1b2e]
          shadow-xl shadow-black/20 overflow-hidden"
          style={{ zIndex: 99999, maxHeight: `${ITEM_H * VISIBLE}px`,
            overflowY: options.length > VISIBLE ? "scroll" : "hidden",
            scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {options.map(opt => (
            <button key={opt.value} type="button" style={{ height: ITEM_H }}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full px-3.5 flex items-center gap-2 text-sm text-left transition-colors duration-100
                ${opt.value === value
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5"}`}>
              {opt.value === value && <Check size={12} className="flex-shrink-0 text-blue-500" />}
              <span className={opt.value === value ? "ml-0" : "ml-[20px]"}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Step Indicator ────────────────────────────────────────
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

// ── Account Step ──────────────────────────────────────────
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
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step 1 of 3 - Basic info</p>
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
            {usernameStatus === "checking"  && <Loader2 size={12} className="animate-spin text-slate-400" />}
            {usernameStatus === "available" && <Check size={12} className="text-green-500" />}
            {usernameStatus === "taken"     && <X size={12} className="text-red-500" />}
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

// ── Academic Step ─────────────────────────────────────────
function AcademicStep({ data, setData, onNext, onBack }) {
  const [universities, setUniversities] = useState([])
  const [programs, setPrograms]         = useState([])
  const [branches, setBranches]         = useState([])
  const [error, setError]               = useState(null)

  useEffect(() => { getUniversities().then(r => setUniversities(r || [])).catch(() => {}) }, [])
  useEffect(() => {
    if (!data.universityId) { setPrograms([]); return }
    getProgramsByUniversity(data.universityId).then(r => setPrograms(r || [])).catch(() => {})
    setData(prev => ({ ...prev, programId: "", branchId: "" }))
  }, [data.universityId]) // eslint-disable-line
  useEffect(() => {
    if (!data.programId) { setBranches([]); return }
    getBranchesByProgram(data.programId).then(r => setBranches(r || [])).catch(() => {})
    setData(prev => ({ ...prev, branchId: "" }))
  }, [data.programId]) // eslint-disable-line

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Academic details</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step 2 of 3 - Help us personalise your experience</p>
      </div>
      {[
        { label: "University", value: data.universityId, key: "universityId", options: universities.map(u => ({ value: u.$id, label: u.name })), placeholder: "Select university", disabled: false },
        { label: "Program",    value: data.programId,    key: "programId",    options: programs.map(p => ({ value: p.$id, label: p.name })),     placeholder: "Select program",    disabled: !data.universityId },
        { label: "Branch",     value: data.branchId,     key: "branchId",     options: branches.map(b => ({ value: b.$id, label: b.name })),     placeholder: "Select branch",     disabled: !data.programId },
      ].map(({ label, value, key, options, placeholder, disabled }) => (
        <div key={key} className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
          <NativeSelect value={value || ""} onChange={val => setData(prev => ({ ...prev, [key]: val }))}
            options={options} placeholder={placeholder} disabled={disabled} />
        </div>
      ))}
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button onClick={onBack} className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-white/10
          text-sm text-slate-600 dark:text-slate-300 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-150">
          Back
        </button>
        <button onClick={() => {
          if (!data.universityId || !data.programId || !data.branchId) { setError("Please select all fields"); return }
          setError(null); onNext()
        }} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
          hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold
          shadow-lg shadow-blue-600/20 transition-all duration-150 flex items-center justify-center gap-2">
          Continue <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

// ── Confirm Step ──────────────────────────────────────────
function ConfirmStep({ data, universityName, programName, branchName, onBack, onSubmit, loading, error }) {
  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [privacyError, setPrivacyError]       = useState(false)

  const rows = [
    { label: "Name",       value: data.name },
    { label: "Email",      value: data.email },
    { label: "Password",   value: "********" },
    { label: "Username",   value: `@${data.username}` },
    universityName && { label: "University", value: universityName },
    programName    && { label: "Program",    value: programName },
    branchName     && { label: "Branch",     value: branchName },
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Almost there!</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step 3 of 3 - Confirm and create</p>
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
            ${privacyAccepted ? "bg-blue-600 border-blue-600"
              : privacyError ? "border-red-400 bg-white dark:bg-white/5"
              : "border-slate-300 dark:border-white/20 bg-white dark:bg-white/5"}`}>
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
            : <>Create account <Check size={13} /></>}
        </button>
      </div>
    </div>
  )
}

// ── AuthModal (default export) ────────────────────────────
export default function AuthModal({ open, mode, onClose, onSwitch }) {
  const { login, completeSignup } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [signupData, setSignupData] = useState({
    name: "", email: "", password: "", username: "",
    universityId: "", programId: "", branchId: "",
  })
  const [universityName, setUniversityName] = useState("")
  const [programName, setProgramName]       = useState("")
  const [branchName, setBranchName]         = useState("")
  const [loginForm, setLoginForm]           = useState({ identifier: "", password: "" })
  const [showPass, setShowPass]             = useState(false)
  const [loading, setLoading]               = useState(false)
  const [error, setError]                   = useState(null)
  const [success, setSuccess]               = useState(false)

  // Resolve display names for confirm step
  useEffect(() => {
    if (!signupData.universityId) return
    getUniversities().then(list => {
      const u = list.find(u => u.$id === signupData.universityId)
      if (u) setUniversityName(u.name)
    }).catch(() => {})
  }, [signupData.universityId])

  useEffect(() => {
    if (!signupData.programId || !signupData.universityId) return
    getProgramsByUniversity(signupData.universityId).then(list => {
      const p = list.find(p => p.$id === signupData.programId)
      if (p) setProgramName(p.name)
    }).catch(() => {})
  }, [signupData.programId]) // eslint-disable-line

  useEffect(() => {
    if (!signupData.branchId || !signupData.programId) return
    getBranchesByProgram(signupData.programId).then(list => {
      const b = list.find(b => b.$id === signupData.branchId)
      if (b) setBranchName(b.name)
    }).catch(() => {})
  }, [signupData.branchId]) // eslint-disable-line

  const loginWithGoogle = () => {
    account.createOAuth2Session(
      "google",
      `${window.location.origin}/oauth/callback`,
      `${window.location.origin}/`,
    )
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
      navigator.sendBeacon?.(
        "https://unizuya-stats.harshtayal710.workers.dev/track/activity",
        JSON.stringify({ userId: null, isNewSignup: true }),
      )
      setTimeout(() => { onClose(); navigate("/dashboard") }, 1200)
    } catch (err) {
      setError(err?.message || "Signup failed. Please try again.")
    } finally { setLoading(false) }
  }

  // Reset on close / mode switch
  useEffect(() => {
    if (!open) {
      setStep(1); setLoginForm({ identifier: "", password: "" }); setError(null)
      setShowPass(false); setSuccess(false)
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
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="w-full max-w-sm max-h-[90vh] overflow-y-auto
                       [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                       bg-white dark:bg-[#0f1b2e] rounded-2xl
                       border border-slate-200 dark:border-white/[0.07] shadow-2xl p-6 relative">

            <button onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center
                justify-center border border-slate-200 dark:border-white/10 text-slate-400
                hover:text-slate-700 dark:hover:text-white bg-slate-50 dark:bg-white/5 transition-colors">
              <X size={13} />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                flex items-center justify-center shadow-lg shadow-blue-500/30">
                <GraduationCap size={18} className="text-white" />
              </div>
            </div>

            {/* Success */}
            {success && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-3 py-4">
                <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                  <Check size={28} className="text-green-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Account created!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">Taking you to your dashboard...</p>
              </motion.div>
            )}

            {/* Login */}
            {!success && mode === "login" && (
              <>
                <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-1">Welcome back</h2>
                <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-5">Sign in to your account</p>
                <button onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center gap-2.5 h-10 mb-4
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
                    <Link to="/privacy" onClick={onClose} className="text-blue-500 hover:text-blue-600 underline underline-offset-2">
                      Privacy Policy
                    </Link>
                  </p>
                  {error && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
                      <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
                    </div>
                  )}
                  <button type="submit" disabled={loading}
                    className="w-full h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600
                      hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/20
                      transition-all duration-150 disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading
                      ? <><svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>Signing in</>
                      : "Sign in"}
                  </button>
                </form>
                <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  Don't have an account?{" "}
                  <button onClick={() => onSwitch("signup")}
                    className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition">
                    Sign up
                  </button>
                </p>
              </>
            )}

            {/* Signup */}
            {!success && mode === "signup" && (
              <>
                {step === 1 && (
                  <>
                    <h2 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-1">Join Unizuya</h2>
                    <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-4">Create your free account</p>
                    <button onClick={loginWithGoogle}
                      className="w-full flex items-center justify-center gap-2.5 h-10 mb-4
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
                    {step === 3 && (
                      <ConfirmStep data={signupData}
                        universityName={universityName} programName={programName} branchName={branchName}
                        onBack={() => setStep(2)} onSubmit={handleFinalSubmit} loading={loading} error={error} />
                    )}
                  </motion.div>
                </AnimatePresence>
                {step === 1 && (
                  <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <button onClick={() => onSwitch("login")}
                      className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition">
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
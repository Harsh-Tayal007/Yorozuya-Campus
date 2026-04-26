import React, { useState, useRef, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Camera, Loader2, ChevronDown, ChevronRight, Check,
  User, GraduationCap, BookOpen, GitBranch,
  Mail, Lock, Moon, Sun, Bell, Shield, Eye, EyeOff,
  KeyRound, AlertCircle,
  Trash2, AtSign, RefreshCw,
  X, Sparkles, Orbit, Shapes, Globe, Target, LayoutGrid,
  Palette, Zap, MonitorSmartphone, Laptop2, LockKeyhole,
  Wind, Info, Bot, Volume2, VolumeX, Keyboard
} from "lucide-react"
import { useUIPrefs } from "@/context/UIPrefsContext"
import ReportUIIssueButton from "@/components/ui/ReportUIIssueButton"

import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import { getBranchesByProgram } from "@/services/university/branchService"
import { uploadAvatar } from "@/services/user/profileService"
import { account, functions, databases, Query } from "@/lib/appwrite"
import { DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID } from "@/config/appwrite"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { usePush } from "@/context/PushNotificationContext"
import DeleteAccountModal from "@/components/modals/DeleteAccountModal"
import { deleteAccountPermanently } from "@/services/user/deleteAccountService"


import { changeUsername } from "@/services/user/changeUsernameService"
import { generateUsernameCandidate, isUsernameAvailable } from "@/services/admin/authService"
import { upsertSavedAccount } from "@/lib/savedAccounts"
import AssetCacheManager from "@/mascot/AssetCacheManager"

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" }, { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" }, { value: "4", label: "4th Year" },
  { value: "PG", label: "Post Graduate" },
]

const TABS = [
  { key: "profile",        label: "Profile",        icon: User },
  { key: "account",        label: "Account",         icon: Shield },
  { key: "academic",       label: "Academic",        icon: GraduationCap },
  { key: "preferences",    label: "Preferences",     icon: Bell },
  { key: "customization",  label: "Customization",   icon: Palette },
  { key: "mascot",         label: "Mascot",          icon: Bot },
]

// ── Reusable primitives ───────────────────────────────────────────────────────

const Field = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    {label && <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>}
    {children}
    {hint && <p className="text-xs text-muted-foreground/60">{hint}</p>}
  </div>
)

const Input = ({ value, onChange, type = "text", maxLength, placeholder, disabled, right }) => (
  <div className="relative">
    <input value={value} onChange={onChange} type={type} maxLength={maxLength} placeholder={placeholder} disabled={disabled}
      className={`w-full rounded-xl border border-border bg-background px-3.5 py-2.5
                 text-sm text-foreground placeholder:text-muted-foreground/60
                 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                 hover:border-primary/40 disabled:opacity-50 disabled:cursor-not-allowed
                 transition-all duration-150 ${right ? "pr-10" : ""}`} />
    {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
  </div>
)

const Textarea = ({ value, onChange, maxLength, rows = 3, placeholder }) => (
  <textarea value={value} onChange={onChange} maxLength={maxLength} rows={rows} placeholder={placeholder}
    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5
               text-sm text-foreground placeholder:text-muted-foreground/60
               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
               hover:border-primary/40 transition-all duration-150 resize-none" />
)

const Dropdown = ({ value, onChange, options, disabled, placeholder }) => {
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
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(v => !v)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl
                    border text-sm text-left transition-all duration-150 outline-none cursor-target
                    ${disabled ? "border-border/40 bg-muted/20 text-muted-foreground/50 cursor-not-allowed"
            : open ? "border-primary bg-background ring-2 ring-primary/20"
              : "border-border bg-background hover:border-primary/40"}`}>
        <span className={selected ? "text-foreground" : "text-muted-foreground/60"}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={14} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && !disabled && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1.5 w-full z-[200] rounded-xl border border-border
                       bg-background shadow-xl overflow-hidden origin-top">
            <div className="max-h-48 overflow-y-auto">
              {options.length === 0
                ? <p className="px-4 py-3 text-sm text-muted-foreground">No options available</p>
                : options.map(opt => (
                  <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm
                                transition-colors hover:bg-muted text-left cursor-target
                                ${opt.value === value ? "text-primary font-semibold bg-primary/5" : "text-foreground"}`}>
                    {opt.label}
                    {opt.value === value && <Check size={13} className="text-primary shrink-0" />}
                  </button>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const Toggle = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-target ${checked ? "bg-primary" : "bg-border"}`}>
    <motion.div animate={{ x: checked ? 20 : 2 }} transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
  </button>
)

const SaveBtn = ({ saving, disabled, label = "Save changes", onClick, type = "submit" }) => (
  <motion.button type={type} onClick={onClick} disabled={saving || disabled}
    whileHover={{ scale: (saving || disabled) ? 1 : 1.01 }}
    whileTap={{ scale: (saving || disabled) ? 1 : 0.98 }}
    transition={{ type: "spring", stiffness: 400, damping: 20 }}
    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl
               bg-primary text-primary-foreground text-sm font-semibold
               hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed
               transition-colors duration-150 shadow-sm cursor-target">
    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : label}
  </motion.button>
)

const Section = ({ title, children }) => (
  <div className="space-y-1 mb-6">
    {title && <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</p>}
    <div className="rounded-2xl border border-border bg-card px-4">{children}</div>
  </div>
)

const PrefRow = ({ icon: Icon, label, hint, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 border-b border-border/50 last:border-0 gap-3">
    <div className="flex items-start gap-3 min-w-0">
      {Icon && <Icon size={15} className="text-muted-foreground mt-0.5 shrink-0" />}
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate sm:whitespace-normal">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{hint}</p>}
      </div>
    </div>
    <div className="shrink-0 self-end sm:self-auto">
      {children}
    </div>
  </div>
)

const InlineForm = ({ open, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
        <div className="pb-4 pt-1 space-y-3 border-b border-border/50">{children}</div>
      </motion.div>
    )}
  </AnimatePresence>
)

const AccountRow = ({ icon: Icon, label, value, formKey, activeForm, setActiveForm, children, disabled, disabledReason }) => {
  const isOpen = activeForm === formKey
  return (
    <div className="border-b border-border/50 last:border-0">
      <button type="button"
        disabled={disabled}
        onClick={() => !disabled && setActiveForm(isOpen ? null : formKey)}
        className={`flex items-center justify-between w-full py-3.5 transition-colors
                   rounded-lg px-1 -mx-1 group cursor-target
                   ${disabled ? "cursor-not-allowed opacity-60" : "hover:text-primary"}`}>
        <div className="flex items-center gap-3">
          {Icon && <Icon size={15} className={`text-muted-foreground transition-colors ${!disabled ? "group-hover:text-primary" : ""}`} />}
          <div className="text-left">
            <span className={`text-sm font-medium text-foreground transition-colors ${!disabled ? "group-hover:text-primary" : ""}`}>{label}</span>
            {disabled && disabledReason && (
              <p className="text-xs text-muted-foreground mt-0.5">{disabledReason}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {value && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{value}</span>}
          {!disabled && (
            <ChevronRight size={14}
              className={`text-muted-foreground transition-all duration-200 shrink-0 ${isOpen ? "rotate-90 text-primary" : "group-hover:text-primary"}`} />
          )}
        </div>
      </button>
      <InlineForm open={isOpen && !disabled}>{children}</InlineForm>
    </div>
  )
}

// ── OAuth provider badge ──────────────────────────────────────────────────────
const OAuthBadge = ({ provider }) => {
  const providerMap = {
    google: { label: "Google", color: "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" },
    github: { label: "GitHub", color: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-white/10 dark:text-slate-300 dark:border-white/10" },
  }
  const info = providerMap[provider?.toLowerCase()] ?? { label: provider, color: "bg-muted text-muted-foreground border-border" }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${info.color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      Signed in with {info.label}
    </span>
  )
}

// =============================================================================
// TAB: PROFILE
// =============================================================================
const ProfileTab = ({ user, updateProfile, queryClient, navigate }) => {
  const isTeacher = user?.accountType === "teacher" || user?.role === "teacher"
  const fileInputRef = useRef(null)
  const [name, setName] = useState(user?.name || "")
  const [bio, setBio] = useState(user?.bio || "")
  const [yearOfStudy, setYearOfStudy] = useState(user?.yearOfStudy || "")
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error("Profile picture must be under 5MB"); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error("Please enter a valid name"); return }
    try {
      setSaving(true)
      let newAvatarUrl = user?.avatarUrl ?? null
      let newAvatarPublicId = user?.avatarPublicId ?? null
      if (avatarFile) {
        const uploaded = await uploadAvatar(avatarFile)
        newAvatarUrl = uploaded.avatarUrl
        newAvatarPublicId = uploaded.avatarPublicId
      }
      await updateProfile({
        name: name.trim(), bio, yearOfStudy: isTeacher ? null : yearOfStudy,
        avatarUrl: newAvatarUrl, avatarPublicId: newAvatarPublicId,
        oldAvatarPublicId: user?.avatarPublicId ?? null,
      })
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.username] })
      toast.success("Profile details saved successfully")
    } catch (err) {
      console.error(err)
      toast.error("Couldn't save profile. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Section>
        <div className="flex items-center gap-4 py-4 border-b border-border/50">
          <div className="relative shrink-0 group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar"
                className="w-14 h-14 rounded-full object-cover border-2 border-border group-hover:border-primary/50 transition-colors" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10
                              border-2 border-border group-hover:border-primary/50 flex items-center
                              justify-center text-xl font-bold text-primary transition-colors">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-background
                         flex items-center justify-center text-primary-foreground hover:bg-primary/90 active:scale-90 transition-all cursor-target">
              <Camera size={11} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground mb-1">@{user?.username}</p>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary hover:text-primary/80 transition-colors cursor-target">Change photo</button>
          </div>
        </div>
        <div className="py-3.5 border-b border-border/50 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Display Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} maxLength={64} placeholder="Your name" />
        </div>
        <div className="py-3.5 border-b border-border/50 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Bio</label>
          <Textarea value={bio} onChange={e => setBio(e.target.value)} maxLength={160} rows={3} placeholder="Tell others about yourself…" />
          <p className="text-xs text-muted-foreground/60 text-right">{bio.length}/160</p>
        </div>
        {!isTeacher && (
          <div className="py-3.5 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year of Study</label>
            <Dropdown value={yearOfStudy} onChange={setYearOfStudy} options={YEAR_OPTIONS} placeholder="Select year" />
          </div>
        )}
      </Section>
      <div className="flex justify-end"><SaveBtn saving={saving} label="Save Profile" /></div>
    </form>
  )
}

// =============================================================================
// TAB: ACCOUNT  (OAuth detection + set/change password + forgot password)
// =============================================================================
// ─────────────────────────────────────────────────────────────────────────────
//
// New additions vs original:
//   1. changeUsername service call + Worker cascade
//   2. Username AccountRow with availability check + re-roll
//   3. Pulls refreshUser from AuthContext + upsertSavedAccount from vault
// ─────────────────────────────────────────────────────────────────────────────

const AccountTab = ({ user }) => {
  const navigate = useNavigate()
  const { logout, refreshUser } = useAuth()
  const queryClient = useQueryClient()

  const [activeForm, setActiveForm] = useState(null)

  // ── Email / password form state ───────────────────────────────────────────
  const [email, setEmail]           = useState("")
  const [password, setPassword]     = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [showPass, setShowPass]     = useState(false)
  const [showNew, setShowNew]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [saving, setSaving]         = useState(false)

  // ── Username change state ─────────────────────────────────────────────────
  const [newUsername, setNewUsername]       = useState("")
  const [usernameStatus, setUsernameStatus] = useState("idle") // idle|checking|available|taken
  const checkTimerRef                       = useRef(null)

  const handleUsernameInput = (val) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, "")
    setNewUsername(clean)
    setUsernameStatus("idle")
    clearTimeout(checkTimerRef.current)
    if (clean.length < 3) return
    setUsernameStatus("checking")
    checkTimerRef.current = setTimeout(async () => {
      try {
        const ok = await isUsernameAvailable(clean)
        setUsernameStatus(ok ? "available" : "taken")
      } catch {
        setUsernameStatus("idle")
      }
    }, 500)
  }

  const rollUsername = () => {
    const candidate = generateUsernameCandidate()
    handleUsernameInput(candidate)
  }

  const handleUsernameSubmit = async (e) => {
  e.preventDefault()
  if (!newUsername || newUsername.length < 3) { toast.error("Username must be at least 3 characters"); return }
  if (usernameStatus === "taken")     { toast.error("That username is already taken"); return }
  if (usernameStatus === "checking")  { toast.error("Still checking availability, please wait"); return }
  if (usernameStatus !== "available") { toast.error("Enter a valid available username"); return }
 
  try {
    setSaving(true)
    const result = await changeUsername(newUsername)
 
    // Wait 600ms for Appwrite write to propagate before re-fetching
    await new Promise(resolve => setTimeout(resolve, 600))
 
    // Re-fetch full profile - navbar username updates from this
    await refreshUser()
 
    // Bust the user-avatar query cache so ThreadCard/ThreadDetail
    // re-fetch the new username on next render
    queryClient.invalidateQueries({ queryKey: ["user-avatar", user.$id] })
 
    // Sync saved accounts vault
    upsertSavedAccount({
      userId:    user.$id,
      name:      user.name,
      username:  newUsername,
      email:     user.email,
      avatarUrl: user.avatarUrl ?? null,
      provider:  null,
    })
 
    toast.success(`Username changed to @${result.newUsername}`, {
      description: `Updated across reports and ban records.`,
      duration: 5000,
    })
 
    setActiveForm(null)
    setNewUsername("")
    setUsernameStatus("idle")
  } catch (err) {
    toast.error(err.message ?? "Failed to change username")
  } finally {
    setSaving(false)
  }
}

  // ── Delete modal state ────────────────────────────────────────────────────
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  // ── OAuth detection ───────────────────────────────────────────────────────
  const [oauthProvider, setOauthProvider] = useState(null)
  const [hasPassword, setHasPassword]     = useState(false)
  const [identityLoading, setIdentityLoading] = useState(true)

  useEffect(() => {
    const detect = async () => {
      try {
        const identities = await account.listIdentities()
        if (identities.total > 0) setOauthProvider(identities.identities[0].provider)
        const me = await account.get()
        setHasPassword(!!me.passwordUpdate)
      } catch {
        setOauthProvider(null)
        setHasPassword(false)
      } finally {
        setIdentityLoading(false)
      }
    }
    detect()
  }, [])

  const isOAuth = !!oauthProvider

  const resetForms = () => {
    setEmail(""); setPassword(""); setNewPassword(""); setConfirmPass("")
    setShowPass(false); setShowNew(false); setShowConfirm(false)
  }
  const setForm = (form) => { resetForms(); setActiveForm(prev => prev === form ? null : form) }

  const showHideBtn = (visible, toggle) => (
    <button type="button" onClick={() => toggle(v => !v)}
      className="text-muted-foreground hover:text-foreground transition-colors cursor-target">
      {visible ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  )

  // ── Email submit ──────────────────────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { toast.error("All fields required"); return }
    try {
      setSaving(true)
      await account.updateEmail(email.trim(), password)
      toast.success("Email address updated successfully")
      setActiveForm(null); resetForms()
    } catch (err) {
      toast.error(err?.message ?? "Couldn't update email. Please try again.")
    } finally { setSaving(false) }
  }

  // ── Password submit ───────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!password || !newPassword || !confirmPass) { toast.error("All fields required"); return }
    if (newPassword !== confirmPass) { toast.error("New passwords don't match"); return }
    if (newPassword.length < 8) { toast.error("Min 8 characters"); return }
    try {
      setSaving(true)
      await account.updatePassword(newPassword, password)
      toast.success("Password updated successfully")
      setHasPassword(true)
      setActiveForm(null); resetForms()
    } catch (err) {
      toast.error(err?.message ?? "Couldn't update password. Please try again.")
    } finally { setSaving(false) }
  }

  // ── Set password (OAuth users) ────────────────────────────────────────────
  const handleSetPasswordSubmit = async (e) => {
    e.preventDefault()
    if (!newPassword || !confirmPass) { toast.error("All fields required"); return }
    if (newPassword !== confirmPass) { toast.error("Passwords don't match"); return }
    if (newPassword.length < 8) { toast.error("Min 8 characters"); return }
    try {
      setSaving(true)
      await account.updatePassword(newPassword)
      toast.success("Password successfully created. You can now use it to log in", { duration: 5000 })
      setHasPassword(true)
      setActiveForm(null); resetForms()
    } catch (err) {
      toast.error(err?.message ?? "Couldn't set password. Please try again.")
    } finally { setSaving(false) }
  }

  // ── Forgot password ───────────────────────────────────────────────────────
  const handleForgotPassword = async () => {
    if (!user?.email) { toast.error("No email found on your account"); return }
    try {
      setSaving(true)
      const execution = await functions.createExecution(
        import.meta.env.VITE_APPWRITE_RECOVERY_FUNCTION_ID,
        JSON.stringify({ email: user.email }),
        false, "/", "POST"
      )
      let result = {}
      try { result = JSON.parse(execution.responseBody || "{}") } catch { }
      if (execution.status === "failed" || result.error) throw new Error(result.error ?? "Function execution failed")
      toast.success(`Recovery email sent to ${user.email}`, {
        description: "Check your inbox and follow the link to reset your password.",
        duration: 6000,
      })
    } catch (err) {
      toast.error(err?.message ?? "Failed to send recovery email")
    } finally { setSaving(false) }
  }

  // ── Delete account ────────────────────────────────────────────────────────
  const handleDeleteAccount = async () => {
    await deleteAccountPermanently()
    toast.success("Your account has been permanently deleted.")
    setTimeout(() => { window.location.replace("/") }, 800)
  }

  if (identityLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      {/* ── OAuth notice ──────────────────────────────────────────────────── */}
      {isOAuth && (
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200 dark:border-blue-500/20
                     bg-blue-50 dark:bg-blue-500/10 px-4 py-3.5"
        >
          <AlertCircle size={15} className="text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Signed in with {oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1)}
            </p>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
              {hasPassword
                ? `Your account has a password set. You can log in with either ${oauthProvider} or email + password.`
                : `You can set a password below to also be able to log in with email + password.`}
            </p>
          </div>
          <OAuthBadge provider={oauthProvider} />
        </motion.div>
      )}

      {/* ── General section ───────────────────────────────────────────────── */}
      <Section title="General">

        {/* Email */}
        <AccountRow
          icon={Mail} label="Email address" value={user?.email}
          formKey="email" activeForm={activeForm} setActiveForm={setForm}
          disabled={isOAuth} disabledReason={`Managed by ${oauthProvider}`}
        >
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <Field label="New Email">
              <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="new@email.com" />
            </Field>
            <Field label="Current Password" hint="Required to confirm change">
              <Input value={password} onChange={e => setPassword(e.target.value)}
                type={showPass ? "text" : "password"} placeholder="Your current password"
                right={showHideBtn(showPass, setShowPass)} />
            </Field>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setActiveForm(null); resetForms() }}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <SaveBtn saving={saving} label="Update Email" />
            </div>
          </form>
        </AccountRow>

        {/* Password */}
        <AccountRow
          icon={Lock}
          label={isOAuth && !hasPassword ? "Set a password" : "Password"}
          value={hasPassword ? "••••••••" : undefined}
          formKey="password" activeForm={activeForm} setActiveForm={setForm}
        >
          {isOAuth && !hasPassword && (
            <form onSubmit={handleSetPasswordSubmit} className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Set a password so you can also log in with{" "}
                <span className="font-medium text-foreground">{user?.email}</span> + password.
              </p>
              <Field label="New Password">
                <Input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  type={showNew ? "text" : "password"} placeholder="Min 8 characters"
                  right={showHideBtn(showNew, setShowNew)} />
              </Field>
              <Field label="Confirm Password">
                <Input value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  type={showConfirm ? "text" : "password"} placeholder="Repeat password"
                  right={showHideBtn(showConfirm, setShowConfirm)} />
              </Field>
              {confirmPass && (
                <p className={`text-xs ${newPassword === confirmPass ? "text-green-500" : "text-red-400"}`}>
                  {newPassword === confirmPass ? "✓ Passwords match" : "✗ Passwords don't match"}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setActiveForm(null); resetForms() }}
                  className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                <SaveBtn saving={saving} label="Set Password" />
              </div>
            </form>
          )}
          {hasPassword && (
            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <Field label="Current Password">
                <Input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPass ? "text" : "password"} placeholder="Current password"
                  right={showHideBtn(showPass, setShowPass)} />
              </Field>
              <Field label="New Password">
                <Input value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  type={showNew ? "text" : "password"} placeholder="Min 8 characters"
                  right={showHideBtn(showNew, setShowNew)} />
              </Field>
              <Field label="Confirm New Password">
                <Input value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  type={showConfirm ? "text" : "password"} placeholder="Repeat new password"
                  right={showHideBtn(showConfirm, setShowConfirm)} />
              </Field>
              {confirmPass && (
                <p className={`text-xs ${newPassword === confirmPass ? "text-green-500" : "text-red-400"}`}>
                  {newPassword === confirmPass ? "✓ Passwords match" : "✗ Passwords don't match"}
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setActiveForm(null); resetForms() }}
                  className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                <SaveBtn saving={saving} label="Update Password" />
              </div>
            </form>
          )}
        </AccountRow>

        {/* ── Username ──────────────────────────────────────────────────────── */}
        <AccountRow
          icon={AtSign}
          label="Username"
          value={`@${user?.username}`}
          formKey="username"
          activeForm={activeForm}
          setActiveForm={setForm}
        >
          <form onSubmit={handleUsernameSubmit} className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Changing your username will update it across all your posts and replies.
              Your current handle is{" "}
              <span className="font-medium text-foreground">@{user?.username}</span>.
            </p>

            <Field label="New Username">
              <div className="relative">
                <input
                  value={newUsername}
                  onChange={e => handleUsernameInput(e.target.value)}
                  placeholder="your_new_username"
                  spellCheck={false}
                  maxLength={36}
                  className={`w-full rounded-xl border bg-background px-3.5 py-2.5
                              text-sm font-mono text-foreground placeholder:text-muted-foreground/60
                              focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                              hover:border-primary/40 transition-all duration-150 pr-16
                              ${usernameStatus === "available" ? "border-green-500/50 focus:border-green-500" :
                                usernameStatus === "taken"     ? "border-red-500/50 focus:border-red-500"    :
                                "border-border"}`}
                />
                {/* Status icon */}
                <div className="absolute right-9 top-1/2 -translate-y-1/2">
                  {usernameStatus === "checking"  && <Loader2 size={13} className="animate-spin text-muted-foreground" />}
                  {usernameStatus === "available" && <Check   size={13} className="text-green-500" />}
                  {usernameStatus === "taken"     && <X       size={13} className="text-red-500" />}
                </div>
                {/* Re-roll button */}
                <button
                  type="button"
                  onClick={rollUsername}
                  title="Generate a random username"
                  className="absolute right-3 top-1/2 -translate-y-1/2
                             text-muted-foreground hover:text-primary transition-colors cursor-target"
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              {usernameStatus === "available" && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center gap-1">
                  <Check size={11} /> Username available
                </p>
              )}
              {usernameStatus === "taken" && (
                <p className="text-xs text-red-500 mt-1">
                  Username taken - try another or hit the re-roll button
                </p>
              )}
              <p className="text-[11px] text-muted-foreground/60 mt-1">
                Lowercase letters, numbers, and underscores only. 3 to 36 characters.
              </p>
            </Field>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setActiveForm(null); setNewUsername(""); setUsernameStatus("idle") }}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors cursor-target"
              >
                Cancel
              </button>
              <SaveBtn
                saving={saving}
                disabled={usernameStatus !== "available"}
                label="Change Username"
              />
            </div>
          </form>
        </AccountRow>

      </Section>

      {/* ── Password Recovery ─────────────────────────────────────────────── */}
      {hasPassword && (
        <Section title="Password Recovery">
          <div className="py-3.5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <KeyRound size={15} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">Forgot your password?</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    We'll send a recovery link to{" "}
                    <span className="font-medium text-foreground">{user?.email}</span>
                  </p>
                </div>
              </div>
              <motion.button
                type="button" onClick={handleForgotPassword} disabled={saving}
                whileHover={{ scale: saving ? 1 : 1.01 }} whileTap={{ scale: saving ? 1 : 0.98 }}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl border border-border
                           text-sm font-medium text-foreground hover:bg-muted hover:border-primary/30
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-target"
              >
                {saving
                  ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
                  : <><Mail size={13} /> Send reset link</>}
              </motion.button>
            </div>
          </div>
        </Section>
      )}

      {/* ── Danger Zone ───────────────────────────────────────────────────── */}
      <div className="mt-8">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Danger Zone
        </p>
        <div className="rounded-2xl border border-red-200/70 dark:border-red-500/25 bg-card px-4">
          <div className="flex items-start justify-between gap-4 py-4">
            <div className="flex items-start gap-3">
              <Trash2 size={15} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">Delete account</p>
                <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
                  Permanently removes your profile, posts, and all personal data. Attendance records are preserved.
                </p>
              </div>
            </div>
            <motion.button
              type="button" onClick={() => setDeleteModalOpen(true)}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl
                         border border-red-200 dark:border-red-500/30
                         text-sm font-medium text-red-600 dark:text-red-400
                         hover:bg-red-50 dark:hover:bg-red-500/10
                         hover:border-red-400 dark:hover:border-red-400/50
                         transition-all duration-150"
            >
              <Trash2 size={13} /> Delete account
            </motion.button>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  )
}

// =============================================================================
// TAB: ACADEMIC
// =============================================================================
const AcademicTab = ({ user, completeAcademicProfile, queryClient }) => {
  const isTeacher = user?.accountType === "teacher" || user?.role === "teacher"
  const [universityId, setUniversityId] = useState(user?.universityId || "")
  const [programId, setProgramId] = useState(user?.programId || "")
  const [branchId, setBranchId] = useState(user?.branchId || "")
  const [saving, setSaving] = useState(false)

  const academicDirty = (
    universityId !== (user?.universityId || "") ||
    (!isTeacher && (programId !== (user?.programId || "") ||
    branchId !== (user?.branchId || "")))
  )

  const { data: universities = [] } = useQuery({ queryKey: ["universities"], queryFn: getUniversities })
  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["programs", universityId], queryFn: () => getProgramsByUniversity(universityId), enabled: !!universityId && !isTeacher,
  })
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["branches", programId], queryFn: () => getBranchesByProgram(programId), enabled: !!programId && !isTeacher,
  })

  const prevUniRef = useRef(user?.universityId || "")
  const prevProgramRef = useRef(user?.programId || "")

  useEffect(() => {
    const prev = prevUniRef.current; prevUniRef.current = universityId
    if (prev !== universityId && universityId !== (user?.universityId || "")) { setProgramId(""); setBranchId("") }
  }, [universityId])

  useEffect(() => {
    const prev = prevProgramRef.current; prevProgramRef.current = programId
    if (prev !== programId && programId !== (user?.programId || "")) { setBranchId("") }
  }, [programId])

  const canSave = isTeacher
    ? academicDirty && !!universityId
    : academicDirty && !!universityId && !!programId && !!branchId

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSave) return
    try {
      setSaving(true)
      await completeAcademicProfile({
        universityId,
        programId: isTeacher ? null : programId,
        branchId: isTeacher ? null : branchId,
      })
      await queryClient.invalidateQueries({ queryKey: ["academic-identity"] })
      toast.success("Academic preferences saved")
    } catch {
      toast.error("Failed to save")
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit}>
      {isTeacher && (
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-2.5 mb-4">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">
            As a teacher, you only need to set your university. Program and branch are not required.
          </p>
        </div>
      )}
      <Section title="Your Institution">
        <div className="py-3.5 border-b border-border/50 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"><GraduationCap size={11} /> University</label>
          <Dropdown value={universityId} onChange={setUniversityId} options={universities.map(u => ({ value: u.$id, label: u.name }))} placeholder="Select university" />
        </div>
        {!isTeacher && (
          <>
            <div className="py-3.5 border-b border-border/50 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <BookOpen size={11} /> Program {programsLoading && <Loader2 size={10} className="animate-spin ml-1" />}
              </label>
              <Dropdown value={programId} onChange={setProgramId} options={programs.map(p => ({ value: p.$id, label: p.name }))}
                disabled={!universityId || programsLoading} placeholder={programsLoading ? "Fetching programs…" : "Select program"} />
            </div>
            <div className="py-3.5 space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <GitBranch size={11} /> Branch {branchesLoading && <Loader2 size={10} className="animate-spin ml-1" />}
              </label>
              <Dropdown value={branchId} onChange={setBranchId} options={branches.map(b => ({ value: b.$id, label: b.name }))}
                disabled={!programId || branchesLoading} placeholder={branchesLoading ? "Fetching branches…" : "Select branch"} />
            </div>
          </>
        )}
      </Section>
      <div className="flex justify-end">
        <SaveBtn saving={saving} disabled={!canSave} label="Save Preferences" />
      </div>
    </form>
  )
}

// =============================================================================
// TAB: PREFERENCES  (Dark mode + Notifications only)
// =============================================================================

const PreferencesTab = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )

  // ── In-app notification prefs (Appwrite account prefs) ────────────────────
  const [notifPrefs, setNotifPrefs] = useState({
    notif_replies: true,
    notif_mentions: true,
    notif_follows: true,
  })
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [saving, setSaving] = useState(null)

  // ── Push notification state ───────────────────────────────────────────────
  const {
    supported: pushSupported,
    subscribed: pushSubscribed,
    permission: pushPermission,
    loading: pushLoading,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
  } = usePush()

  const isLocalhost = typeof window !== "undefined" &&
    (location.hostname === "localhost" || location.hostname === "127.0.0.1")

  // Load in-app prefs on mount
  useEffect(() => {
    account.getPrefs()
      .then((prefs) => {
        setNotifPrefs({
          notif_replies: prefs.notif_replies !== false,
          notif_mentions: prefs.notif_mentions !== false,
          notif_follows: prefs.notif_follows !== false,
        })
      })
      .catch(() => { })
      .finally(() => setPrefsLoading(false))
  }, [])

  const applyTheme = (dark) => {
    const apply = () => {
      document.documentElement.classList.toggle("dark", dark)
      localStorage.setItem("theme", dark ? "dark" : "light")
      setIsDark(dark)
    }
    const elementCount = document.querySelectorAll("*").length
    if (document.startViewTransition && elementCount < 1500)
      document.startViewTransition(apply)
    else apply()
  }

  const handleNotifToggle = async (key) => {
    const newValue = !notifPrefs[key]
    setNotifPrefs(prev => ({ ...prev, [key]: newValue }))
    setSaving(key)
    try {
      await account.updatePrefs({ [key]: newValue })
      toast.success("Preference saved")
    } catch {
      setNotifPrefs(prev => ({ ...prev, [key]: !newValue }))
      toast.error("Failed to save preference")
    } finally {
      setSaving(null)
    }
  }

  const handlePushToggle = async () => {
    if (pushSubscribed) {
      await pushUnsubscribe()
      toast.success("Push notifications disabled")
    } else {
      const result = await pushSubscribe()
      if (result.ok) {
        toast.success("Push notifications enabled")
      } else if (result.reason === "denied") {
        toast.error("Notifications blocked - allow them in browser settings")
      } else {
        toast.error("Could not enable push notifications")
      }
    }
  }

  const pushDenied = pushPermission === "denied"

  return (
    <div>
      <Section title="Appearance">
        <PrefRow
          icon={isDark ? Moon : Sun}
          label="Dark mode"
          hint="Switch between light and dark theme (Ctrl+D)"
        >
          <Toggle checked={isDark} onChange={applyTheme} />
        </PrefRow>
      </Section>

      <Section title="Notifications">
        {/* ── Push notifications row ── */}
        <PrefRow
          icon={Bell}
          label="Push notifications"
          hint={
            !pushSupported
              ? "Not supported in this browser"
              : pushDenied
                ? "Blocked - click the lock icon in your address bar to allow"
                : isLocalhost
                  ? pushSubscribed
                    ? "Active (localhost: in-tab only - deploy to https for full background push)"
                    : "Enable in-app notifications (full background push requires https)"
                  : pushSubscribed
                    ? "You'll be notified even when the tab is closed"
                    : "Get notified about replies, mentions and follows - even with the tab closed"
          }
        >
          {!pushSupported || pushDenied ? (
            <span className={`text-xs font-medium ${pushDenied ? "text-rose-500" : "text-muted-foreground"}`}>
              {pushDenied ? "Blocked" : "Unsupported"}
            </span>
          ) : pushLoading ? (
            <Loader2 size={14} className="animate-spin text-muted-foreground" />
          ) : (
            <Toggle checked={pushSubscribed} onChange={handlePushToggle} />
          )}
        </PrefRow>

        {/* ── In-app notification type prefs ── */}
        {prefsLoading ? (
          <div className="py-4 flex items-center justify-center">
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <PrefRow
              icon={Bell}
              label="Forum replies"
              hint="Get notified when someone replies to your post"
            >
              {saving === "notif_replies" ? (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              ) : (
                <Toggle
                  checked={notifPrefs.notif_replies}
                  onChange={() => handleNotifToggle("notif_replies")}
                />
              )}
            </PrefRow>

            <PrefRow
              icon={Bell}
              label="Mentions"
              hint="Get notified when someone mentions you"
            >
              {saving === "notif_mentions" ? (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              ) : (
                <Toggle
                  checked={notifPrefs.notif_mentions}
                  onChange={() => handleNotifToggle("notif_mentions")}
                />
              )}
            </PrefRow>

            <PrefRow
              icon={Bell}
              label="New followers"
              hint="Get notified when someone follows you"
            >
              {saving === "notif_follows" ? (
                <Loader2 size={14} className="animate-spin text-muted-foreground" />
              ) : (
                <Toggle
                  checked={notifPrefs.notif_follows}
                  onChange={() => handleNotifToggle("notif_follows")}
                />
              )}
            </PrefRow>
          </>
        )}
      </Section>
    </div>
  )
}

// =============================================================================
// TAB: CUSTOMIZATION
// =============================================================================

// Scope badge pill
const ScopeBadge = ({ label, color = "default" }) => {
  const colors = {
    default:  "bg-muted text-muted-foreground",
    blue:     "bg-blue-500/10 text-blue-500 dark:text-blue-400",
    amber:    "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    purple:   "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium ${colors[color]}`}>
      {label}
    </span>
  )
}

// A pref row that is aware of disabled/locked state from the context
const CustomPrefRow = ({ icon: Icon, label, hint, scopeLabel, scopeColor, prefKey, disabled: forceDisabled, locked }) => {
  const { userPrefs, setUserPref, resolved } = useUIPrefs()

  const isDisabled = forceDisabled || locked
  const currentVal = resolved[prefKey] ?? false

  const handleChange = (v) => {
    if (isDisabled) return
    setUserPref(prefKey === "minimalist" ? "minimalist" : prefKey.replace(/([A-Z])/g, m => `_${m.toLowerCase()}`), v)
    toast.success(v ? `${label} enabled` : `${label} disabled`)
  }

  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                    border-b border-border/50 last:border-0 gap-3
                    ${isDisabled ? "opacity-50" : ""}`}>
      <div className="flex items-start gap-3 min-w-0">
        {Icon && <Icon size={15} className="text-muted-foreground mt-0.5 shrink-0" />}
        <div className="min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="text-sm font-medium text-foreground">{label}</p>
            {scopeLabel && <ScopeBadge label={scopeLabel} color={scopeColor} />}
          </div>
          {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
          {locked && (
            <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5">
              <LockKeyhole size={10} /> Managed by site admin
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0 self-end sm:self-auto">
        <Toggle checked={currentVal} onChange={handleChange} />
      </div>
    </div>
  )
}

const CustomizationTab = () => {
  const {
    resolved, disabled, userLocked, globallyLocked, adminLoading, setUserPref
  } = useUIPrefs()

  const isLocked = userLocked || globallyLocked

  // localStorage-backed minimalist state
  const [isMinimalist, setIsMinimalist] = useState(() =>
    localStorage.getItem("pref_minimalist") === "1"
  )

  const handleMinimalist = (v) => {
    setIsMinimalist(v)
    setUserPref("minimalist", v)
    toast.success(v ? "Minimalist mode enabled — all animations paused" : "Minimalist mode disabled")
  }

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Helper: build pref key from camelCase to snake_case for localStorage
  const prefKey = (k) => {
    const map = {
      animatedBg: "animated_bg", dotField: "dot_field", confettiBg: "confetti_bg",
      antigravityBg: "antigravity_bg", levitatingBg: "levitating_bg",
      targetCursor: "target_cursor", pixelTestimonials: "pixel_testimonials",
      glareHover: "glare_hover", animatedFaq: "animated_faq",
    }
    return map[k] ?? k
  }

  const rowProps = (camelKey, label, hint, icon, scope, scopeColor = "blue") => ({
    label, hint, icon,
    scopeLabel: scope,
    scopeColor,
    prefKey: camelKey,
    disabled: disabled[camelKey],
    locked: !disabled[camelKey] && isLocked,
    // direct toggle handler using snake_case key
    _key: prefKey(camelKey),
  })

  return (
    <div className="space-y-1">

      {/* ── Admin lock notice ──────────────────────────────────────────────── */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200
                     dark:border-amber-500/25 bg-amber-50 dark:bg-amber-500/10 px-4 py-3"
        >
          <LockKeyhole size={14} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
            <span className="font-semibold">Customization managed by admin.</span>{" "}
            Your personal preferences are currently paused. Contact support if you have questions.
          </p>
        </motion.div>
      )}

      {/* ── Minimalist Mode card ───────────────────────────────────────────── */}
      <div className="mb-5 rounded-2xl border border-amber-200/60 dark:border-amber-500/20
                      bg-gradient-to-br from-amber-50/80 to-orange-50/40
                      dark:from-amber-500/5 dark:to-orange-500/5 px-4 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20
                            flex items-center justify-center shrink-0 mt-0.5">
              <Wind size={15} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <p className="text-sm font-semibold text-foreground">Minimalist Mode</p>
                <ScopeBadge label="Personal" color="amber" />
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                Pauses all animations for a faster, distraction-free experience.
                Ideal for older devices or low-power situations.
              </p>
              {isMinimalist && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <Zap size={10} /> Active — all animations are paused
                </p>
              )}
            </div>
          </div>
          <Toggle checked={isMinimalist} onChange={handleMinimalist} />
        </div>
      </div>

      {/* ── Backgrounds ───────────────────────────────────────────────────── */}
      <Section title="Backgrounds · Homepage only">
        {!disabled.animatedBg && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                          border-b border-border/50 gap-3 ${isLocked || isMinimalist ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 min-w-0">
              <Sparkles size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Animated Background</p>
                  <ScopeBadge label="Homepage" color="blue" />
                  <ScopeBadge label="Desktop recommended" color="purple" />
                </div>
                <p className="text-xs text-muted-foreground">Soft floating gradient blobs behind the landing page.</p>
                {(isLocked || isMinimalist) && !disabled.animatedBg && (
                  <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
                    <LockKeyhole size={10} /> {isMinimalist ? "Paused by Minimalist Mode" : "Managed by admin"}
                  </p>
                )}
              </div>
            </div>
            <Toggle
              checked={resolved.animatedBg}
              onChange={v => { if (!isLocked && !isMinimalist) { setUserPref("animated_bg", v); toast.success(v ? "Animated background enabled" : "Animated background disabled") } }}
            />
          </div>
        )}
        {!disabled.dotField && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                          border-b border-border/50 gap-3 ${isLocked || isMinimalist ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 min-w-0">
              <LayoutGrid size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Interactive Dot Field</p>
                  <ScopeBadge label="Homepage" color="blue" />
                  <ScopeBadge label="Desktop recommended" color="purple" />
                </div>
                <p className="text-xs text-muted-foreground">Reactive dot grid that follows your cursor across the landing page.</p>
              </div>
            </div>
            <Toggle
              checked={resolved.dotField}
              onChange={v => { if (!isLocked && !isMinimalist) { setUserPref("dot_field", v); toast.success(v ? "Dot field enabled" : "Dot field disabled") } }}
            />
          </div>
        )}
        {!disabled.confettiBg && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                          border-b border-border/50 gap-3 ${isLocked || isMinimalist ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 min-w-0">
              <Orbit size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Confetti Particles</p>
                  <ScopeBadge label="Homepage" color="blue" />
                  <ScopeBadge label="Desktop recommended" color="purple" />
                </div>
                <p className="text-xs text-muted-foreground">Colorful cursor-reactive particles floating on the landing page.</p>
              </div>
            </div>
            <Toggle
              checked={resolved.confettiBg}
              onChange={v => { if (!isLocked && !isMinimalist) { setUserPref("confetti_bg", v); toast.success(v ? "Confetti particles enabled" : "Confetti particles disabled") } }}
            />
          </div>
        )}
        {!disabled.antigravityBg && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                          border-b border-border/50 gap-3 ${isLocked || isMinimalist ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 min-w-0">
              <Shapes size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Antigravity Shapes</p>
                  <ScopeBadge label="Homepage" color="blue" />
                  <ScopeBadge label="Desktop recommended" color="purple" />
                </div>
                <p className="text-xs text-muted-foreground">Physics-based floating geometry that reacts to your cursor.</p>
              </div>
            </div>
            <Toggle
              checked={resolved.antigravityBg}
              onChange={v => { if (!isLocked && !isMinimalist) { setUserPref("antigravity_bg", v); toast.success(v ? "Antigravity shapes enabled" : "Antigravity shapes disabled") } }}
            />
          </div>
        )}
        {!disabled.levitatingBg && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                          gap-3 ${isLocked || isMinimalist ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 min-w-0">
              <Globe size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Levitating Sphere</p>
                  <ScopeBadge label="Homepage" color="blue" />
                  <ScopeBadge label="All devices" color="default" />
                </div>
                <p className="text-xs text-muted-foreground">Elastic particle sphere, mobile-optimized with touch and scroll interaction.</p>
              </div>
            </div>
            <Toggle
              checked={resolved.levitatingBg}
              onChange={v => { if (!isLocked && !isMinimalist) { setUserPref("levitating_bg", v); toast.success(v ? "Levitating sphere enabled" : "Levitating sphere disabled") } }}
            />
          </div>
        )}
        {/* If all background features are disabled by admin */}
        {disabled.animatedBg && disabled.dotField && disabled.confettiBg && disabled.antigravityBg && disabled.levitatingBg && (
          <div className="py-5 text-center text-xs text-muted-foreground">
            Background effects are temporarily unavailable.
          </div>
        )}
      </Section>

      {/* ── Effects & Animations ───────────────────────────────────────────── */}
      <Section title="Effects & Animations">
        {!disabled.glareHover && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                          border-b border-border/50 gap-3 ${isLocked || isMinimalist ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 min-w-0">
              <Sparkles size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Glare Effect</p>
                  <ScopeBadge label="All pages" color="default" />
                </div>
                <p className="text-xs text-muted-foreground">Subtle light-sweep effect when hovering buttons and interactive elements.</p>
              </div>
            </div>
            <Toggle
              checked={resolved.glareHover}
              onChange={v => { if (!isLocked && !isMinimalist) { setUserPref("glare_hover", v); toast.success(v ? "Glare effect enabled" : "Glare effect disabled") } }}
            />
          </div>
        )}
        {!disabled.targetCursor && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                          border-b border-border/50 gap-3 ${isLocked || isMinimalist ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 min-w-0">
              <Target size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Target Cursor</p>
                  <ScopeBadge label="All pages" color="default" />
                  <ScopeBadge label="Desktop only" color="purple" />
                </div>
                <p className="text-xs text-muted-foreground">Animated lock-on cursor for interactive elements. Auto-disabled on touch screens.</p>
              </div>
            </div>
            <Toggle
              checked={resolved.targetCursor}
              onChange={v => { if (!isLocked && !isMinimalist) { setUserPref("target_cursor", v); toast.success(v ? "Target cursor enabled" : "Target cursor disabled") } }}
            />
          </div>
        )}
        {!disabled.pixelTestimonials && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                          border-b border-border/50 gap-3 ${isLocked || isMinimalist ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 min-w-0">
              <MonitorSmartphone size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Pixel Testimonials</p>
                  <ScopeBadge label="Homepage" color="blue" />
                </div>
                <p className="text-xs text-muted-foreground">Pixelated flip transition between testimonial cards on the homepage.</p>
              </div>
            </div>
            <Toggle
              checked={resolved.pixelTestimonials}
              onChange={v => { if (!isLocked && !isMinimalist) { setUserPref("pixel_testimonials", v); toast.success(v ? "Pixel testimonials enabled" : "Pixel testimonials disabled") } }}
            />
          </div>
        )}
        {!disabled.animatedFaq && (
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between py-3.5
                          gap-3 ${isLocked || isMinimalist ? "opacity-50" : ""}`}>
            <div className="flex items-start gap-3 min-w-0">
              <Laptop2 size={15} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-sm font-medium text-foreground">Animated FAQ</p>
                  <ScopeBadge label="Homepage" color="blue" />
                </div>
                <p className="text-xs text-muted-foreground">Scrollable animated list for the FAQ section on the homepage.</p>
              </div>
            </div>
            <Toggle
              checked={resolved.animatedFaq}
              onChange={v => { if (!isLocked && !isMinimalist) { setUserPref("animated_faq", v); toast.success(v ? "Animated FAQ enabled" : "Animated FAQ disabled") } }}
            />
          </div>
        )}
        {disabled.glareHover && disabled.targetCursor && disabled.pixelTestimonials && disabled.animatedFaq && (
          <div className="py-5 text-center text-xs text-muted-foreground">
            Effect options are temporarily unavailable.
          </div>
        )}
      </Section>

      {/* ── Report footer ─────────────────────────────────────────────────── */}
      <div className="mt-2 flex items-center justify-end">
        <ReportUIIssueButton />
      </div>
    </div>
  )
}

// =============================================================================
// TAB: MASCOT
// =============================================================================

// Available VRM characters (add more later)
const CHARACTERS = [
  { id: "assistant.vrm", name: "Yorozuya", emoji: "🌟", badge: "Default" },
  // More characters will be added here in future updates
]

const MASCOT_PREFS_KEY = "uz_mascot_prefs_v1"

const readMascotPrefs = () => {
  try {
    const raw = localStorage.getItem(MASCOT_PREFS_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch { return {} }
}

const writeMascotPref = (key, value) => {
  try {
    const prefs = readMascotPrefs()
    localStorage.setItem(MASCOT_PREFS_KEY, JSON.stringify({ ...prefs, [key]: value }))
    window.dispatchEvent(new CustomEvent("mascot-prefs-changed", { detail: { key, value } }))
  } catch { /* ignore */ }
}

const MascotTab = () => {
  const { disabled, setUserPref, adminDefaults } = useUIPrefs()
  const maxLoopAnimations = adminDefaults?.max_loop_animations || 5
  const prefs = readMascotPrefs()

  const [visible,   setVisible]   = useState(prefs.mascotVisible   !== false)
  const [minimized, setMinimized] = useState(Boolean(prefs.isMinimized))
  const [sfx,       setSfx]       = useState(prefs.sfxEnabled      !== false)
  const [sequenceUrls, setSequenceUrls] = useState(prefs.sequenceUrls ?? [])

  const { data: assets } = useQuery({
    queryKey: ["mascot-assets"],
    queryFn: async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, MASCOT_ASSETS_COLLECTION_ID, [Query.limit(100)])
        return res.documents
      } catch (err) {
        return []
      }
    },
    staleTime: 0,
  })

  const animations = assets?.filter((a) => a.type === "animation") ?? []

  const [cachedAssets, setCachedAssets] = useState([])
  const [cacheLoading, setCacheLoading] = useState(true)

  useEffect(() => {
    loadCache()
  }, [])

  const loadCache = async () => {
    setCacheLoading(true)
    const assets = await AssetCacheManager.getCachedAssets()
    setCachedAssets(assets)
    setCacheLoading(false)
  }

  const handleDeleteAsset = async (url) => {
    await AssetCacheManager.deleteAsset(url)
    loadCache()
    toast.success("Asset removed from local storage")
  }

  const handleClearCache = async () => {
    if (window.confirm("Clear all downloaded mascot assets from local storage? They will be downloaded again when needed.")) {
      await AssetCacheManager.clearAll()
      loadCache()
      toast.success("Mascot cache cleared")
    }
  }

  const totalCacheSize = cachedAssets.reduce((acc, curr) => acc + (curr.size || 0), 0)

  const apply = (key, setter, value) => {
    setter(value)
    writeMascotPref(key, value)
  }

  const handleVisibleToggle = (v) => {
    apply("mascotVisible", setVisible, v)
    // Also write to the UIPrefs system so resolved.mascotEnabled updates.
    // This is what actually mounts/unmounts the MascotRoot component.
    setUserPref("mascot_enabled", v)
    window.dispatchEvent(new CustomEvent("mascot-toggle-visibility"))
    toast.success(v ? "Mascot companion shown" : "Mascot companion hidden")
  }

  const handleMinimizedToggle = (v) => {
    apply("isMinimized", setMinimized, v)
    toast.success(v ? "Mascot will start minimized" : "Mascot will start expanded")
  }

  const handleSfxToggle = (v) => {
    apply("sfxEnabled", setSfx, v)
    toast.success(v ? "Mascot sounds enabled" : "Mascot sounds muted")
  }

  return (
    <div>
      {/* ── Admin rollback notice ──────────────────────────────────────── */}
      {disabled.mascotEnabled && (
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="mb-5 flex items-start gap-3 rounded-xl border border-amber-200
                     dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/10 px-4 py-3"
        >
          <LockKeyhole size={15} className="text-amber-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
              Feature temporarily unavailable
            </p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5 leading-relaxed">
              The 3D Mascot companion has been temporarily disabled by an administrator.
              Your settings are saved and will resume when the feature is restored.
            </p>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
        className="mb-5 flex items-start gap-3 rounded-xl border border-blue-200
                   dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-4 py-3"
      >
        <Bot size={15} className="text-blue-500 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <span className="font-semibold">Desktop companion only.</span>{" "}
          Yorozuya Mate is a 3D desktop mascot and is not available on mobile or touch devices.
        </p>
      </motion.div>


      <Section title="Companion">
        <PrefRow icon={Bot} label="Show companion" hint="Display the 3D mascot on screen. Press Ctrl+M anytime to toggle.">
          <div className="flex items-center gap-2.5">
            <span className="mascot-shortcut-pill hidden sm:inline-flex">
              <span className="mascot-shortcut-key">Ctrl</span>
              <span className="mascot-shortcut-key">M</span>
            </span>
            <Toggle checked={visible} onChange={handleVisibleToggle} />
          </div>
        </PrefRow>
        <PrefRow icon={Bot} label="Start minimized" hint="Mascot loads collapsed to just the pill on each page visit.">
          <Toggle checked={minimized} onChange={handleMinimizedToggle} />
        </PrefRow>
        <PrefRow
          icon={sfx ? Volume2 : VolumeX}
          label="Sound effects"
          hint="Play sounds when the mascot reacts to taps and speech bubbles."
        >
          <Toggle checked={sfx} onChange={handleSfxToggle} />
        </PrefRow>
      </Section>

      <Section title="Downloads & Storage">
        <div className="py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Local Asset Cache</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm leading-relaxed">
                Downloaded characters and animations are saved locally to speed up loading and save bandwidth.
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold text-foreground mb-1">Total Used: {formatBytes(totalCacheSize)}</p>
              <button onClick={handleClearCache} disabled={cachedAssets.length === 0}
                className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md border border-border text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50">
                Clear All
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-background overflow-hidden overflow-x-auto custom-scrollbar">
            {cacheLoading ? (
              <div className="py-8 flex justify-center"><Loader2 size={16} className="animate-spin text-muted-foreground" /></div>
            ) : cachedAssets.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">No assets currently cached.</div>
            ) : (
              <div className="min-w-[400px]">
                {cachedAssets.map(asset => (
                  <div key={asset.url} className="flex items-center justify-between p-3 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                    <div className="flex flex-col min-w-0 pr-4">
                      <span className="text-sm font-medium text-foreground truncate">{asset.name || "Unknown Asset"}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                        {asset.type} • {new Date(asset.cachedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {formatBytes(asset.size)}
                      </span>
                      <button onClick={() => handleDeleteAsset(asset.url)}
                        className="p-1.5 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        title="Delete from cache">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="Animation Sequencer">
        <div className="py-3">
          <p className="text-sm font-medium text-foreground mb-1">Custom Loop Sequence</p>
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            Select the animations you want your companion to loop through when idle. Drag to reorder.
          </p>

          <div className="flex flex-col md:flex-row gap-6">
            {/* Available Animations */}
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex justify-between">
                <span>Available Poses</span>
                <span className="font-mono text-[10px] bg-muted/50 px-1.5 py-0.5 rounded">{sequenceUrls.length} / {maxLoopAnimations}</span>
              </p>
              <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {animations.map(anim => {
                  const isAdded = sequenceUrls.includes(anim.fileUrl)
                  const atLimit = !isAdded && sequenceUrls.length >= maxLoopAnimations
                  return (
                    <div key={anim.$id} className={`flex items-center justify-between p-2.5 rounded-lg border text-sm transition-colors ${isAdded ? 'border-primary/30 bg-primary/5 text-foreground/70' : 'border-border/50 bg-background hover:border-border'}`}>
                      <span className="truncate pr-2">{anim.name}</span>
                      <button
                        disabled={isAdded || atLimit}
                        title={atLimit ? "Maximum animations reached" : ""}
                        onClick={() => {
                          const newSeq = [...sequenceUrls, anim.fileUrl]
                          apply("sequenceUrls", setSequenceUrls, newSeq)
                        }}
                        className="text-xs font-medium px-2 py-1 rounded bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:hover:bg-muted transition-colors shrink-0"
                      >
                        {isAdded ? "Added" : atLimit ? "Full" : "Add"}
                      </button>
                    </div>
                  )
                })}
                {animations.length === 0 && <p className="text-xs text-muted-foreground py-4 text-center">No animations available.</p>}
              </div>
            </div>

            {/* Sequence */}
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex justify-between items-center">
                <span>Your Sequence</span>
                {sequenceUrls.length > 0 && (
                  <button onClick={() => apply("sequenceUrls", setSequenceUrls, [])} className="text-[10px] text-red-400 hover:text-red-500 hover:underline">Clear</button>
                )}
              </p>
              <div className="space-y-1.5 min-h-[100px] p-3 rounded-xl border border-dashed border-border/60 bg-muted/20">
                {sequenceUrls.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-6 text-muted-foreground">
                    <span className="text-xs">Sequence is empty.</span>
                    <span className="text-[10px] mt-1">Default random idle poses will play instead.</span>
                  </div>
                ) : (
                  sequenceUrls.map((url, index) => {
                    const anim = animations.find(a => a.fileUrl === url)
                    const name = anim ? anim.name : "Unknown Pose"
                    return (
                      <div
                        key={`${url}-${index}`}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", index.toString())}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault()
                          const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10)
                          if (fromIdx === index) return
                          const newSeq = [...sequenceUrls]
                          const [moved] = newSeq.splice(fromIdx, 1)
                          newSeq.splice(index, 0, moved)
                          apply("sequenceUrls", setSequenceUrls, newSeq)
                        }}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-primary/20 bg-primary/10 text-sm cursor-grab active:cursor-grabbing hover:bg-primary/15 transition-colors group"
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          <span className="text-[10px] font-mono text-primary bg-background/50 px-1.5 py-0.5 rounded">{index + 1}</span>
                          <span className="truncate font-medium">{name}</span>
                        </div>
                        <button
                          onClick={() => {
                            const newSeq = [...sequenceUrls]
                            newSeq.splice(index, 1)
                            apply("sequenceUrls", setSequenceUrls, newSeq)
                          }}
                          className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1 shrink-0"
                          title="Remove from sequence"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Quick Actions">
        <div className="py-3.5">
          <div className="flex items-start gap-3">
            <Keyboard size={15} className="text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Keyboard shortcut</p>
              <p className="text-xs text-muted-foreground mb-2">Toggle the mascot companion from anywhere on the site.</p>
              <div className="mascot-shortcut-pill">
                <span className="mascot-shortcut-key">Ctrl</span>
                <span style={{ fontSize: "0.7rem" }}>+</span>
                <span className="mascot-shortcut-key">M</span>
                <span>Toggle mascot</span>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  )
}

const SettingsTabButton = ({ tab, isActive, onClick }) => {
  const Icon = tab.icon
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5
                  text-xs sm:text-sm font-medium whitespace-nowrap
                  transition-colors duration-150 relative shrink-0 cursor-target
                  ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Icon size={13} />
      <span>{tab.label}</span>

      {isActive && (
        <motion.div 
          layoutId="settings-tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
          transition={{ type: "spring", stiffness: 500, damping: 35 }} 
        />
      )}
    </button>
  )
}


// =============================================================================
// MAIN
// =============================================================================
const DashboardSettings = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, completeAcademicProfile, updateProfile } = useAuth()
  const activeTab = searchParams.get("tab") || "profile"
  const setTab = (key) => setSearchParams({ tab: key }, { replace: true })

  return (
    <div className="max-w-2xl mx-auto py-4 sm:py-6">
      <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Settings</h1>
      <div className="-mx-4 sm:mx-0 border-b border-border mb-4 sm:mb-6">
        <div className="flex overflow-x-auto scrollbar-none px-4 sm:px-0" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {TABS.map(tab => (
            <SettingsTabButton
              key={tab.key}
              tab={tab}
              isActive={activeTab === tab.key}
              onClick={() => setTab(tab.key)}
            />
          ))}

        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          {activeTab === "profile"       && <ProfileTab user={user} updateProfile={updateProfile} queryClient={queryClient} navigate={navigate} />}
          {activeTab === "account"        && <AccountTab user={user} />}
          {activeTab === "academic"       && <AcademicTab user={user} completeAcademicProfile={completeAcademicProfile} queryClient={queryClient} />}
          {activeTab === "preferences"    && <PreferencesTab />}
          {activeTab === "customization"  && <CustomizationTab />}
          {activeTab === "mascot"         && <MascotTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default DashboardSettings
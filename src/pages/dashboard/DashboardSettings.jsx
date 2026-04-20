import { useState, useRef, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { useNavigate, useSearchParams } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Camera, Loader2, ChevronDown, ChevronRight, Check,
  User, GraduationCap, BookOpen, GitBranch, Calendar,
  Mail, Lock, Moon, Sun, Bell, Shield, Eye, EyeOff,
  KeyRound, AlertCircle,
  Trash2, AtSign, RefreshCw,
  X
} from "lucide-react"

import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import { getBranchesByProgram } from "@/services/university/branchService"
import { uploadAvatar } from "@/services/user/profileService"
import { account, functions } from "@/lib/appwrite"
import { usePushNotifications } from "@/hooks/usePushNotifications"
import { usePush } from "@/context/PushNotificationContext"
import DeleteAccountModal from "@/components/modals/DeleteAccountModal"
import { deleteAccountPermanently } from "@/services/user/deleteAccountService"

import { changeUsername } from "@/services/user/changeUsernameService"
import { generateUsernameCandidate, isUsernameAvailable } from "@/services/admin/authService"
import { upsertSavedAccount } from "@/lib/savedAccounts"

const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" }, { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" }, { value: "4", label: "4th Year" },
  { value: "PG", label: "Post Graduate" },
]

const TABS = [
  { key: "profile", label: "Profile", icon: User },
  { key: "account", label: "Account", icon: Shield },
  { key: "academic", label: "Academic", icon: GraduationCap },
  { key: "preferences", label: "Preferences", icon: Bell },
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
                    border text-sm text-left transition-all duration-150 outline-none
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
                                transition-colors hover:bg-muted text-left
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
    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? "bg-primary" : "bg-border"}`}>
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
               transition-colors duration-150 shadow-sm">
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
  <div className="flex items-center justify-between py-3.5 border-b border-border/50 last:border-0">
    <div className="flex items-start gap-3">
      {Icon && <Icon size={15} className="text-muted-foreground mt-0.5 shrink-0" />}
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </div>
    {children}
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
                   rounded-lg px-1 -mx-1 group
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
                         flex items-center justify-center text-primary-foreground hover:bg-primary/90 active:scale-90 transition-all">
              <Camera size={11} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground mb-1">@{user?.username}</p>
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="text-xs text-primary hover:text-primary/80 transition-colors">Change photo</button>
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
      className="text-muted-foreground hover:text-foreground transition-colors">
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
                             text-muted-foreground hover:text-primary transition-colors"
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
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
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
                           disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
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
// TAB: PREFERENCES
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
          hint="Switch between light and dark theme"
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
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} onClick={() => setTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2.5
                            text-xs sm:text-sm font-medium whitespace-nowrap
                            transition-colors duration-150 relative shrink-0
                            ${isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Icon size={13} />
                {tab.label}
                {isActive && (
                  <motion.div layoutId="settings-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }} />
                )}
              </button>
            )
          })}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
          {activeTab === "profile" && <ProfileTab user={user} updateProfile={updateProfile} queryClient={queryClient} navigate={navigate} />}
          {activeTab === "account" && <AccountTab user={user} />}
          {activeTab === "academic" && <AcademicTab user={user} completeAcademicProfile={completeAcademicProfile} queryClient={queryClient} />}
          {activeTab === "preferences" && <PreferencesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default DashboardSettings
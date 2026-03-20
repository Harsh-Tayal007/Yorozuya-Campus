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
} from "lucide-react"

import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import { getBranchesByProgram } from "@/services/university/branchService"
import { uploadAvatar } from "@/services/user/profileService"
import { account } from "@/lib/appwrite"

const YEAR_OPTIONS = [
  { value: "1", label: "1st Year" }, { value: "2", label: "2nd Year" },
  { value: "3", label: "3rd Year" }, { value: "4", label: "4th Year" },
  { value: "PG", label: "Post Graduate" },
]

const TABS = [
  { key: "profile",     label: "Profile",     icon: User },
  { key: "account",     label: "Account",     icon: Shield },
  { key: "academic",    label: "Academic",    icon: GraduationCap },
  { key: "preferences", label: "Preferences", icon: Bell },
]

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

const SaveBtn = ({ saving, disabled, label = "Save changes" }) => (
  <motion.button type="submit" disabled={saving || disabled}
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

const AccountRow = ({ icon: Icon, label, value, formKey, activeForm, setActiveForm, children }) => {
  const isOpen = activeForm === formKey
  return (
    <div className="border-b border-border/50 last:border-0">
      <button type="button" onClick={() => setActiveForm(isOpen ? null : formKey)}
        className="flex items-center justify-between w-full py-3.5 transition-colors
                   hover:text-primary group rounded-lg px-1 -mx-1">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={15} className="text-muted-foreground group-hover:text-primary transition-colors" />}
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {value && <span className="text-xs text-muted-foreground truncate max-w-[120px]">{value}</span>}
          <ChevronRight size={14}
            className={`text-muted-foreground transition-all duration-200 shrink-0 ${isOpen ? "rotate-90 text-primary" : "group-hover:text-primary"}`} />
        </div>
      </button>
      <InlineForm open={isOpen}>{children}</InlineForm>
    </div>
  )
}

// =============================================================================
// TAB: PROFILE
// =============================================================================
const ProfileTab = ({ user, updateProfile, queryClient, navigate }) => {
  const fileInputRef = useRef(null)
  const [name,          setName]          = useState(user?.name        || "")
  const [bio,           setBio]           = useState(user?.bio         || "")
  const [yearOfStudy,   setYearOfStudy]   = useState(user?.yearOfStudy || "")
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl   || null)
  const [avatarFile,    setAvatarFile]    = useState(null)
  const [saving,        setSaving]        = useState(false)

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error("Name cannot be empty"); return }
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
        name: name.trim(), bio, yearOfStudy,
        avatarUrl: newAvatarUrl, avatarPublicId: newAvatarPublicId,
        oldAvatarPublicId: user?.avatarPublicId ?? null,
      })
      await queryClient.invalidateQueries({ queryKey: ["profile", user?.username] })
      toast.success("Profile saved")
      navigate(`/profile/${user?.username}`)
    } catch (err) {
      toast.error("Failed to save profile")
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
        <div className="py-3.5 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Year of Study</label>
          <Dropdown value={yearOfStudy} onChange={setYearOfStudy} options={YEAR_OPTIONS} placeholder="Select year" />
        </div>
      </Section>
      <div className="flex justify-end"><SaveBtn saving={saving} label="Save Profile" /></div>
    </form>
  )
}

// =============================================================================
// TAB: ACCOUNT
// =============================================================================
const AccountTab = ({ user }) => {
  const [activeForm, setActiveForm] = useState(null)
  const [email,       setEmail]       = useState("")
  const [password,    setPassword]    = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [showPass,    setShowPass]    = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [saving,      setSaving]      = useState(false)

  const resetForms = () => {
    setEmail(""); setPassword(""); setNewPassword(""); setConfirmPass("")
    setShowPass(false); setShowNew(false)
  }

  const setForm = (form) => { resetForms(); setActiveForm(prev => prev === form ? null : form) }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) { toast.error("All fields required"); return }
    try {
      setSaving(true)
      await account.updateEmail(email.trim(), password)
      toast.success("Email updated successfully")
      setActiveForm(null); resetForms()
    } catch (err) {
      toast.error(err?.message ?? "Failed to update email")
    } finally { setSaving(false) }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (!password || !newPassword || !confirmPass) { toast.error("All fields required"); return }
    if (newPassword !== confirmPass) { toast.error("New passwords don't match"); return }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return }
    try {
      setSaving(true)
      await account.updatePassword(newPassword, password)
      toast.success("Password updated successfully")
      setActiveForm(null); resetForms()
    } catch (err) {
      toast.error(err?.message ?? "Failed to update password")
    } finally { setSaving(false) }
  }

  const showHideBtn = (visible, toggle) => (
    <button type="button" onClick={() => toggle(v => !v)} className="text-muted-foreground hover:text-foreground transition-colors">
      {visible ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  )

  return (
    <div>
      <Section title="General">
        <AccountRow icon={Mail} label="Email address" value={user?.email} formKey="email" activeForm={activeForm} setActiveForm={setForm}>
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <Field label="New Email"><Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="new@email.com" /></Field>
            <Field label="Current Password" hint="Required to confirm change">
              <Input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? "text" : "password"} placeholder="Your current password" right={showHideBtn(showPass, setShowPass)} />
            </Field>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setActiveForm(null); resetForms() }}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <SaveBtn saving={saving} label="Update Email" />
            </div>
          </form>
        </AccountRow>
        <AccountRow icon={Lock} label="Password" value="••••••••" formKey="password" activeForm={activeForm} setActiveForm={setForm}>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <Field label="Current Password">
              <Input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? "text" : "password"} placeholder="Current password" right={showHideBtn(showPass, setShowPass)} />
            </Field>
            <Field label="New Password">
              <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} type={showNew ? "text" : "password"} placeholder="Min 8 characters" right={showHideBtn(showNew, setShowNew)} />
            </Field>
            <Field label="Confirm New Password">
              <Input value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type="password" placeholder="Repeat new password" />
            </Field>
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => { setActiveForm(null); resetForms() }}
                className="px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
              <SaveBtn saving={saving} label="Update Password" />
            </div>
          </form>
        </AccountRow>
      </Section>
    </div>
  )
}

// =============================================================================
// TAB: ACADEMIC
// =============================================================================
const AcademicTab = ({ user, completeAcademicProfile, queryClient }) => {
  const [universityId, setUniversityId] = useState(user?.universityId || "")
  const [programId,    setProgramId]    = useState(user?.programId    || "")
  const [branchId,     setBranchId]     = useState(user?.branchId     || "")
  const [saving,       setSaving]       = useState(false)

  const academicDirty = (
    universityId !== (user?.universityId || "") ||
    programId    !== (user?.programId    || "") ||
    branchId     !== (user?.branchId     || "")
  )

  const { data: universities = [] } = useQuery({ queryKey: ["universities"], queryFn: getUniversities })
  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["programs", universityId], queryFn: () => getProgramsByUniversity(universityId), enabled: !!universityId,
  })
  const { data: branches = [], isLoading: branchesLoading } = useQuery({
    queryKey: ["branches", programId], queryFn: () => getBranchesByProgram(programId), enabled: !!programId,
  })

  const prevUniRef     = useRef(user?.universityId || "")
  const prevProgramRef = useRef(user?.programId    || "")

  useEffect(() => {
    const prev = prevUniRef.current; prevUniRef.current = universityId
    if (prev !== universityId && universityId !== (user?.universityId || "")) { setProgramId(""); setBranchId("") }
  }, [universityId])

  useEffect(() => {
    const prev = prevProgramRef.current; prevProgramRef.current = programId
    if (prev !== programId && programId !== (user?.programId || "")) { setBranchId("") }
  }, [programId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!universityId || !programId || !branchId) return
    try {
      setSaving(true)
      await completeAcademicProfile({ universityId, programId, branchId })
      await queryClient.invalidateQueries({ queryKey: ["academic-identity"] })
      toast.success("Academic preferences saved")
    } catch {
      toast.error("Failed to save")
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Section title="Your Institution">
        <div className="py-3.5 border-b border-border/50 space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide"><GraduationCap size={11} /> University</label>
          <Dropdown value={universityId} onChange={setUniversityId} options={universities.map(u => ({ value: u.$id, label: u.name }))} placeholder="Select university" />
        </div>
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
      </Section>
      <div className="flex justify-end">
        <SaveBtn saving={saving} disabled={!academicDirty || !universityId || !programId || !branchId} label="Save Preferences" />
      </div>
    </form>
  )
}

// =============================================================================
// TAB: PREFERENCES
// =============================================================================
const PreferencesTab = () => {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"))
  const applyTheme = (dark) => {
    const apply = () => {
      document.documentElement.classList.toggle("dark", dark)
      localStorage.setItem("theme", dark ? "dark" : "light")
      setIsDark(dark)
    }
    const elementCount = document.querySelectorAll("*").length
    if (document.startViewTransition && elementCount < 1500) document.startViewTransition(apply)
    else apply()
  }
  return (
    <div>
      <Section title="Appearance">
        <PrefRow icon={isDark ? Moon : Sun} label="Dark mode" hint="Switch between light and dark theme">
          <Toggle checked={isDark} onChange={applyTheme} />
        </PrefRow>
      </Section>
      <Section title="Notifications">
        <PrefRow icon={Bell} label="Forum replies" hint="Get notified when someone replies to your post">
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">Coming soon</span>
        </PrefRow>
        <PrefRow icon={Bell} label="Mentions" hint="Get notified when someone mentions you">
          <span className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">Coming soon</span>
        </PrefRow>
      </Section>
    </div>
  )
}

// =============================================================================
// MAIN
// =============================================================================
const DashboardSettings = () => {
  const queryClient = useQueryClient()
  const navigate    = useNavigate()
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
          {activeTab === "profile"     && <ProfileTab     user={user} updateProfile={updateProfile} queryClient={queryClient} navigate={navigate} />}
          {activeTab === "account"     && <AccountTab     user={user} />}
          {activeTab === "academic"    && <AcademicTab    user={user} completeAcademicProfile={completeAcademicProfile} queryClient={queryClient} />}
          {activeTab === "preferences" && <PreferencesTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default DashboardSettings
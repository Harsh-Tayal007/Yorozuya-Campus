import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import {
  Palette, AlertTriangle, LockKeyhole, Search, RotateCcw,
  Sparkles, LayoutGrid, Orbit, Shapes, Globe, Target,
  MonitorSmartphone, Laptop2, Check, X, Shield, Settings,
  EyeOff, Sun, Moon, Cat, Zap, Play, Save
} from "lucide-react"
import { toast } from "sonner"
import { useUIPrefs } from "@/context/UIPrefsContext"
import {
  updateSiteConfig,
  disableFeature,
  enableFeature,
  setGlobalPrefsLock,
  findUserDocByUsername,
  resetUserPrefs
} from "@/services/ui/uiConfigService"
import { listReports, resolveReport } from "@/services/moderation/reportService"
import { formatDistanceToNow } from "date-fns"

// ── Icons mapping ────────────────────────────────────────────────────────────
const ICONS = {
  animatedBg: Sparkles,
  dotField: LayoutGrid,
  confettiBg: Orbit,
  antigravityBg: Shapes,
  levitatingBg: Globe,
  targetCursor: Target,
  pixelTestimonials: MonitorSmartphone,
  glareHover: Sparkles,
  animatedFaq: Laptop2,
  animatedFaq: Laptop2,
  darkMode: Moon,
  mascotEnabled: Cat,
}

// ── Reusable Toggle ──────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange, disabled, danger }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-5 w-9 shrink-0 cursor-target items-center rounded-full
                border-2 border-transparent transition-colors duration-200 ease-in-out
                focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                ${checked ? (danger ? "bg-red-500" : "bg-primary") : "bg-muted-foreground/30"}`}
  >
    <span
      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow ring-0
                  transition duration-200 ease-in-out ${checked ? "translate-x-4" : "translate-x-0"}`}
    />
  </button>
)

export default function AdminUIConfig() {
  const { adminDefaults, refreshSiteConfig } = useUIPrefs()
  const [loading, setLoading] = useState(false)

  // Sub-tab state
  const [activeTab, setActiveTab] = useState("defaults")

  // Theme state
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )

  const toggleTheme = () => {
    const next = !isDark
    const apply = () => {
      document.documentElement.classList.toggle("dark", next)
      localStorage.setItem("theme", next ? "dark" : "light")
      setIsDark(next)
    }
    if (document.startViewTransition) document.startViewTransition(apply)
    else apply()
  }

  // --- Actions ---
  const handleToggleDefault = async (key, val, rawKey = false) => {
    try {
      setLoading(true)
      const fieldKey = rawKey ? key : `pref_${key}`
      await updateSiteConfig({ [fieldKey]: val })
      refreshSiteConfig()
      toast.success(`Default for ${key} updated`)
    } catch (err) {
      toast.error(err?.message || "Failed to update default")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleRollback = async (key, currentlyDisabled) => {
    const action = currentlyDisabled ? "restore" : "disable"
    if (action === "disable") {
      if (!window.confirm(`Are you sure you want to completely disable and hide this feature for all users?`)) return
    }

    try {
      setLoading(true)
      if (currentlyDisabled) {
        await enableFeature(key)
        toast.success("Feature restored")
      } else {
        await disableFeature(key)
        toast.warning("Feature rolled back and hidden")
      }
      refreshSiteConfig()
    } catch (err) {
      toast.error(err?.message || "Failed to update feature state")
    } finally {
      setLoading(false)
    }
  }

  const handleGlobalLock = async (locked) => {
    try {
      setLoading(true)
      await setGlobalPrefsLock(locked)
      refreshSiteConfig()
      toast.success(locked ? "Global lock enabled" : "Global lock disabled")
    } catch (err) {
      toast.error(err?.message || "Failed to update global lock")
    } finally {
      setLoading(false)
    }
  }

  // --- UI Row Component ---
  const ConfigRow = ({ label, desc, prefKey, camelKey }) => {
    const Icon = ICONS[camelKey] || Settings
    const isDefaultOn = !!adminDefaults[`pref_${prefKey}`]
    const isDisabled = !!adminDefaults[`disabled_${prefKey}`]

    return (
      <div className={`p-4 rounded-xl border transition-colors
                      ${isDisabled ? "bg-red-500/5 border-red-500/20" : "bg-card border-border"}`}>
        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
          
          {/* Info */}
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 p-2 rounded-lg ${isDisabled ? "bg-red-500/10 text-red-500" : "bg-muted text-muted-foreground"}`}>
              <Icon size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">{label}</h3>
                {isDisabled && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 tracking-wider">
                    ROLLED BACK
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-sm leading-relaxed">{desc}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-6 self-start sm:self-auto pl-11 sm:pl-0">
            {/* Default toggle */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-muted-foreground uppercase">Default</span>
              <Toggle
                checked={isDefaultOn}
                disabled={loading || isDisabled}
                onChange={(v) => handleToggleDefault(prefKey, v)}
              />
            </div>
            
            {/* Rollback toggle */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-red-500 uppercase">Rollback</span>
              <Toggle
                checked={isDisabled}
                danger
                disabled={loading}
                onChange={() => handleToggleRollback(prefKey, isDisabled)}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600
                        flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Palette size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Platform Settings</h1>
            <p className="text-sm text-muted-foreground">Manage global features, mascots, and feature availability</p>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border
                   bg-background hover:bg-muted transition-colors text-sm font-medium shadow-sm"
        >
          {isDark ? (
            <>
              <Sun size={15} className="text-amber-500" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon size={15} className="text-indigo-500" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted/50 p-1 rounded-xl w-fit overflow-x-auto custom-scrollbar max-w-full">
        {["defaults", "mascots", "user_control", "complaints"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors
                       ${activeTab === tab ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6">
        
        {/* --- DEFAULTS TAB --- */}
        {activeTab === "defaults" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <section className="space-y-4">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Backgrounds</h2>
              <div className="grid gap-3">
                <ConfigRow label="Animated Background" prefKey="animated_bg" camelKey="animatedBg" desc="Floating gradient blobs on the home page." />
                <ConfigRow label="Interactive Dot Field" prefKey="dot_field" camelKey="dotField" desc="Reactive dot grid on the home page." />
                <ConfigRow label="Confetti Particles" prefKey="confetti_bg" camelKey="confettiBg" desc="Cursor-reactive colorful particles." />
                <ConfigRow label="Antigravity Shapes" prefKey="antigravity_bg" camelKey="antigravityBg" desc="Physics-based floating geometry." />
                <ConfigRow label="Levitating Sphere" prefKey="levitating_bg" camelKey="levitatingBg" desc="Elastic particle sphere, mobile-optimized." />
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1">Effects & Animations</h2>
              <div className="grid gap-3">
                <ConfigRow label="Glare Effect" prefKey="glare_hover" camelKey="glareHover" desc="Light sweep effect on interactive elements." />
                <ConfigRow label="Target Cursor" prefKey="target_cursor" camelKey="targetCursor" desc="Animated lock-on cursor (desktop only)." />
                <ConfigRow label="Pixel Testimonials" prefKey="pixel_testimonials" camelKey="pixelTestimonials" desc="Pixelated flip transition for testimonials." />
                <ConfigRow label="Animated FAQ" prefKey="animated_faq" camelKey="animatedFaq" desc="Scrollable animated FAQ list." />
                <ConfigRow label="Default Theme" prefKey="dark_mode" camelKey="darkMode" desc="Initial theme for new users (Dark if enabled)." />
                <ConfigRow label="3D Mascot" prefKey="mascot_enabled" camelKey="mascotEnabled" desc="Enable the interactive 3D assistant globally." />
              </div>
            </section>
          </motion.div>
        )}

        {/* --- MASCOTS TAB --- */}
        {activeTab === "mascots" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            <section className="p-5 rounded-2xl border border-border bg-card">
              <h3 className="text-base font-semibold text-foreground mb-4">Mascot Configuration</h3>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Max Loop Animations in Sequencer</label>
                <p className="text-xs text-muted-foreground mb-4 max-w-lg">
                  Limit the number of custom animations a user can add to their own sequence in Dashboard Settings. Does not limit the Global Default Sequence.
                </p>
                <div className="flex items-center gap-4 max-w-[200px]">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    disabled={loading}
                    value={adminDefaults?.max_loop_animations || 5}
                    onChange={(e) => handleToggleDefault('max_loop_animations', parseInt(e.target.value, 10), true)}
                    className="flex-1"
                  />
                  <span className="text-sm font-semibold w-6 text-center">{adminDefaults?.max_loop_animations || 5}</span>
                </div>
              </div>
            </section>

            <MascotAssetManager />
            <MascotInteractionConfig />
          </motion.div>
        )}

        {/* --- USER CONTROL TAB --- */}
        {activeTab === "user_control" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            
            {/* Global Lock */}
            <div className="p-5 rounded-2xl border border-border bg-card">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
                  <LockKeyhole size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-semibold text-foreground">Global Preferences Lock</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-2xl">
                    When enabled, all users will be forced to see the site defaults. Their personal customizations will be paused (but not deleted).
                  </p>
                  <div className="flex items-center gap-3">
                    <Toggle
                      checked={!!adminDefaults.user_prefs_globally_locked}
                      disabled={loading}
                      onChange={handleGlobalLock}
                    />
                    <span className="text-sm font-medium">
                      {adminDefaults.user_prefs_globally_locked ? "Lock is Active" : "Lock is Off"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Per-User Reset */}
            <PerUserResetControl />

          </motion.div>
        )}

        {/* --- COMPLAINTS TAB --- */}
        {activeTab === "complaints" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <UIComplaintsView />
          </motion.div>
        )}

      </div>
    </div>
  )
}

// ── Sub-components ───────────────────────────────────────────────────────────

import MascotAssetManager from "./MascotAssetManager"

// ── MascotInteractionConfig ───────────────────────────────────────────────────
function MascotInteractionConfig() {
  const { adminDefaults, refreshSiteConfig } = useUIPrefs()
  const [saving, setSaving] = useState(false)

  const { data: assets } = useQuery({
    queryKey: ["mascot-assets"],
    queryFn: async () => {
      try {
        const { databases: db } = await import("@/lib/appwrite")
        const { Query: Q } = await import("@/lib/appwrite")
        const { DATABASE_ID: DB, MASCOT_ASSETS_COLLECTION_ID: MAC } = await import("@/config/appwrite")
        const res = await db.listDocuments(DB, MAC, [Q.limit(100)])
        return res.documents
      } catch { return [] }
    },
    staleTime: 60_000,
  })

  const animations = assets?.filter(a => a.type === "animation") ?? []
  const audioFiles = assets?.filter(a => a.type === "audio") ?? []
  const characters = assets?.filter(a => a.type === "character") ?? []

  const [selectedTarget, setSelectedTarget] = useState("global")

  const ZONES = [
    { key: "head",   label: "Head / Face",     emoji: "😠", hint: "e.g. Angry, Blush, Surprised" },
    { key: "chest",  label: "Chest",            emoji: "👏", hint: "e.g. Clapping, Thinking" },
    { key: "belly",  label: "Belly",            emoji: "😌", hint: "e.g. Relax, Sad, Sleepy" },
    { key: "crotch", label: "Crotch",           emoji: "💢", hint: "e.g. Angry (between torso/legs)" },
    { key: "legs",   label: "Legs",             emoji: "🦵", hint: "e.g. Jump, LookAround" },
    { key: "welcome",label: "Welcome (Show)",   emoji: "✨", hint: "Plays when mascot appears" },
    { key: "hide",   label: "Goodbye (Hide)",   emoji: "👋", hint: "Plays when mascot is dismissed" },
  ]

  const targetAsset = selectedTarget === "global" ? null : characters.find(c => c.$id === selectedTarget)
  
  // Base configuration loaded from DB
  const getBaseConfig = () => {
    try {
      const rawConfig = selectedTarget === "global" 
        ? (adminDefaults?.interaction_config || "{}")
        : (targetAsset?.interaction_config || "{}")
      return JSON.parse(rawConfig)
    } catch (e) {
      return {}
    }
  }

  const [draftConfig, setDraftConfig] = useState(getBaseConfig())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Sync state when external config loads or target changes
  useEffect(() => {
    const base = getBaseConfig()
    setDraftConfig(base)
    setHasUnsavedChanges(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminDefaults?.interaction_config, targetAsset?.interaction_config, selectedTarget])

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleUpdateDraft = (zoneKey, field, value) => {
    setDraftConfig(prev => {
      const newConfig = { ...prev }
      if (!newConfig[zoneKey]) newConfig[zoneKey] = {}
      newConfig[zoneKey] = { ...newConfig[zoneKey], [field]: value }
      return newConfig
    })
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const configStr = JSON.stringify(draftConfig)

      if (selectedTarget === "global") {
        await updateSiteConfig({ interaction_config: configStr })
        refreshSiteConfig()
      } else {
        const { databases: db } = await import("@/lib/appwrite")
        const { DATABASE_ID: DB, MASCOT_ASSETS_COLLECTION_ID: MAC } = await import("@/config/appwrite")
        await db.updateDocument(DB, MAC, selectedTarget, { interaction_config: configStr })
      }
      
      toast.success("Interactions saved successfully!")
      setHasUnsavedChanges(false)
    } catch (err) {
      toast.error(err?.message || "Failed to save")
    } finally {
      setSaving(false)
    }
  }

  const handleTestInteraction = (zoneKey) => {
    const cfg = draftConfig[zoneKey] || {}
    const animation = cfg.animation || adminDefaults?.[`interaction_${zoneKey}`]
    const audio = cfg.audio
    const text = cfg.text
    
    // Dispatch custom event to InteractionController
    window.dispatchEvent(new CustomEvent("mascot-test-interaction", { 
      detail: { animation, audio, text } 
    }))
  }

  const handleCloneGlobal = async () => {
    if (selectedTarget === "global") return
    if (!window.confirm("Overwrite this character's interactions with the Global Default settings?")) return
    
    try {
      setSaving(true)
      const globalConfig = adminDefaults?.interaction_config || "{}"
      const { databases: db } = await import("@/lib/appwrite")
      const { DATABASE_ID: DB, MASCOT_ASSETS_COLLECTION_ID: MAC } = await import("@/config/appwrite")
      await db.updateDocument(DB, MAC, selectedTarget, { interaction_config: globalConfig })
      toast.success("Copied Global Default!")
    } catch (err) {
      toast.error(err?.message || "Failed to clone")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="p-5 rounded-2xl border border-border bg-card space-y-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/15 text-violet-400 flex items-center justify-center shrink-0">
            <Zap size={16} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Interactive Behaviors & Audio</h3>
            <p className="text-xs text-muted-foreground">
              Assign animations, audio (.wav/.mp3), and text responses to body-zone clicks.
            </p>
          </div>
        </div>
        
        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || !hasUnsavedChanges}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold text-sm transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/40 p-3 rounded-xl border border-border/50">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0">Configure Target:</label>
          <select
            value={selectedTarget}
            onChange={e => {
              if (hasUnsavedChanges && !window.confirm("You have unsaved changes. Discard them?")) return
              setSelectedTarget(e.target.value)
            }}
            className="text-sm px-3 py-1.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary flex-1 sm:flex-none cursor-pointer"
          >
            <option value="global">🌍 Global Default</option>
            {characters.map(c => (
              <option key={c.$id} value={c.$id}>👤 {c.name}</option>
            ))}
          </select>
        </div>

        {selectedTarget !== "global" && (
          <button
            onClick={handleCloneGlobal}
            disabled={saving}
            className="text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Check size={14} /> Clone from Global
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {ZONES.map(({ key, label, emoji, hint }) => {
          const currentData = draftConfig[key] || {}
          // Also fallback to legacy string attributes if JSON is missing during migration
          const animValue = currentData.animation || adminDefaults?.[`interaction_${key}`] || ""
          const audioValue = currentData.audio || ""
          const textValue = currentData.text || ""

          return (
            <div key={key} className="flex flex-col gap-2 p-3.5 rounded-xl bg-muted/30 border border-border/50 transition-colors focus-within:border-primary/50 relative">
              <div className="flex items-center gap-1.5 border-b border-border/50 pb-2 mb-1 pr-16">
                <span className="text-lg leading-none">{emoji}</span>
                <span className="text-sm font-semibold text-foreground">{label}</span>
                {animValue && (
                  <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 tracking-wider uppercase">
                    Assigned
                  </span>
                )}
              </div>
              
              {/* Play / Test Button */}
              <button
                onClick={() => handleTestInteraction(key)}
                className="absolute top-3.5 right-3.5 flex items-center gap-1.5 text-xs font-semibold bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-md transition-colors"
                title="Test this interaction on the live Mascot"
              >
                <Play size={12} className="fill-current" /> Test
              </button>
              
              {/* Animation Dropdown */}
              <div className="space-y-1 mt-1">
                <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Animation</label>
                <select
                  disabled={saving}
                  value={animValue}
                  onChange={e => handleUpdateDraft(key, "animation", e.target.value)}
                  className="w-full text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="">— None —</option>
                  {animations.map(a => (
                    <option key={a.$id} value={a.fileUrl}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                {/* Audio Dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Voice / SFX</label>
                  <select
                    disabled={saving}
                    value={audioValue}
                    onChange={e => handleUpdateDraft(key, "audio", e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">— Use Browser TTS —</option>
                    {audioFiles.map(a => (
                      <option key={a.$id} value={a.fileUrl}>{a.name}</option>
                    ))}
                  </select>
                </div>

                {/* Text Input */}
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">Display Text / TTS</label>
                  <input
                    type="text"
                    disabled={saving}
                    value={textValue}
                    placeholder="E.g. Hello there!"
                    onChange={e => handleUpdateDraft(key, "text", e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

            </div>
          )
        })}
      </div>
    </section>
  )
}

function PerUserResetControl() {
  const [username, setUsername] = useState("")
  const [searching, setSearching] = useState(false)
  const [foundUser, setFoundUser] = useState(null)
  
  const handleSearch = async (e) => {
    e.preventDefault()
    if (!username.trim()) return
    setSearching(true)
    setFoundUser(null)
    try {
      const cleanUsername = username.trim().replace(/^@/, "")
      const userDoc = await findUserDocByUsername(cleanUsername)
      setFoundUser(userDoc)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSearching(false)
    }
  }

  const handleReset = async () => {
    if (!foundUser) return
    try {
      setSearching(true)
      await resetUserPrefs(foundUser.$id)
      toast.success(`Reset UI preferences for @${foundUser.username}`)
      setFoundUser(prev => ({ ...prev, ui_prefs_locked: true }))
    } catch (err) {
      toast.error("Failed to reset user preferences")
    } finally {
      setSearching(false)
    }
  }

  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
          <RotateCcw size={24} />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-semibold text-foreground">Per-User Reset</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-2xl">
            Reset a specific user's UI preferences to site defaults. This overrides their current choices until they change them again.
          </p>
          
          <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <input
                type="text"
                placeholder="Search username (e.g. @john)"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <button
              type="submit"
              disabled={searching || !username.trim()}
              className="px-4 py-2 bg-secondary text-secondary-foreground font-medium text-sm rounded-lg hover:bg-secondary/80 disabled:opacity-50"
            >
              Search
            </button>
          </form>

          {foundUser && (
            <div className="mt-4 p-4 border border-border rounded-xl bg-background flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {foundUser.avatarUrl ? (
                    <img src={foundUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-muted-foreground font-semibold uppercase">{foundUser.username[0]}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{foundUser.name}</p>
                  <p className="text-xs text-muted-foreground">@{foundUser.username}</p>
                </div>
              </div>
              
              <button
                onClick={handleReset}
                disabled={searching}
                className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 font-medium text-sm rounded-lg transition-colors"
              >
                Reset Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function UIComplaintsView() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchReports = async () => {
    setLoading(true)
    try {
      const { reports: data } = await listReports({ 
        status: "pending", 
        targetType: "ui_complaint",
        limit: 50 
      })
      setReports(data)
    } catch (err) {
      toast.error("Failed to load complaints")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleAction = async (report, actionType) => {
    try {
      if (actionType === "reset") {
        // Need to find user doc ID first from reporterId (auth ID)
        const userRes = await findUserDocByUsername(report.reporterUsername)
        await resetUserPrefs(userRes.$id)
        toast.success(`Reset preferences for @${report.reporterUsername}`)
      }
      
      // Mark resolved
      await resolveReport({
        reportId: report.$id,
        resolvedBy: "admin",
        resolution: actionType === "reset" ? "Reset user preferences" : "Dismissed",
        dismiss: actionType === "dismiss"
      })
      toast.success("Report handled")
      setReports(prev => prev.filter(r => r.$id !== report.$id))
    } catch (err) {
      toast.error("Failed to handle report: " + err.message)
    }
  }

  if (loading) return <div className="py-8 text-center text-muted-foreground text-sm">Loading complaints...</div>
  
  if (reports.length === 0) return (
    <div className="py-12 text-center border border-dashed border-border rounded-2xl flex flex-col items-center">
      <Check size={32} className="text-emerald-500 mb-3" />
      <p className="text-foreground font-medium">All clear!</p>
      <p className="text-sm text-muted-foreground">No pending UI complaints.</p>
    </div>
  )

  return (
    <div className="space-y-3">
      {reports.map(report => (
        <div key={report.$id} className="p-4 border border-border bg-card rounded-xl">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500">
                  {report.details || "UI Issue"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Reported by <span className="font-medium text-foreground">@{report.reporterUsername}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  • {formatDistanceToNow(new Date(report.$createdAt))} ago
                </span>
              </div>
              <p className="text-sm text-foreground">{report.reason}</p>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => handleAction(report, "dismiss")}
                className="px-3 py-1.5 text-xs font-medium border border-border text-muted-foreground rounded-lg hover:bg-muted"
              >
                Dismiss
              </button>
              <button
                onClick={() => handleAction(report, "reset")}
                className="px-3 py-1.5 text-xs font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1.5"
              >
                <RotateCcw size={12} /> Reset Prefs
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

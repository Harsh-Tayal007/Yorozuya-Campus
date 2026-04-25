// src/context/UIPrefsContext.jsx
// Single source of truth for all UI animation/effect preferences.
//
// Priority chain (highest wins):
//   1. disabled_<key> in site_config  → feature completely hidden & forced OFF
//   2. user_prefs_globally_locked     → user sees site defaults
//   3. user.ui_prefs_locked           → this user sees site defaults
//   4. user.ui_prefs_reset_at > ls write timestamp → stale prefs, use site defaults
//   5. user's localStorage pref_<key> → user's own preference wins
//   6. site_config.pref_<key>         → site-wide admin default
//   7. SITE_CONFIG_FALLBACK           → hardcoded fallback (Appwrite unreachable)

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { getSiteConfig, SITE_CONFIG_FALLBACK } from "@/services/ui/uiConfigService"

export const UIPrefsContext = createContext(null)

// ── Pref key catalogue ───────────────────────────────────────────────────────
export const PREF_KEYS = [
  "animated_bg",
  "dot_field",
  "confetti_bg",
  "antigravity_bg",
  "levitating_bg",
  "target_cursor",
  "pixel_testimonials",
  "glare_hover",
  "animated_faq",
  "dark_mode",
  "mascot_enabled",
]

// localStorage key for when a user preference was last written
const LS_WRITE_TS_KEY = "pref_last_written_at"

function readLS(key) {
  try { return localStorage.getItem(`pref_${key}`) } catch { return null }
}

function readLSTimestamp() {
  try { return localStorage.getItem(LS_WRITE_TS_KEY) ?? null } catch { return null }
}

function writeLSWithTimestamp(key, value) {
  try {
    localStorage.setItem(`pref_${key}`, value ? "1" : "0")
    localStorage.setItem(LS_WRITE_TS_KEY, new Date().toISOString())
    // Notify other tabs
    window.dispatchEvent(new StorageEvent("storage", {
      key: `pref_${key}`,
      newValue: value ? "1" : "0",
      storageArea: localStorage,
    }))
  } catch { /* storage full */ }
}

// ── Resolve a single pref through the priority chain ────────────────────────
function resolvePref(key, { siteConfig, userLocked, globallyLocked, stalePrefs, isMinimalist }) {
  // Minimalist shortcut — all animations off
  if (isMinimalist) return false

  // 1. Feature disabled by admin — always OFF
  if (siteConfig[`disabled_${key}`]) return false

  // 2/3. User or global lock — show site default
  if (globallyLocked || userLocked) return !!siteConfig[`pref_${key}`]

  // 4. Stale prefs — show site default
  if (stalePrefs) return !!siteConfig[`pref_${key}`]

  // 5. User's own localStorage value (if set)
  const lsVal = readLS(key)
  if (lsVal !== null) return lsVal === "1"

  // 6. Site default
  return !!siteConfig[`pref_${key}`]
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function UIPrefsProvider({ children }) {
  const { currentUser } = useAuth()

  const [siteConfig,    setSiteConfig]    = useState(SITE_CONFIG_FALLBACK)
  const [adminLoading,  setAdminLoading]  = useState(true)
  const [tick,          setTick]          = useState(0) // forces re-resolve on localStorage change

  const prevUpdatedAt = useRef(null)

  // ── Fetch site_config ──────────────────────────────────────────────────────
  const fetchConfig = useCallback(async ({ bust = false } = {}) => {
    const doc = await getSiteConfig({ bustCache: bust })
    setSiteConfig(doc)
    setAdminLoading(false)
    prevUpdatedAt.current = doc.$updatedAt
  }, [])

  useEffect(() => { fetchConfig() }, [fetchConfig])

  // Poll every 2 min to catch admin changes (lightweight — session-cached)
  useEffect(() => {
    const id = setInterval(() => fetchConfig(), 2 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchConfig])

  // ── Cross-tab localStorage sync ────────────────────────────────────────────
  useEffect(() => {
    const onStorage = () => setTick(t => t + 1)
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [])

  // ── Derive locks from user doc ─────────────────────────────────────────────
  const userLocked     = !!currentUser?.ui_prefs_locked
  const globallyLocked = !!siteConfig.user_prefs_globally_locked
  const isMinimalist   = readLS("minimalist") === "1"

  // Stale-pref detection: if admin reset happened AFTER user last wrote prefs
  const stalePrefs = (() => {
    const resetAt = currentUser?.ui_prefs_reset_at
    if (!resetAt) return false
    const writeAt = readLSTimestamp()
    if (!writeAt) return true // no write record → always stale after reset
    return new Date(resetAt) > new Date(writeAt)
  })()

  // ── Resolve all prefs ──────────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = (() => {
    const ctx = { siteConfig, userLocked, globallyLocked, stalePrefs, isMinimalist }
    return {
      animatedBg:        resolvePref("animated_bg",        ctx),
      dotField:          resolvePref("dot_field",          ctx),
      confettiBg:        resolvePref("confetti_bg",        ctx),
      antigravityBg:     resolvePref("antigravity_bg",     ctx),
      levitatingBg:      resolvePref("levitating_bg",      ctx),
      targetCursor:      resolvePref("target_cursor",      ctx),
      pixelTestimonials: resolvePref("pixel_testimonials", ctx),
      glareHover:        resolvePref("glare_hover",        ctx),
      animatedFaq:       resolvePref("animated_faq",       ctx),
      darkMode:          resolvePref("dark_mode",          ctx),
      mascotEnabled:     resolvePref("mascot_enabled",     ctx),
      minimalist:        isMinimalist,
    }
  })() // re-runs when tick changes (storage events)

  // ── Apply theme globally ──────────────────────────────────────────────────
  useEffect(() => {
    // Only apply if user hasn't explicitly set a theme in localStorage
    // OR if we are in a locked/stale state where site defaults win.
    const userTheme = localStorage.getItem("theme")
    const shouldFollowDefault = !userTheme || globallyLocked || userLocked || stalePrefs

    if (shouldFollowDefault) {
      const isDark = resolved.darkMode
      document.documentElement.classList.toggle("dark", isDark)
    } else {
      // Respect user's localStorage if not locked
      document.documentElement.classList.toggle("dark", userTheme === "dark")
    }
  }, [resolved.darkMode, globallyLocked, userLocked, stalePrefs])

  // ── disabled flags (for hiding rows in user Settings) ─────────────────────
  const disabled = {
    animatedBg:        !!siteConfig.disabled_animated_bg,
    dotField:          !!siteConfig.disabled_dot_field,
    confettiBg:        !!siteConfig.disabled_confetti_bg,
    antigravityBg:     !!siteConfig.disabled_antigravity_bg,
    levitatingBg:      !!siteConfig.disabled_levitating_bg,
    targetCursor:      !!siteConfig.disabled_target_cursor,
    pixelTestimonials: !!siteConfig.disabled_pixel_testimonials,
    glareHover:        !!siteConfig.disabled_glare_hover,
    animatedFaq:       !!siteConfig.disabled_animated_faq,
    darkMode:          !!siteConfig.disabled_dark_mode,
    mascotEnabled:     !!siteConfig.disabled_mascot_enabled,
  }

  // ── User's raw localStorage prefs (for the Settings UI toggles) ──────────
  const userPrefs = (() => {
    // eslint-disable-next-line no-unused-expressions
    tick // subscribe to tick so this re-runs on storage events
    const out = {}
    PREF_KEYS.forEach(key => {
      const val = readLS(key)
      out[key] = val === null ? null : val === "1"
    })
    out.minimalist = readLS("minimalist") === "1"
    return out
  })()

  // ── setUserPref — write localStorage + retrigger resolution ───────────────
  const setUserPref = useCallback((key, value) => {
    writeLSWithTimestamp(key, value)
    setTick(t => t + 1)
  }, [])

  // ── clearUserPrefs — admin-triggered (called by AdminUIConfig) ─────────────
  const clearUserPrefs = useCallback(() => {
    PREF_KEYS.forEach(key => {
      try { localStorage.removeItem(`pref_${key}`) } catch { /* ignore */ }
    })
    try { localStorage.removeItem(LS_WRITE_TS_KEY) } catch { /* ignore */ }
    setTick(t => t + 1)
  }, [])

  // ── refreshSiteConfig — called after admin saves changes ──────────────────
  const refreshSiteConfig = useCallback(() => fetchConfig({ bust: true }), [fetchConfig])

  const value = {
    resolved,
    disabled,
    userPrefs,
    adminDefaults: siteConfig,
    adminLoading,
    userLocked,
    globallyLocked,
    stalePrefs,
    setUserPref,
    clearUserPrefs,
    refreshSiteConfig,
  }

  return (
    <UIPrefsContext.Provider value={value}>
      {children}
    </UIPrefsContext.Provider>
  )
}

export const useUIPrefs = () => useContext(UIPrefsContext)

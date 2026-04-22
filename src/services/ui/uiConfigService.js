// src/services/ui/uiConfigService.js
// Manages the site_config singleton document in Appwrite.
// The document always has ID "global" — one document, always present.

import { databases } from "@/lib/appwrite"
import { Query }     from "@/lib/appwrite"

const DATABASE_ID  = import.meta.env.VITE_APPWRITE_DATABASE_ID
const CONFIG_COL   = import.meta.env.VITE_APPWRITE_SITE_CONFIG_COLLECTION_ID
const USERS_COL    = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID
const SINGLETON_ID = "global"

// ── Session-cache helpers ────────────────────────────────────────────────────
const CACHE_KEY = "uz_site_config_v1"
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return null
    return data
  } catch { return null }
}

function writeCache(data) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch { /* storage full */ }
}

function invalidateCache() {
  try { sessionStorage.removeItem(CACHE_KEY) } catch { /* ignore */ }
}

// ── Hardcoded fallback (used when Appwrite is unreachable) ───────────────────
export const SITE_CONFIG_FALLBACK = {
  pref_animated_bg:        false,
  pref_dot_field:          false,
  pref_confetti_bg:        false,
  pref_antigravity_bg:     false,
  pref_levitating_bg:      false,
  pref_target_cursor:      false,
  pref_pixel_testimonials: true,
  pref_glare_hover:        true,
  pref_animated_faq:       true,
  pref_dark_mode:          true, // Default to dark mode
  // Rollback flags — all features available by default
  disabled_animated_bg:        false,
  disabled_dot_field:          false,
  disabled_confetti_bg:        false,
  disabled_antigravity_bg:     false,
  disabled_levitating_bg:      false,
  disabled_target_cursor:      false,
  disabled_pixel_testimonials: false,
  disabled_glare_hover:        false,
  disabled_animated_faq:       false,
  disabled_dark_mode:          false,
  // Locks
  user_prefs_globally_locked: false,
}

// ── getSiteConfig ────────────────────────────────────────────────────────────
/**
 * Fetches the global site_config document.
 * Uses a 5-minute sessionStorage cache to avoid hammering Appwrite on every render.
 * Falls back to SITE_CONFIG_FALLBACK if fetch fails.
 */
export async function getSiteConfig({ bustCache = false } = {}) {
  if (!bustCache) {
    const cached = readCache()
    if (cached) return cached
  }

  try {
    const doc = await databases.getDocument(DATABASE_ID, CONFIG_COL, SINGLETON_ID)
    writeCache(doc)
    return doc
  } catch (err) {
    // If document doesn't exist yet (404), return fallback gracefully
    console.warn("[UIConfig] Could not fetch site_config, using fallback:", err?.message)
    return { ...SITE_CONFIG_FALLBACK, $updatedAt: null }
  }
}

// ── updateSiteConfig ─────────────────────────────────────────────────────────
/**
 * Partially updates the global site_config document.
 * Admin/owner only (enforced by Appwrite permissions).
 */
export async function updateSiteConfig(patch) {
  invalidateCache()
  const doc = await databases.updateDocument(DATABASE_ID, CONFIG_COL, SINGLETON_ID, patch)
  writeCache(doc)
  return doc
}

// ── Feature rollback (disable/enable) ────────────────────────────────────────
/**
 * Disable a feature entirely: hides it from user Settings UI and forces it OFF.
 * @param {string} prefKey  e.g. "animated_bg", "dot_field"
 */
export async function disableFeature(prefKey) {
  return updateSiteConfig({ [`disabled_${prefKey}`]: true })
}

/**
 * Re-enable a previously disabled feature.
 */
export async function enableFeature(prefKey) {
  return updateSiteConfig({ [`disabled_${prefKey}`]: false })
}

// ── Per-user reset ───────────────────────────────────────────────────────────
/**
 * Lock a specific user's customizations — they'll see site defaults.
 * The user's localStorage is NOT deleted; it becomes stale (ui_prefs_reset_at > write time).
 */
export async function resetUserPrefs(userDocId) {
  return databases.updateDocument(DATABASE_ID, USERS_COL, userDocId, {
    ui_prefs_locked:   true,
    ui_prefs_reset_at: new Date().toISOString(),
  })
}

/**
 * Unlock a user's customizations — their own preferences are honored again.
 */
export async function unlockUserPrefs(userDocId) {
  return databases.updateDocument(DATABASE_ID, USERS_COL, userDocId, {
    ui_prefs_locked: false,
  })
}

// ── Global lock ──────────────────────────────────────────────────────────────
/**
 * Force ALL users to see site defaults (global lock).
 */
export async function setGlobalPrefsLock(locked) {
  return updateSiteConfig({ user_prefs_globally_locked: locked })
}

// ── Find user doc by username (for admin per-user reset) ─────────────────────
export async function findUserDocByUsername(username) {
  const res = await databases.listDocuments(DATABASE_ID, USERS_COL, [
    Query.equal("username", username),
    Query.limit(1),
  ])
  if (res.total === 0) throw new Error(`No user found with username @${username}`)
  return res.documents[0]
}

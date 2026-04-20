const KEY       = "unizuya_saved_accounts"
const VAULT_KEY = "unizuya_vault"
const TTL_MS    = 7 * 24 * 60 * 60 * 1000  // 7 days (was 30 min)

// ── Saved accounts ────────────────────────────────────────────────────────────
// Shape: { userId, name, username, email, avatarUrl, provider? }
// provider: "google" | "github" | null (null = email/password)

export const getSavedAccounts = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] }
  catch { return [] }
}

export const upsertSavedAccount = (account) => {
  try {
    const accounts = getSavedAccounts()
    const idx = accounts.findIndex(a => a.userId === account.userId)
    if (idx >= 0) accounts[idx] = { ...accounts[idx], ...account }
    else accounts.push(account)
    localStorage.setItem(KEY, JSON.stringify(accounts))
  } catch { /* ignore */ }
}

export const removeSavedAccount = (userId) => {
  try {
    const accounts = getSavedAccounts().filter(a => a.userId !== userId)
    localStorage.setItem(KEY, JSON.stringify(accounts))
  } catch { /* ignore */ }
}

// ── Crypto helpers ────────────────────────────────────────────────────────────

const deriveKey = async (userId, salt) => {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(userId), "PBKDF2", false, ["deriveKey"]
  )
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  )
}

const encryptText = async (text, key) => {
  const iv  = crypto.getRandomValues(new Uint8Array(12))
  const enc = new TextEncoder()
  const ct  = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(text))
  const buf = new Uint8Array(12 + ct.byteLength)
  buf.set(iv)
  buf.set(new Uint8Array(ct), 12)
  return btoa(String.fromCharCode(...buf))
}

const decryptText = async (b64, key) => {
  const buf = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
  const iv  = buf.slice(0, 12)
  const ct  = buf.slice(12)
  const pt  = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct)
  return new TextDecoder().decode(pt)
}

// ── Vault ─────────────────────────────────────────────────────────────────────
// Stores encrypted passwords in localStorage with a 7-day TTL.
// OAuth accounts never have an entry here - they use the OAuth flow instead.

export const vaultStore = async (userId, password) => {
  if (!password) return
  try {
    const salt    = crypto.randomUUID()
    const key     = await deriveKey(userId, salt)
    const blob    = await encryptText(password, key)
    const expires = Date.now() + TTL_MS

    const vault = JSON.parse(localStorage.getItem(VAULT_KEY) || "{}")
    vault[userId] = { salt, blob, expires }
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault))
  } catch (err) {
    console.warn("vaultStore failed:", err)
  }
}

export const vaultGet = async (userId) => {
  try {
    const vault = JSON.parse(localStorage.getItem(VAULT_KEY) || "{}")
    const entry = vault[userId]
    if (!entry) return null
    if (Date.now() > entry.expires) {
      delete vault[userId]
      localStorage.setItem(VAULT_KEY, JSON.stringify(vault))
      return null
    }
    const key = await deriveKey(userId, entry.salt)
    return await decryptText(entry.blob, key)
  } catch {
    return null
  }
}

export const vaultRemove = (userId) => {
  try {
    const vault = JSON.parse(localStorage.getItem(VAULT_KEY) || "{}")
    delete vault[userId]
    localStorage.setItem(VAULT_KEY, JSON.stringify(vault))
  } catch {}
}

// Refresh TTL to 7 days on every successful session restore
export const vaultRefreshTTL = (userId) => {
  try {
    const vault = JSON.parse(localStorage.getItem(VAULT_KEY) || "{}")
    if (vault[userId]) {
      vault[userId].expires = Date.now() + TTL_MS
      localStorage.setItem(VAULT_KEY, JSON.stringify(vault))
    }
  } catch {}
}
/**
 * storageConfigService.js
 *
 * Fetches and caches the active storage configuration from the
 * unizuya-storage Cloudflare Worker (KV-backed).
 */

import {
  fetchCloudflareWorker,
  isWorkerUnavailableError,
  readJsonSafe,
} from "./cloudflareWorkerClient"

const WORKER_URL = import.meta.env.VITE_STORAGE_WORKER_URL
const STORAGE_SECRET = import.meta.env.VITE_STORAGE_SECRET

let _cachedConfig = null
let _cacheTimestamp = 0
const CACHE_TTL_MS = 60_000 // 60 seconds

/**
 * Get current storage config (cached for 60s).
 * @returns {Promise<{ activeStorage: "appwrite" | "cloudflare", workerUrl: string }>}
 */
export async function getStorageConfig() {
  const now = Date.now()
  if (_cachedConfig && now - _cacheTimestamp < CACHE_TTL_MS) {
    return _cachedConfig
  }

  if (!WORKER_URL) {
    return { activeStorage: "appwrite", workerUrl: WORKER_URL }
  }

  try {
    const res = await fetchCloudflareWorker(`${WORKER_URL}/config`, {
      timeoutMs: 6_000,
      workerName: "Storage worker",
    })
    if (!res.ok) throw new Error(`Config fetch failed: ${res.status}`)
    const data = await res.json()

    _cachedConfig = {
      activeStorage: data.activeStorage || "appwrite",
      workerUrl: WORKER_URL,
    }
    _cacheTimestamp = now
    return _cachedConfig
  } catch (err) {
    if (!isWorkerUnavailableError(err)) {
      console.error("Failed to fetch storage config, defaulting to appwrite:", err)
    }
    // Fallback to appwrite if worker is unreachable
    return { activeStorage: "appwrite", workerUrl: WORKER_URL }
  }
}

/**
 * Update the active storage (admin only).
 * @param {"appwrite" | "cloudflare"} activeStorage
 */
export async function setStorageConfig(activeStorage) {
  if (!WORKER_URL) {
    throw new Error("Storage worker URL is not configured.")
  }

  const res = await fetchCloudflareWorker(`${WORKER_URL}/config`, {
    timeoutMs: 8_000,
    workerName: "Storage worker",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${STORAGE_SECRET}`,
    },
    body: JSON.stringify({ activeStorage }),
  })

  if (!res.ok) {
    const errorData = await readJsonSafe(res)
    throw new Error(errorData.error || `Failed to set config: ${res.status}`)
  }

  // Immediately invalidate cache
  invalidateConfig()

  return res.json()
}

/**
 * Invalidate the cached config, forcing a fresh fetch on next call.
 */
export function invalidateConfig() {
  _cachedConfig = null
  _cacheTimestamp = 0
}

/**
 * Get the worker URL.
 */
export function getWorkerUrl() {
  return WORKER_URL
}

/**
 * Get the storage secret (for authenticated requests).
 */
export function getStorageSecret() {
  return STORAGE_SECRET
}

// src/services/university/noticesService.js
// Calls the Cloudflare Worker which handles scraping + Appwrite caching

import {
  fetchCloudflareWorker,
  isWorkerUnavailableError,
  readJsonSafe,
} from "@/services/shared/cloudflareWorkerClient"

const WORKER_URL = import.meta.env.VITE_NOTICES_WORKER_URL
const CACHE_PREFIX = "university_notices:"

function defaultPayload(extra = {}) {
  return {
    notices: [],
    lastFetched: null,
    fromCache: false,
    stale: false,
    ...extra,
  }
}

function normalizePayload(data, extra = {}) {
  return {
    notices: data?.notices ?? [],
    lastFetched: data?.lastFetched ?? null,
    fromCache: data?.fromCache ?? false,
    stale: data?.stale ?? false,
    ...extra,
  }
}

function readCachedNotices(universityId) {
  if (!universityId || typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${universityId}`)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.notices)) return null
    return normalizePayload(parsed)
  } catch {
    return null
  }
}

function writeCachedNotices(universityId, payload) {
  if (!universityId || typeof window === "undefined") return
  try {
    localStorage.setItem(`${CACHE_PREFIX}${universityId}`, JSON.stringify(payload))
  } catch {
    // Ignore storage quota/private mode errors.
  }
}

/**
 * Fetch notices for a university via the Cloudflare Worker.
 * Worker checks Appwrite cache first - only scrapes if stale (> 6hr).
 *
 * @param {{ universityId: string, noticesUrl: string }} params
 * @returns {Promise<{ notices: Notice[], lastFetched: string, fromCache: boolean, stale?: boolean, fallbackReason?: string }>}
 */
export async function fetchUniversityNotices({ universityId, noticesUrl }) {
  if (!universityId || !noticesUrl) return defaultPayload()

  if (!WORKER_URL) {
    const cached = readCachedNotices(universityId)
    if (cached) return { ...cached, stale: true, fromCache: true, fallbackReason: "worker_not_configured" }
    return defaultPayload({ stale: true, fromCache: true, fallbackReason: "worker_not_configured" })
  }

  try {
    const res = await fetchCloudflareWorker(WORKER_URL, {
      timeoutMs: 10_000,
      workerName: "Notices worker",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ universityId, noticesUrl }),
    })

    if (!res.ok) {
      const err = await readJsonSafe(res)
      throw new Error(err.error || `Worker error ${res.status}`)
    }

    const data = await res.json()
    const payload = normalizePayload(data)
    writeCachedNotices(universityId, payload)
    return payload
  } catch (err) {
    if (isWorkerUnavailableError(err)) {
      const cached = readCachedNotices(universityId)
      if (cached) {
        return {
          ...cached,
          stale: true,
          fromCache: true,
          fallbackReason: "worker_unavailable",
        }
      }

      return defaultPayload({
        stale: true,
        fromCache: true,
        fallbackReason: "worker_unavailable",
      })
    }

    throw err
  }
}

/**
 * @typedef {Object} Notice
 * @property {string}      title
 * @property {string}      date
 * @property {string|null} url
 * @property {"Examination"|"Event"|"Admission"|"Recruitment"|"Tender"|"General"} category
 */

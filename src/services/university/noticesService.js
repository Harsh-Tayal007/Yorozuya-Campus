// src/services/university/noticesService.js
// Calls the Cloudflare Worker which handles scraping + Appwrite caching

const WORKER_URL = import.meta.env.VITE_NOTICES_WORKER_URL
// e.g. https://university-notices.YOUR-SUBDOMAIN.workers.dev

/**
 * Fetch notices for a university via the Cloudflare Worker.
 * Worker checks Appwrite cache first — only scrapes if stale (> 6hr).
 *
 * @param {{ universityId: string, noticesUrl: string }} params
 * @returns {Promise<{ notices: Notice[], lastFetched: string, fromCache: boolean, stale?: boolean }>}
 */
export async function fetchUniversityNotices({ universityId, noticesUrl }) {
  if (!universityId || !noticesUrl) return { notices: [], lastFetched: null }
  if (!WORKER_URL) {
    console.warn("VITE_NOTICES_WORKER_URL not set")
    return { notices: [], lastFetched: null }
  }

  const res = await fetch(WORKER_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ universityId, noticesUrl }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Worker error ${res.status}`)
  }

  const data = await res.json()

  return {
    notices:     data.notices     ?? [],
    lastFetched: data.lastFetched ?? null,
    fromCache:   data.fromCache   ?? false,
    stale:       data.stale       ?? false,
  }
}

/**
 * @typedef {Object} Notice
 * @property {string}      title
 * @property {string}      date
 * @property {string|null} url
 * @property {"Examination"|"Event"|"Admission"|"Recruitment"|"Tender"|"General"} category
 */
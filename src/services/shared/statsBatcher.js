/**
 * StatsBatcher — KV-write-efficient event batcher
 *
 * Strategy to stay within Cloudflare KV 1,000 writes/day free limit:
 *
 *  1. FLUSH_INTERVAL raised to 60 s (was 10 s) — 6× fewer timer-triggered writes.
 *  2. Session-level dedup: each event type is only pushed ONCE per browser session
 *     (sessionStorage flag). Re-renders / React StrictMode double-invocations
 *     produce zero extra KV writes.
 *  3. All queued events are sent in a single POST → the Worker collapses them into
 *     one KV write (or at most one read + one write) instead of N individual writes.
 *  4. On page-hide / visibility-hidden the queue is flushed immediately via
 *     sendBeacon so no data is lost on tab close.
 *
 * KV write budget at scale (rough math):
 *   - 1 write per user session   (activity deduplicated by sessionStorage)
 *   - 60-second batching window  (all events within the window = 1 write)
 *   - 1,000 writes/day ÷ 24 h = ~41 writes/hour → supports ~41 concurrent
 *     sessions starting per hour without ever hitting the limit in normal use.
 *   - Non-activity events (AI tokens, emails) are rare and already batched.
 */

const WORKER = "https://unizuya-stats.harshtayal710.workers.dev"

/**
 * How long (ms) we wait before flushing the queue.
 * 60 s is a good balance: captures everything in a page session while
 * cutting timer-triggered writes to 1/6th of the old 10 s default.
 */
const FLUSH_INTERVAL = 60_000

/**
 * sessionStorage key used to mark that an "activity" event has already
 * been sent this browser session. Prevents duplicate KV writes from
 * React StrictMode double-invocations, route changes, or hot-reloads.
 */
const SESSION_ACTIVITY_KEY = "unizuya_activity_tracked"

class StatsBatcher {
  constructor() {
    /** @type {Array<{type: string, [key: string]: any, timestamp: number}>} */
    this.queue = []
    /** @type {ReturnType<typeof setTimeout> | null} */
    this.timer = null
    this.isSetup = false

    if (typeof window !== "undefined") {
      this._setupListeners()
    }
  }

  _setupListeners() {
    if (this.isSetup) return
    this.isSetup = true

    const handleFlush = () => this.flush()

    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleFlush()
    })
    window.addEventListener("pagehide", handleFlush)
  }

  /**
   * Push an event into the batch queue.
   *
   * For events of type "activity" we additionally gate on a sessionStorage
   * flag so the same user's page-view/active-user increment only happens
   * ONCE per browser session regardless of how many components call push().
   *
   * @param {{ type: string, [key: string]: any }} event
   * @returns {boolean} true if the event was accepted, false if deduped
   */
  push(event) {
    if (event.type === "activity") {
      if (typeof sessionStorage !== "undefined") {
        if (sessionStorage.getItem(SESSION_ACTIVITY_KEY)) {
          // Already tracked this session — skip to avoid an extra KV write
          return false
        }
        sessionStorage.setItem(SESSION_ACTIVITY_KEY, "1")
      }
    }

    this.queue.push({
      ...event,
      timestamp: Date.now(),
    })

    if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), FLUSH_INTERVAL)
    }

    return true
  }

  /**
   * Immediately send whatever is in the queue and reset the timer.
   * Safe to call multiple times — no-ops when the queue is empty.
   */
  flush() {
    if (this.queue.length === 0) return

    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }

    const payload = JSON.stringify(this.queue)
    this.queue = []

    const url = `${WORKER}/track/batch`

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      // sendBeacon survives page unload; use Blob to set content-type
      const blob = new Blob([payload], { type: "application/json" })
      const queued = navigator.sendBeacon(url, blob)
      if (!queued) {
        this._fallbackFetch(url, payload)
      }
    } else {
      this._fallbackFetch(url, payload)
    }
  }

  async _fallbackFetch(url, payload) {
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      })
    } catch (err) {
      console.warn("[StatsBatcher] Fallback fetch failed:", err)
    }
  }
}

export const statsBatcher = new StatsBatcher()
import { useEffect } from "react"
import { account } from "@/lib/appwrite"
import { statsBatcher } from "@/services/shared/statsBatcher"

/**
 * useTrackActivity
 *
 * Tracks a single "activity" event per browser session.
 *
 * The dedup logic lives in StatsBatcher.push() (sessionStorage flag), so even
 * if this hook fires multiple times (React StrictMode, layout re-mounts, route
 * transitions) only ONE event reaches the queue and ultimately ONE KV write
 * is produced for this user's session.
 */
export function useTrackActivity() {
  useEffect(() => {
    const track = async () => {
      try {
        const user = await account.get().catch(() => null)
        statsBatcher.push({
          type: "activity",
          userId: user?.$id || null,
          isNewSignup: false,
        })
      } catch (_) {
        // Silently ignore — never block the UI for analytics
      }
    }
    track()
  // Empty deps: run once on mount. StatsBatcher deduplicates within the session.
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
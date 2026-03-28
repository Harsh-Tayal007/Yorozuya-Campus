import { useEffect } from "react"
import { account } from "@/lib/appwrite"

const WORKER = "https://unizuya-stats.harshtayal710.workers.dev"

export function useTrackActivity() {
  useEffect(() => {
    const track = async () => {
      try {
        const user = await account.get().catch(() => null)
        navigator.sendBeacon(
          `${WORKER}/track/activity`,
          JSON.stringify({ userId: user?.$id || null, isNewSignup: false })
        )
      } catch (_) {}
    }
    track()
  }, [])
}
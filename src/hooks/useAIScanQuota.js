// src/hooks/useAIScanQuota.js
import { useState, useEffect, useCallback } from "react"

const WORKER = "https://unizuya-stats.harshtayal710.workers.dev"

export function useAIScanQuota(userId, tool) {
  const [quota, setQuota] = useState(null) // { used, limit, allowed }
  const [loading, setLoading] = useState(true)

  const fetch_ = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`${WORKER}/ai-scans/check?userId=${userId}&tool=${tool}`)
      const data = await res.json()
      setQuota(data)
    } catch { setQuota(null) }
    finally { setLoading(false) }
  }, [userId, tool])

  useEffect(() => { fetch_() }, [fetch_])

  const increment = useCallback(async () => {
    if (!userId) return false
    try {
      const res = await fetch(`${WORKER}/ai-scans/increment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, tool }),
      })
      const data = await res.json()
      setQuota(data)
      return data.allowed !== false // false means we just used the last one but it went through; 429 = blocked
    } catch { return false }
  }, [userId, tool])

  return { quota, loading, refresh: fetch_, increment }
}
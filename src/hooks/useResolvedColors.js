// Read real computed color once so portals get an opaque value (CSS vars don't

import { useRef } from "react"

// resolve inside createPortal since it mounts outside the app root).
export default function useResolvedColors() {
  return useRef(() => {
    const s = getComputedStyle(document.documentElement)
    const get = (v) => s.getPropertyValue(v).trim()
    return {
      bg: get("--background") || "#0f1117",
      border: get("--border") || "#2d3748",
      muted: get("--muted-foreground") || "#94a3b8",
      input: get("--input") || "#1e293b",
      card: get("--card") || "#1a1f2e",
    }
  }).current()
}
// Highlights a reply element when the URL hash matches its ID.
// Returns a boolean `isHighlighted` - true for ~2.5s after landing on the hash.

import { useState, useEffect } from "react"

export default function useHashHighlight(replyId) {
  const [isHighlighted, setIsHighlighted] = useState(false)

  useEffect(() => {
    const targetHash = `#reply-${replyId}`

    const check = () => {
      if (window.location.hash === targetHash) {
        setIsHighlighted(true)
        // Scroll into view smoothly
        const el = document.getElementById(`reply-${replyId}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" })
        }
        // Fade out highlight after 2.5s
        const timer = setTimeout(() => setIsHighlighted(false), 2500)
        return () => clearTimeout(timer)
      }
    }

    // Check immediately on mount (for hard navigations)
    const cleanup = check()

    // Also listen for hash changes (for SPA navigations)
    window.addEventListener("hashchange", check)
    return () => {
      window.removeEventListener("hashchange", check)
      cleanup?.()
    }
  }, [replyId])

  return isHighlighted
}
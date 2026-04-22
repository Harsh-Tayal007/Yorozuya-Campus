// src/hooks/useReveal.js
// Lightweight CSS-only scroll reveal - replaces framer-motion whileInView.
// Adds "reveal" class on mount, then "revealed" when element enters viewport.
// Uses a single shared IntersectionObserver for all elements on the page.
import * as React from "react"

let observer = null
const callbacks = new Map()

function getObserver() {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed")
          observer.unobserve(entry.target)
          callbacks.delete(entry.target)
        }
      }
    },
    { rootMargin: "-40px 0px", threshold: 0.01 }
  )
  return observer
}

export function useReveal(delay = 0) {
  const ref = React.useRef(null)

  React.useEffect(() => {
    const el = ref.current
    if (!el) return

    el.classList.add("reveal")
    if (delay > 0) el.style.setProperty("--reveal-delay", `${delay}ms`)

    const obs = getObserver()
    obs.observe(el)

    return () => {
      obs.unobserve(el)
      callbacks.delete(el)
    }
  }, [delay])

  return ref
}

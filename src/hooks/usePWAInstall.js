// =============================================================================
// usePWAInstall.js
//
// Auto-shows the native install prompt after a short delay when the user
// opens the site. No install button needed in the navbar.
// The prompt can still be triggered manually (e.g. from Settings/Sidebar)
// via the returned `install` function.
//
// BEHAVIOUR:
//   - First visit: shows prompt after 3s delay
//   - If user dismisses: won't auto-show again for 3 days
//   - If user installs: never shows again
//   - Manual trigger: always available via install()
// =============================================================================

import { useEffect, useState, useRef } from "react"

const DISMISSED_KEY   = "pwa_prompt_dismissed_at"
const COOLDOWN_MS     = 1000 * 60 * 60 * 24 * 3  // 3 days
const AUTO_PROMPT_MS  = 3000                       // 3s after page load

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState(
    () => window.__pwaInstallPrompt ?? null
  )
  const [isInstallable, setIsInstallable] = useState(
    () => !!window.__pwaInstallPrompt &&
          !window.matchMedia("(display-mode: standalone)").matches
  )
  const autoShownRef = useRef(false)

  // ── Listen for prompt event (if it fires after mount) ────────────────────
  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) return

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      window.__pwaInstallPrompt = e
      setInstallPrompt(e)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      window.__pwaInstallPrompt = null
      localStorage.removeItem(DISMISSED_KEY)
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  // ── Auto-show after delay, respecting cooldown ───────────────────────────
  // useEffect(() => {
  //   if (!isInstallable || autoShownRef.current) return

  //   const dismissedAt = localStorage.getItem(DISMISSED_KEY)
  //   if (dismissedAt && Date.now() - Number(dismissedAt) < COOLDOWN_MS) return

  //   const timer = setTimeout(async () => {
  //     if (!window.__pwaInstallPrompt || autoShownRef.current) return
  //     autoShownRef.current = true

  //     window.__pwaInstallPrompt.prompt()
  //     const { outcome } = await window.__pwaInstallPrompt.userChoice

  //     if (outcome === "accepted") {
  //       window.__pwaInstallPrompt = null
  //       setIsInstallable(false)
  //       setInstallPrompt(null)
  //     } else {
  //       // Dismissed — store timestamp for cooldown
  //       localStorage.setItem(DISMISSED_KEY, Date.now().toString())
  //     }
  //   }, AUTO_PROMPT_MS)

  //   return () => clearTimeout(timer)
  // }, [isInstallable])

  // ── Manual trigger (for Settings / Sidebar) ──────────────────────────────
  const install = async () => {
    const prompt = window.__pwaInstallPrompt
    if (!prompt) return false

    prompt.prompt()
    const { outcome } = await prompt.userChoice

    if (outcome === "accepted") {
      window.__pwaInstallPrompt = null
      setIsInstallable(false)
      setInstallPrompt(null)
    }

    return outcome === "accepted"
  }

  return { isInstallable, install }
}
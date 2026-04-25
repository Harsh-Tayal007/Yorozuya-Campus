import { lazy, Suspense, useEffect, useState } from "react"
import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./routes/AppRoutes"

import { SidebarProvider } from "@/context/SidebarContext"
import ScrollToTop from "./components/common/navigation/ScrollToTop"
import CookieNotice from "./components/common/auth/CookieNotice"

const MascotRoot = lazy(() => import("./mascot"))

// Desktop = non-touch pointer AND min viewport 768px
const checkIsDesktop = () =>
  typeof window !== "undefined" &&
  !window.matchMedia("(pointer: coarse)").matches &&
  window.innerWidth >= 768

const App = () => {
  const [shouldLoadMascot, setShouldLoadMascot] = useState(false)
  const [isDesktop] = useState(checkIsDesktop)

  useEffect(() => {
    // Defer the heavy mascot chunk until after the first paint to protect route LCP.
    const handle = typeof requestIdleCallback !== "undefined"
      ? requestIdleCallback(() => setShouldLoadMascot(true), { timeout: 1800 })
      : setTimeout(() => setShouldLoadMascot(true), 900)

    return () => {
      if (typeof requestIdleCallback !== "undefined") {
        cancelIdleCallback(handle)
      } else {
        clearTimeout(handle)
      }
    }
  }, [])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Ctrl+M → toggle mascot visibility (Desktop only)
      if (isDesktop && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "m") {
        e.preventDefault()
        window.dispatchEvent(new CustomEvent("mascot-toggle-visibility"))
      }

      // Ctrl+D → toggle dark/light theme
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault()
        const isDark = document.documentElement.classList.contains("dark")
        const nextDark = !isDark
        document.documentElement.classList.toggle("dark", nextDark)
        localStorage.setItem("theme", nextDark ? "dark" : "light")
        // Trigger a custom event in case components rely on native events instead of context
        window.dispatchEvent(new Event("theme-changed"))
      }
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isDesktop])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SidebarProvider>
        <AppRoutes />
        <CookieNotice />
        {/* Mascot: desktop only. Mobile gets nothing (no render at all). */}
        {isDesktop && shouldLoadMascot && (
          <Suspense fallback={null}>
            <MascotRoot />
          </Suspense>
        )}
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App

// src/components/common/auth/LoginGateSheet.jsx
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { BookOpen, FileText, Calculator, Bell, Zap } from "lucide-react"

const BENEFITS = [
  { icon: BookOpen,   text: "Personalised syllabus & resources for your branch" },
  { icon: FileText,   text: "Access PYQs organised by semester and subject" },
  { icon: Calculator, text: "CGPA calculator, task tracker & timetable builder" },
  { icon: Bell,       text: "University notices and academic event updates" },
  { icon: Zap,        text: "Student forum — ask, answer, earn karma" },
]

const SWIPE_CLOSE_THRESHOLD  = 80    // px dragged down before snap-close
const SWIPE_VELOCITY_THRESHOLD = 0.4 // px/ms — fast flick closes even if short

export default function LoginGateSheet({ isOpen, onClose, redirectTo, featureName }) {
  const navigate = useNavigate()
  const sheetRef = useRef(null)

  // ── Swipe state ─────────────────────────────────────────────────────────────
  const dragStartY    = useRef(null)
  const dragStartTime = useRef(null)
  const isDragging    = useRef(false)
  const [dragOffset, setDragOffset] = useState(0)

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  // Reset drag offset whenever sheet opens or closes
  useEffect(() => { setDragOffset(0) }, [isOpen])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isOpen, onClose])

  // ── Touch handlers (attached to drag handle only) ────────────────────────────
  const onTouchStart = (e) => {
    dragStartY.current    = e.touches[0].clientY
    dragStartTime.current = Date.now()
    isDragging.current    = true
  }

  const onTouchMove = (e) => {
    if (!isDragging.current || dragStartY.current === null) return
    const delta = e.touches[0].clientY - dragStartY.current
    if (delta < 0) { setDragOffset(0); return }   // no upward drag
    // Rubber-band resistance past threshold
    const offset = delta < SWIPE_CLOSE_THRESHOLD
      ? delta
      : SWIPE_CLOSE_THRESHOLD + (delta - SWIPE_CLOSE_THRESHOLD) * 0.3
    setDragOffset(offset)
  }

  const onTouchEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false

    const elapsed  = Date.now() - dragStartTime.current
    const velocity = dragOffset / Math.max(elapsed, 1)   // px/ms
    const shouldClose =
      dragOffset >= SWIPE_CLOSE_THRESHOLD ||
      velocity   >= SWIPE_VELOCITY_THRESHOLD

    setDragOffset(0)   // always reset — CSS transition handles close animation
    if (shouldClose) onClose()

    dragStartY.current    = null
    dragStartTime.current = null
  }

  const buildLoginUrl = () => {
    const base = "/login"
    return redirectTo ? `${base}?redirect=${encodeURIComponent(redirectTo)}` : base
  }

  const handleLogin  = () => { onClose(); navigate(buildLoginUrl()) }
  const handleSignup = () => { onClose(); navigate("/signup") }

  // While finger is down use inline transform (no transition — follows finger).
  // Otherwise let CSS transition handle open/close animation.
  const translateY      = !isOpen ? "100%" : dragOffset > 0 ? `${dragOffset}px` : "0"
  const useTransition   = dragOffset === 0
  const backdropOpacity = isOpen ? Math.max(0, 1 - dragOffset / 300) : 0

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{ opacity: backdropOpacity }}
        className={`fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm
                    transition-opacity duration-300
                    ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Sign in to access this feature"
        style={{
          transform:  `translateY(${translateY})`,
          transition: useTransition
            ? "transform 300ms cubic-bezier(0.32,0.72,0,1)"
            : "none",
        }}
        className="fixed bottom-0 left-0 right-0 z-[70]
                   bg-background dark:bg-[#0d1526]
                   border-t border-border/60
                   rounded-t-2xl
                   shadow-[0_-8px_40px_rgba(0,0,0,0.25)]"
      >
        {/* ── Drag handle — the only touch target for swiping ── */}
        <div
          className="flex justify-center pt-3 pb-3
                     cursor-grab active:cursor-grabbing
                     touch-none select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="w-9 h-1 rounded-full bg-border/70" />
        </div>

        <div className="px-5 pb-8 pt-1 max-w-lg mx-auto">

          {/* Heading */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <Zap size={13} className="text-indigo-500" />
              </div>
              <h2 className="text-base font-bold text-foreground">
                {featureName
                  ? `Sign in to use ${featureName}`
                  : "Sign in to unlock this feature"}
              </h2>
            </div>
            <p className="text-xs text-muted-foreground ml-9">
              Free to join — takes less than a minute.
            </p>
          </div>

          {/* Benefits */}
          <ul className="space-y-2.5 mb-6">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-indigo-500/10 flex items-center
                                justify-center shrink-0 mt-0.5">
                  <Icon size={11} className="text-indigo-400" />
                </div>
                <span className="text-xs text-muted-foreground leading-relaxed">{text}</span>
              </li>
            ))}
          </ul>

          {/* CTAs */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleSignup}
              className="w-full py-2.5 rounded-xl text-sm font-semibold
                         bg-gradient-to-r from-blue-500 to-indigo-500
                         text-white shadow-sm
                         hover:opacity-90 active:scale-[0.98]
                         transition-all duration-150"
            >
              Create free account
            </button>

            <button
              onClick={handleLogin}
              className="w-full py-2.5 rounded-xl text-sm font-medium
                         border border-border bg-background/60
                         text-foreground
                         hover:bg-muted active:scale-[0.98]
                         transition-all duration-150"
            >
              Already have an account? Sign in
            </button>
          </div>

        </div>
      </div>
    </>
  )
}
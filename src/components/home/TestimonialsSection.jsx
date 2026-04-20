// src/components/home/TestimonialsSection.jsx
import { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { useReveal } from "@/hooks/useReveal"

const TESTIMONIALS = [
  {
    quote:
      "Building Unizuya together has been an incredible learning journey. We turned a college project into a real academic platform that students can actually rely on every semester.",
    name: "Harsh Tayal",
    role: "Founder & Lead Developer",
    initials: "HT",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    quote:
      "Working on Unizuya helped us understand real-world development - from backend architecture to UI polish. It's the kind of project you learn more from than any textbook.",
    name: "Kuldeep Vashisth",
    role: "Contributor & Co-Developer",
    initials: "KV",
    gradient: "from-emerald-500 to-teal-500",
  },
]

const AUTOPLAY_MS = 6000

export default function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [transitioning, setTransitioning] = useState(false)
  const sectionRef = useReveal()

  const changeTo = useCallback((i) => {
    if (transitioning) return
    setTransitioning(true)
    // Fade out, then swap, then fade in
    setTimeout(() => {
      setCurrent(i)
      setTransitioning(false)
    }, 250)
  }, [transitioning])

  const next = useCallback(
    () => changeTo((current + 1) % TESTIMONIALS.length),
    [current, changeTo]
  )
  const prev = useCallback(
    () => changeTo((current - 1 + TESTIMONIALS.length) % TESTIMONIALS.length),
    [current, changeTo]
  )

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [paused, next])

  const t = TESTIMONIALS[current]

  return (
    <section ref={sectionRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="text-center mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
          From the builders
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          What we built together
        </h2>
      </div>

      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(99,102,241,0.1) 50%, rgba(139,92,246,0.06) 100%)",
          border: "1px solid rgba(99,102,241,0.15)",
        }}>

        {/* Decorative quote icon */}
        <div className="absolute top-5 right-6 opacity-[0.06] pointer-events-none">
          <Quote size={80} />
        </div>

        <div className="relative z-10 px-6 sm:px-10 py-10 sm:py-12">
          {/* Quote content - CSS transition instead of AnimatePresence */}
          <div
            className="space-y-6 transition-opacity duration-250 ease-out"
            style={{ opacity: transitioning ? 0 : 1 }}
          >
            <blockquote className="text-base sm:text-lg font-medium text-foreground/90 leading-relaxed max-w-xl">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient}
                              flex items-center justify-center shadow-md`}>
                <span className="text-white text-xs font-bold">{t.initials}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => changeTo(i)}
                  aria-label={`Go to testimonial ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all duration-300
                    ${i === current
                      ? "w-6 bg-indigo-500"
                      : "w-1.5 bg-slate-300 dark:bg-white/20 hover:bg-slate-400 dark:hover:bg-white/30"
                    }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={prev}
                aria-label="Previous testimonial"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10
                           bg-white dark:bg-white/5 flex items-center justify-center
                           text-muted-foreground hover:text-foreground hover:border-indigo-400/50
                           transition-all duration-150"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={next}
                aria-label="Next testimonial"
                className="w-8 h-8 rounded-lg border border-slate-200 dark:border-white/10
                           bg-white dark:bg-white/5 flex items-center justify-center
                           text-muted-foreground hover:text-foreground hover:border-indigo-400/50
                           transition-all duration-150"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

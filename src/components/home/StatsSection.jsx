// src/components/home/StatsSection.jsx
import { useState, useEffect, useRef } from "react"
import { useCountUp } from "@/hooks/useCountUp"

function StatCard({ value, label, index }) {
  const [started, setStarted] = useState(false)
  const ref = useRef(null)
  const animated = useCountUp(value ?? 0, started)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Add reveal class
    el.classList.add("reveal")
    el.style.setProperty("--reveal-delay", `${index * 80}ms`)

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed")
          setStarted(true)
          obs.disconnect()
        }
      },
      { rootMargin: "-40px 0px", threshold: 0.01 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [index])

  return (
    <div ref={ref}>
      <div className="bg-white dark:bg-white/[0.03]
                      border border-slate-200 dark:border-white/8
                      rounded-2xl px-4 py-6 sm:py-8 text-center shadow-sm
                      hover:border-indigo-400/40 hover:shadow-md
                      transition-[border-color,box-shadow] duration-200 ease-out">
        <p className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500
                      bg-clip-text text-transparent tabular-nums">
          {animated}
        </p>
        <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2 font-medium">
          {label}
        </p>
      </div>
    </div>
  )
}

export default function StatsSection({ stats, isLoading }) {
  if (isLoading || !stats) return null

  const items = [
    { value: stats.syllabus,  label: "Syllabus items" },
    { value: stats.units,     label: "Units covered" },
    { value: stats.resources, label: "Study resources" },
    { value: stats.pyqs,      label: "Past year papers" },
  ]

  return (
    <section>
      <div className="text-center mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
          Our impact
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
          Growing every week
        </h2>
        <p className="text-sm text-muted-foreground mt-2">
          Real numbers from the platform, updated in real time.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {items.map((item, i) => (
          <StatCard key={item.label} value={item.value} label={item.label} index={i} />
        ))}
      </div>
    </section>
  )
}

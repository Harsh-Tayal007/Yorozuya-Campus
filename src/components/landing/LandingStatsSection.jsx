import { useState } from "react"
import { motion } from "framer-motion"
import { useCountUp } from "@/hooks/useCountUp"

export default function LandingStatsSection({ stats }) {
  const [hasAnimated, setHasAnimated] = useState(false)

  if (!stats) return null // prevents animation starting with 0

  return (
    <section className="relative py-20 md:py-28">
      {/* 🌌 Background Glow */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-100px] left-[20%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-120px] right-[15%] w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        onViewportEnter={() => setHasAnimated(true)}
        className="max-w-6xl mx-auto px-6"
      >
        <div className="text-center mb-14 md:mb-20">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            Our Academic Impact
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground mt-4 max-w-xl mx-auto">
            Helping students access resources, syllabus and PYQs effortlessly.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          <StatItem label="Resources" value={stats.resources} start={hasAnimated} />
          <StatItem label="Units" value={stats.units} start={hasAnimated} />
          <StatItem label="Syllabus" value={stats.syllabus} start={hasAnimated} />
          <StatItem label="PYQs" value={stats.pyqs} start={hasAnimated} />
        </div>
      </motion.div>
    </section>
  )
}

function StatItem({ label, value, start }) {
  const animatedValue = useCountUp(value, start)

  return (
    <motion.div
      className="relative group rounded-xl"
      // whileHover={{ y: -3, scale: 1.015 }}
      transition={{ duration: 0.3 }}
    >
      {/* 🔥 Glow Layer */}
      <div
        className="
          absolute inset-0 rounded-xl
          bg-gradient-to-r from-blue-500/40 to-indigo-500/40
          opacity-0 group-hover:opacity-100
          blur-md
          transition-opacity duration-300
          pointer-events-none
        "
      />

      {/* 💎 Actual Card */}
      <div
        className="
          relative
          bg-card
          border border-border
          shadow-sm
          rounded-xl
          p-6 md:p-10
          text-center
          transition-all duration-200
          group-hover:border-blue-500/60
        "
      >
        <div className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
          {animatedValue}
        </div>

        <p className="mt-3 text-xs sm:text-sm uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
      </div>
    </motion.div>
  )
}

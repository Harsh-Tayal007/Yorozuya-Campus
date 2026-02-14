import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const DURATION = 5000

const testimonials = [
  {
    quote:
      "Building Unizuya together has been an incredible learning journey. We turned a college project task into a real academic platform.",
    name: "Harsh Tayal",
    role: "Co-Founder & Developer",
    avatar: "https://i.pravatar.cc/150?img=3",
  },
  {
    quote:
      "Working on Unizuya helped us understand real-world development — from backend architecture to UI polish.",
    name: "Kuldeep Vashisth",
    role: "Co-Founder & Designer",
    avatar: "https://i.pravatar.cc/150?img=13",
  },
]

export default function TestimonialsSection() {
  const [index, setIndex] = useState(0)
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    if (!isInView) return

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonials.length)
    }, DURATION)

    return () => clearInterval(interval)
  }, [isInView])

  return (
    <section className="relative py-28 overflow-hidden ">

      <div className="
  relative
  mx-auto
  max-w-4xl
  rounded-[32px]
  border border-white/10
  bg-white/5
  backdrop-blur-2xl
  shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]
  px-10 py-16
  text-center
  
">
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        {/* 🌌 Background Glow */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="
    absolute inset-0
    bg-[radial-gradient(circle_at_50%_30%,rgba(99,102,241,0.18),transparent_60%)]
  " />
          <div className="
    absolute inset-0
    bg-[radial-gradient(circle_at_50%_80%,rgba(59,130,246,0.15),transparent_60%)]
  " />
        </div>


        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          onViewportEnter={() => setIsInView(true)}
          className="mx-auto max-w-5xl px-6"
        >
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-10"
          >
            What We Built Together
          </h2>

          <div className="min-h-[140px]">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4 }}
                className="text-lg md:text-2xl font-medium text-foreground/90 leading-relaxed"
              >
                “{testimonials[index].quote}”
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* Avatar + Info */}
          <div className="mt-10 flex justify-center items-center gap-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-4"
              >
                <img
                  src={testimonials[index].avatar}
                  alt="avatar"
                  className="
                  w-14 h-14 rounded-full object-cover
                  ring-2 ring-blue-500/30 shadow-[0_0_25px_rgba(59,130,246,0.25)]

                "
                />

                <div className="text-left">
                  <div className="font-medium text-lg text-foreground">
                    {testimonials[index].name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonials[index].role}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Indicator Dots */}
          <div className="mt-8 flex justify-center gap-3">
            {testimonials.map((_, i) => (
              <div
                key={i}
                className={`
                h-2 w-2 rounded-full transition-all duration-300
                ${i === index
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 w-6"
                    : "bg-white/20"
                  }
              `}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

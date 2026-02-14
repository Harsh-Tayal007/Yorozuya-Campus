import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Construction } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { BorderBeam } from "@/components/ui/border-beam"
import { LandingStatsSection, TestimonialsSection } from "@/components/landing"

import { getPublicStats } from "@/services/statsService"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Footer } from "@/components"


const Home = () => {
  const [showInfo, setShowInfo] = useState(false)

  const { data: publicStats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: getPublicStats,
  })



  return (
    <div className="min-h-screen flex flex-col">

      {/* Main Content */}
      <div className="relative px-6 py-12">

        {/* 🌌 Subtle Animated Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-[-100px] left-[-100px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-120px] right-[-120px] w-[300px] h-[300px] sm:w-[400px] sm:h-[400px] bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
        </div>

        {/* 🧱 Content Container */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >

            {/* 🚧 Badge */}
            <BorderBeam duration={8}>
              <div
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                onClick={() => setShowInfo((prev) => !prev)}
                className="rounded-lg bg-muted/40 backdrop-blur px-4 py-3 text-center cursor-pointer transition hover:bg-muted/60"
              >
                <div className="flex items-center justify-center gap-2 font-medium text-primary">
                  <Construction className="w-4 h-4" />
                  Under Construction
                </div>

                <AnimatePresence>
                  {showInfo && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 text-sm text-muted-foreground"
                    >
                      Unizuya is currently in active development. Some features may be limited
                      or unavailable at the moment. More academic resources and improvements
                      will be added in future updates.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </BorderBeam>



            {/* 👋 Heading */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Unizuya
              </span>
            </h1>

            {/* 📘 Description */}
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              A unified academic platform designed to help students access PYQs,
              syllabus, and study materials — all in one place.
            </p>

            {/* 🧠 Brand Story Block — PUT IT HERE */}
            <div className="max-w-2xl mx-auto text-left">
              <div className="rounded-lg border-l-4 border-muted bg-muted/40 px-4 py-4 text-sm text-muted-foreground transition hover:border-primary/40">
                <p className="leading-relaxed">
                  The name{" "}

                  <motion.span
                    whileHover={{
                      backgroundColor: "rgba(59,130,246,0.15)",
                      padding: "0 6px",
                      borderRadius: "6px",
                    }}
                    transition={{ duration: 0.2 }}
                    className="font-semibold text-foreground cursor-default"
                  >
                    Unizuya
                  </motion.span>{" "}

                  is inspired by the idea of{" "}

                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="italic font-medium text-foreground cursor-default"
                  >
                    “Odd Jobs”
                  </motion.span>{" "}

                  — a concept from Japanese pop culture where a single platform takes care of many different needs. In the same spirit, Unizuya brings together multiple academic services to make student life simpler and more organized.
                </p>
              </div>
            </div>


            {/* 👉 CTA */}
            <div className="pt-4">
              <Link to="/universities">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:scale-105 transition duration-300"
                >
                  Browse Universities
                </Button>
              </Link>
            </div>

            {/* 🧭 Helper text */}
            <p className="text-xs sm:text-sm text-muted-foreground pt-2">
              Start by selecting a university to explore programs and resources.
            </p>

          </motion.div>
        </div>

        {/* 📊 Stats Section */}
        <LandingStatsSection stats={publicStats} />

        {/* Testimonials Section */}
        <TestimonialsSection />


      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default Home

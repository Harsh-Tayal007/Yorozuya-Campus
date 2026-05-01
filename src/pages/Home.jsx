// src/pages/Home.jsx
// ---------------------------------------------------------
// ONLY eager: hero + "what is" section
// Everything else is lazy / deferred for performance
// ---------------------------------------------------------
import { useState, useEffect, useRef, lazy, Suspense } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Zap, Check, Users, Shield, Bell, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { getPublicStats } from "@/services/admin/statsService"
import { Skeleton } from "@/components/ui/skeleton"
import useSeoMeta from "@/hooks/useSeoMeta"
import { useUIPrefs } from "@/context/UIPrefsContext"

// -- Lazy heavy chunks (only downloaded when needed) --
const AnimatedBlobs = lazy(() => import("@/components/home/AnimatedBlobs"))
const ParticleSphere = lazy(() => import("@/components/home/ParticleSphere"))
const AntigravityShapes = lazy(() => import("@/components/home/AntigravityShapes"))
const LevitatingSphere = lazy(() => import("@/components/home/LevitatingSphere"))
const AuthModal = lazy(() => import("@/components/home/AuthModal"))
const RoadmapModal = lazy(() => import("@/components/home/RoadmapModal"))
const FeaturesGrid = lazy(() => import("@/components/home/FeaturesGrid"))
const HowItWorks = lazy(() => import("@/components/home/HowItWorks"))
const StatsSection = lazy(() => import("@/components/home/StatsSection"))
const ToolsShowcase = lazy(() => import("@/components/home/ToolsShowcase"))
const RolesSection = lazy(() => import("@/components/home/RolesSection"))
const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"))
const FAQSection = lazy(() => import("@/components/home/FAQSection"))
const TargetCursor = lazy(() => import("@/components/home/TargetCursor"))
const DotField = lazy(() => import("@/components/home/DotField"))
import GlareHover from "@/components/ui/glare-hover"
import SpotlightCard from "@/components/ui/SpotlightCard"
import RotatingText from "@/components/ui/RotatingText"
import ScrollReveal from "@/components/ui/ScrollReveal"


// -- Lightweight inline constants --
const FEATURES_SUMMARY = [
  "Syllabus and unit notes",
  "Past year questions",
  "Uploadable study resources",
  "Student discussion forum",
  "CGPA and grade calculator",
  "Attendance tracking",
  "University notices and events",
]

export default function Home() {
  const { currentUser, isLoading: authLoading } = useAuth()
  const [authModal, setAuthModal] = useState({ open: false, mode: "signup" })
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  const { resolved } = useUIPrefs()
  const blobsEnabled = resolved.animatedBg
  const confettiEnabled = resolved.confettiBg
  const antigravityEnabled = resolved.antigravityBg
  const levitatingEnabled = resolved.levitatingBg
  const targetCursorEnabled = resolved.targetCursor
  const glareEnabled = resolved.glareHover
  const dotFieldEnabled = resolved.dotField

  // Track hover states for manual GlareHover buttons
  const [heroHover1, setHeroHover1] = useState(false)
  const [heroHover2, setHeroHover2] = useState(false)
  const [heroHover3, setHeroHover3] = useState(false)
  const [ctaHover, setCtaHover] = useState(false)


  // Defer rendering until after first paint (only when enabled)
  const [blobsReady, setBlobsReady] = useState(false)
  const [confettiReady, setConfettiReady] = useState(false)
  const [antigravityReady, setAntigravityReady] = useState(false)
  const [levitatingReady, setLevitatingReady] = useState(false)
  const [targetCursorReady, setTargetCursorReady] = useState(false)
  const [dotFieldReady, setDotFieldReady] = useState(false)
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"))
  const featuresRef = useRef(null)

  useSeoMeta({
    title: "Unizuya - Academic Platform for Students",
    description:
      "Unizuya brings together syllabus, PYQs, study resources, student forum, attendance tools, and productivity workflows into one academic platform.",
  })

  // Defer background animations - don't block LCP
  useEffect(() => {
    if (!blobsEnabled) return
    const id = requestIdleCallback
      ? requestIdleCallback(() => setBlobsReady(true), { timeout: 1500 })
      : setTimeout(() => setBlobsReady(true), 300)
    return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id))
  }, [blobsEnabled])

  useEffect(() => {
    if (!confettiEnabled) return
    const id = requestIdleCallback
      ? requestIdleCallback(() => setConfettiReady(true), { timeout: 800 })
      : setTimeout(() => setConfettiReady(true), 200)
    return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id))
  }, [confettiEnabled])

  useEffect(() => {
    if (!antigravityEnabled) return
    const id = requestIdleCallback
      ? requestIdleCallback(() => setAntigravityReady(true), { timeout: 800 })
      : setTimeout(() => setAntigravityReady(true), 200)
    return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id))
  }, [antigravityEnabled])

  useEffect(() => {
    if (!levitatingEnabled) return
    const id = requestIdleCallback
      ? requestIdleCallback(() => setLevitatingReady(true), { timeout: 800 })
      : setTimeout(() => setLevitatingReady(true), 200)
    return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id))
  }, [levitatingEnabled])

  useEffect(() => {
    if (!targetCursorEnabled) return
    const id = requestIdleCallback
      ? requestIdleCallback(() => setTargetCursorReady(true), { timeout: 1000 })
      : setTimeout(() => setTargetCursorReady(true), 300)
    return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id))
  }, [targetCursorEnabled])

  useEffect(() => {
    if (!dotFieldEnabled) return
    const id = requestIdleCallback
      ? requestIdleCallback(() => setDotFieldReady(true), { timeout: 1200 })
      : setTimeout(() => setDotFieldReady(true), 400)
    return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id))
  }, [dotFieldEnabled])

  // Listen for theme changes to update DotField colors
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => observer.disconnect()
  }, [])

  // Lock scroll when roadmap open
  useEffect(() => {
    document.body.style.overflow = roadmapOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [roadmapOpen])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: getPublicStats,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  const openAuth = (mode = "signup") => setAuthModal({ open: true, mode })
  const closeAuth = () => setAuthModal(a => ({ ...a, open: false }))
  const switchAuth = (mode) => setAuthModal({ open: true, mode })
  const scrollToFeatures = () => featuresRef.current?.scrollIntoView({ behavior: "smooth" })

  return (
    <div className="min-h-screen flex flex-col">

      {/* Background animations - only rendered if user opted in via Settings > Preferences */}
      {blobsEnabled && blobsReady && (
        <Suspense fallback={null}>
          <AnimatedBlobs />
        </Suspense>
      )}
      {confettiEnabled && confettiReady && (
        <Suspense fallback={null}>
          <ParticleSphere />
        </Suspense>
      )}
      {antigravityEnabled && antigravityReady && (
        <Suspense fallback={null}>
          <AntigravityShapes />
        </Suspense>
      )}
      {levitatingEnabled && levitatingReady && (
        <Suspense fallback={null}>
          <LevitatingSphere />
        </Suspense>
      )}
      {targetCursorEnabled && targetCursorReady && (
        <Suspense fallback={null}>
          <TargetCursor />
        </Suspense>
      )}
      {dotFieldEnabled && dotFieldReady && (
        <div className="fixed inset-0 -z-20 pointer-events-none">
          <Suspense fallback={null}>
            <DotField
              dotRadius={1.5}
              dotSpacing={14}
              bulgeStrength={67}
              glowRadius={160}
              sparkle={false}
              waveAmplitude={0}
              cursorRadius={500}
              cursorForce={0.1}
              bulgeOnly
              gradientFrom={isDark ? "#A855F7" : "#8B5CF6"}
              gradientTo={isDark ? "#B497CF" : "#C084FC"}
              glowColor={isDark ? "rgba(168, 85, 247, 0.15)" : "rgba(18, 15, 23, 0.08)"}
            />
          </Suspense>
        </div>
      )}

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-20">

        {/* ── 01 HERO ── */}
        <section className="pt-10 text-center space-y-6">
          {/* CSS-only fade-up - zero JS weight */}
          <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                            border border-amber-400/35 bg-amber-400/8 text-amber-500 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Work in progress - more coming soon
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "70ms" }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.2] tracking-tight flex flex-col items-center">
              <span>Your campus life,</span>
              <RotatingText
                texts={['all in one place', 'simplified', 'organised', 'in your pocket']}
                mainClassName="px-4 sm:px-6 py-1 sm:py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white overflow-hidden rounded-2xl justify-center mt-2 sm:mt-3 shadow-xl shadow-blue-500/20"
                staggerFrom="last"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-120%", opacity: 0 }}
                staggerDuration={0.02}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={3000}
                splitBy="characters"
                auto
                loop
              />
            </h1>
            <p className="mt-4 text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Unizuya brings together syllabus, past year questions, study resources and a student
              forum so you spend less time hunting for things and more time actually studying.
            </p>
          </div>

          <div className="animate-fade-up flex flex-wrap justify-center gap-3" style={{ animationDelay: "140ms" }}>
            {authLoading ? (
              <Skeleton className="h-11 w-40 rounded-xl" />
            ) : currentUser ? (
              <Link to="/dashboard"
                onMouseEnter={() => setHeroHover1(true)}
                onMouseLeave={() => setHeroHover1(false)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                           bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                           text-sm font-semibold shadow-lg shadow-blue-500/25
                           hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] 
                           transition-all duration-150 cursor-target relative overflow-hidden">
                <GlareHover enabled={glareEnabled} active={heroHover1} />
                <span className="relative z-10 flex items-center gap-2">
                  Go to Dashboard <ChevronRight size={14} />
                </span>
              </Link>
            ) : (
              <>
                <Link to="/universities"
                  onMouseEnter={() => setHeroHover2(true)}
                  onMouseLeave={() => setHeroHover2(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                             text-sm font-semibold shadow-lg shadow-blue-500/25
                             hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] 
                             transition-all duration-150 cursor-target relative overflow-hidden">
                  <GlareHover enabled={glareEnabled} active={heroHover2} />
                  <span className="relative z-10 flex items-center gap-2">
                    Browse content <ChevronRight size={14} />
                  </span>
                </Link>
                <button onClick={scrollToFeatures}
                  onMouseEnter={() => setHeroHover3(true)}
                  onMouseLeave={() => setHeroHover3(false)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             border border-border bg-background/80 text-sm font-medium text-foreground
                             hover:bg-muted hover:-translate-y-0.5 active:scale-[0.98] 
                             transition-all duration-150 cursor-target relative overflow-hidden">
                  <GlareHover enabled={glareEnabled} active={heroHover3} />
                  <span className="relative z-10">See what's inside</span>
                </button>
              </>
            )}
          </div>
        </section>

        {/* ── 02 HOW IT WORKS ── */}
        <Suspense fallback={<SectionSkeleton lines={3} />}>
          <HowItWorks />
        </Suspense>

        {/* ── 03 ANIMATED STATS ── */}
        <Suspense fallback={
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        }>
          <StatsSection stats={stats} isLoading={statsLoading} />
        </Suspense>

        {/* ── 04 WHAT IS UNIZUYA ── */}
        <section id="about">
          <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">
                What is Unizuya?
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-5 leading-tight">
                One platform, everything you need
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <ScrollReveal
                  baseOpacity={0.1}
                  enableBlur={true}
                  baseRotation={1}
                  blurStrength={2}
                  textClassName="text-sm font-medium"
                >
                  The name is inspired by the idea of a one-stop shop that handles many different
                  needs, like that one place in the neighbourhood that somehow does it all.
                </ScrollReveal>

                <ScrollReveal
                  baseOpacity={0.1}
                  enableBlur={true}
                  baseRotation={1}
                  blurStrength={2}
                  textClassName="text-sm font-medium"
                >
                  Students switch between four or five different platforms just to find syllabus,
                  past papers, notes and a place to ask questions. Unizuya puts all of that in one
                  spot, organised by university, branch and course.
                </ScrollReveal>

                <ScrollReveal
                  baseOpacity={0.1}
                  enableBlur={true}
                  baseRotation={1}
                  blurStrength={2}
                  textClassName="text-sm font-medium"
                >
                  Think of it as your academic companion, built by students who were tired of the
                  same scattered mess.
                </ScrollReveal>
              </div>
            </div>

            <SpotlightCard className="rounded-2xl p-6 sm:p-7"
              style={{
                background: isDark
                  ? "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 27, 75, 0.9) 100%)"
                  : "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(99,102,241,0.11) 100%)",
                border: isDark
                  ? "1px solid rgba(99,102,241,0.25)"
                  : "1px solid rgba(99,102,241,0.18)",
              }}>
              {FEATURES_SUMMARY.map((item, i) => (
                <div key={item}
                  className={`flex items-center gap-3 py-2.5 text-sm text-foreground
                    ${i < FEATURES_SUMMARY.length - 1 ? "border-b border-indigo-200/30 dark:border-white/[0.06]" : ""}`}>
                  <div className="w-5 h-5 rounded-full bg-indigo-500/15 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-indigo-500" />
                  </div>
                  {item}
                </div>
              ))}
            </SpotlightCard>
          </div>
        </section>

        {/* ── 05 FEATURES GRID ── */}
        <section ref={featuresRef}>
          <div className="text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
              What you can do
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Built around how students actually work
            </h2>
          </div>
          <Suspense fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          }>
            <FeaturesGrid />
          </Suspense>
        </section>

        {/* ── 06 PRODUCTIVITY TOOLS ── */}
        <Suspense fallback={<SectionSkeleton lines={3} />}>
          <ToolsShowcase />
        </Suspense>

        {/* ── 07 FOR STUDENTS & TEACHERS ── */}
        <Suspense fallback={<SectionSkeleton lines={2} />}>
          <RolesSection />
        </Suspense>

        {/* ── 08 TESTIMONIALS ── */}
        <Suspense fallback={<Skeleton className="h-52 rounded-2xl" />}>
          <TestimonialsSection />
        </Suspense>

        {/* ── 09 FAQ ── */}
        <Suspense fallback={<SectionSkeleton lines={6} />}>
          <FAQSection />
        </Suspense>

        {/* ── ROADMAP TRIGGER ── */}
        <div className="flex justify-center">
          <button onClick={() => setRoadmapOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                       border border-border bg-white dark:bg-slate-950 shadow-sm
                       text-sm text-muted-foreground hover:text-foreground
                       hover:border-indigo-400/50 hover:shadow-md transition-all duration-200 cursor-target">
            <Zap size={13} className="text-indigo-500" />
            View roadmap - see what's done and what's next
            <ChevronRight size={13} />
          </button>
        </div>

        {/* ── CTA - guests only ── */}
        {!authLoading && !currentUser && (
          <section>
            <div className="rounded-2xl overflow-hidden relative"
              style={{
                background: "linear-gradient(135deg, #1e3a6e 0%, #312e81 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
              <div className="absolute top-[-50px] right-[-50px] w-[180px] h-[180px] rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
              <div className="absolute bottom-[-40px] left-[-40px] w-[150px] h-[150px] rounded-full bg-white/[0.03] blur-xl pointer-events-none" />
              <div className="relative z-10 px-6 sm:px-12 py-12 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs text-white/60 mb-5">
                  <Users size={11} /> Built for students, by students
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                  Ready to make campus life a little less chaotic?
                </h2>
                <p className="text-sm text-white/60 mb-7 max-w-md mx-auto leading-relaxed">
                  Join students who've already ditched the scattered approach. Everything you need,
                  one place, no signup fees.
                </p>
                <div className="flex flex-wrap gap-5 justify-center mb-8">
                  {[
                    { icon: Shield, label: "Free to join" },
                    { icon: Bell, label: "No ads, no tracking" },
                    { icon: Zap, label: "Growing every week" },
                    { icon: Users, label: "Built by students" },
                  ].map(({ label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 flex-shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
                <button onClick={() => openAuth("signup")}
                  onMouseEnter={() => setCtaHover(true)}
                  onMouseLeave={() => setCtaHover(false)}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-[#312e81]
                             text-sm font-bold hover:bg-white/90 hover:scale-[1.02]
                             active:scale-[0.98] transition-all duration-150 shadow-lg cursor-target relative overflow-hidden">
                  <GlareHover enabled={glareEnabled} active={ctaHover} glareColor="#312e81" glareOpacity={0.15} />
                  <span className="relative z-10 flex items-center gap-2">
                    Create a free account <ArrowRight size={14} />
                  </span>
                </button>
                <p className="mt-4 text-xs text-white/30">
                  Already have an account?{" "}
                  <button onClick={() => openAuth("login")}
                    className="text-blue-400/70 hover:text-blue-300 transition underline underline-offset-2">
                    Sign in
                  </button>
                </p>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* ── Modals - only rendered (and downloaded) when opened ── */}
      {authModal.open && (
        <Suspense fallback={null}>
          <AuthModal
            open={authModal.open}
            mode={authModal.mode}
            onClose={closeAuth}
            onSwitch={switchAuth}
          />
        </Suspense>
      )}

      {roadmapOpen && (
        <Suspense fallback={null}>
          <RoadmapModal open={roadmapOpen} onClose={() => setRoadmapOpen(false)} />
        </Suspense>
      )}

    </div>
  )
}

// -- Reusable skeleton for lazy sections --
function SectionSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-7 w-64 rounded-lg" />
      </div>
      <div className={`grid grid-cols-1 sm:grid-cols-${lines} gap-3`}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-36 rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
// src/pages/Home.jsx
// ─────────────────────────────────────────────
// ONLY eager: hero + stats + "what is" section
// Everything else is lazy / deferred
// ─────────────────────────────────────────────
import { useState, useEffect, useRef, lazy, Suspense } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Zap, Check, Users, Shield, Bell, ArrowRight } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { getPublicStats } from "@/services/admin/statsService"
import { Skeleton } from "@/components/ui/skeleton"
import useSeoMeta from "@/hooks/useSeoMeta"

// ── Lazy heavy chunks (only downloaded when needed) ──
const AnimatedBlobs  = lazy(() => import("@/components/home/AnimatedBlobs"))
const AuthModal      = lazy(() => import("@/components/home/AuthModal"))
const RoadmapModal   = lazy(() => import("@/components/home/RoadmapModal"))
const FeaturesGrid   = lazy(() => import("@/components/home/FeaturesGrid"))

// ── Lightweight inline motion wrapper ──
// We avoid importing all of framer-motion at the top level.
// Hero animations are CSS-only to keep the initial JS bundle tiny.
// ─────────────────────────────────────────────

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
  const [authModal, setAuthModal]     = useState({ open: false, mode: "signup" })
  const [roadmapOpen, setRoadmapOpen] = useState(false)
  // Defer heavy background blobs until after first paint
  const [blobsReady, setBlobsReady]   = useState(false)
  const featuresRef = useRef(null)

  useSeoMeta({
    title: "Unizuya - Academic Platform for Students",
    description:
      "Unizuya brings together syllabus, PYQs, study resources, student forum, attendance tools, and productivity workflows into one academic platform.",
  })

  // Defer blob rendering — don't block LCP
  useEffect(() => {
    const id = requestIdleCallback
      ? requestIdleCallback(() => setBlobsReady(true), { timeout: 1500 })
      : setTimeout(() => setBlobsReady(true), 300)
    return () => (requestIdleCallback ? cancelIdleCallback(id) : clearTimeout(id))
  }, [])

  // Lock scroll when roadmap open
  useEffect(() => {
    document.body.style.overflow = roadmapOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [roadmapOpen])

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: getPublicStats,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24,
  })

  const openAuth  = (mode = "signup") => setAuthModal({ open: true, mode })
  const closeAuth = () => setAuthModal(a => ({ ...a, open: false }))
  const switchAuth = (mode) => setAuthModal({ open: true, mode })
  const scrollToFeatures = () => featuresRef.current?.scrollIntoView({ behavior: "smooth" })

  return (
    <div className="min-h-screen flex flex-col">

      {/* Blobs deferred — doesn't block LCP */}
      {blobsReady && (
        <Suspense fallback={null}>
          <AnimatedBlobs />
        </Suspense>
      )}

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-10 space-y-16">

        {/* ── HERO ── */}
        <section className="pt-10 text-center space-y-6">
          {/* CSS-only fade-up — zero JS weight */}
          <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                            border border-amber-400/35 bg-amber-400/8 text-amber-500 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              Work in progress - more coming soon
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: "70ms" }}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.12] tracking-tight">
              Your campus life,<br />
              <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                all in one place
              </span>
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                           bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                           text-sm font-semibold shadow-lg shadow-blue-500/25
                           hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
                Go to Dashboard <ChevronRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/universities"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             bg-gradient-to-r from-blue-500 to-indigo-500 text-white
                             text-sm font-semibold shadow-lg shadow-blue-500/25
                             hover:opacity-90 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
                  Browse content <ChevronRight size={14} />
                </Link>
                <button onClick={scrollToFeatures}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                             border border-border bg-background/80 text-sm font-medium text-foreground
                             hover:bg-muted hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-150">
                  See what's inside
                </button>
              </>
            )}
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="animate-fade-up" style={{ animationDelay: "180ms" }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: stats?.syllabus,  label: "Syllabus items" },
              { value: stats?.units,     label: "Units covered" },
              { value: stats?.resources, label: "Study resources" },
              { value: stats?.pyqs,      label: "Past year papers" },
            ].map(({ value, label }) => (
              <div key={label}
                className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/8
                           rounded-2xl px-4 py-5 text-center shadow-sm">
                {statsLoading ? (
                  <>
                    <Skeleton className="h-7 w-14 mx-auto mb-2 rounded-lg" />
                    <Skeleton className="h-3 w-16 mx-auto rounded" />
                  </>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{value ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── WHAT IS UNIZUYA ── */}
        <section id="about" className="animate-fade-up" style={{ animationDelay: "220ms" }}>
          <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-3">
                What is Unizuya?
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-5 leading-tight">
                One platform, everything you need
              </h2>
              <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <p>
                  The name is inspired by the idea of a one-stop shop that handles many different
                  needs, like that one place in the neighbourhood that somehow does it all.
                </p>
                <p>
                  Students switch between four or five different platforms just to find syllabus,
                  past papers, notes and a place to ask questions. Unizuya puts all of that in one
                  spot, organised by university, branch and course.
                </p>
                <p>
                  Think of it as your academic companion, built by students who were tired of the
                  same scattered mess.
                </p>
              </div>
            </div>

            <div className="rounded-2xl p-6 sm:p-7"
              style={{
                background: "linear-gradient(135deg, rgba(59,130,246,0.07) 0%, rgba(99,102,241,0.11) 100%)",
                border: "1px solid rgba(99,102,241,0.18)",
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
            </div>
          </div>
        </section>

        {/* ── FEATURES (lazy) ── */}
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

        {/* ── ROADMAP TRIGGER ── */}
        <div className="flex justify-center">
          <button onClick={() => setRoadmapOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full
                       border border-border bg-white dark:bg-white/[0.03] shadow-sm
                       text-sm text-muted-foreground hover:text-foreground
                       hover:border-indigo-400/50 hover:shadow-md transition-all duration-200">
            <Zap size={13} className="text-indigo-500" />
            View roadmap - see what's done and what's next
            <ChevronRight size={13} />
          </button>
        </div>

        {/* ── CTA — guests only ── */}
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
                    { icon: Bell,   label: "No ads, no tracking" },
                    { icon: Zap,    label: "Growing every week" },
                    { icon: Users,  label: "Built by students" },
                  ].map(({ label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs text-white/50">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400/60 flex-shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
                <button onClick={() => openAuth("signup")}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-white text-[#312e81]
                             text-sm font-bold hover:bg-white/90 hover:scale-[1.02]
                             active:scale-[0.98] transition-all duration-150 shadow-lg">
                  Create a free account <ArrowRight size={14} />
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

      {/* ── Modals — only rendered (and downloaded) when opened ── */}
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
// src/pages/Home.jsx
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import {
  Construction, BookOpen, FileText, MessageSquare,
  GraduationCap, Layers, ChevronRight, Zap,
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useQuery } from "@tanstack/react-query"
import { getPublicStats } from "@/services/admin/statsService"
import { Skeleton } from "@/components/ui/skeleton"
import { Footer } from "@/components"

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" },
})

const GlassCard = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-white/10 dark:border-white/5
                   bg-white/50 dark:bg-white/[0.03]
                   backdrop-blur-md shadow-sm ${className}`}>
    {children}
  </div>
)

const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <motion.div {...fadeUp(delay)}>
    <GlassCard className="p-5 h-full hover:border-indigo-500/30
                          hover:shadow-[0_0_20px_rgba(99,102,241,0.06)]
                          transition-all duration-300 group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3
                       ${color} group-hover:scale-110 transition-transform duration-200`}>
        <Icon size={17} />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
    </GlassCard>
  </motion.div>
)

const StatCard = ({ value, label, loading }) => (
  <GlassCard className="px-4 py-5 text-center">
    {loading ? (
      <>
        <Skeleton className="h-7 w-14 mx-auto mb-2 rounded-lg" />
        <Skeleton className="h-3 w-16 mx-auto rounded" />
      </>
    ) : (
      <>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {value ?? 0}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </>
    )}
  </GlassCard>
)

const RoadmapItem = ({ label, done }) => (
  <div className={`flex items-center gap-2.5 text-sm
                   ${done ? "text-foreground/60" : "text-foreground"}`}>
    <div className={`w-4 h-4 rounded-full border-2 flex items-center
                     justify-center shrink-0
                     ${done ? "border-indigo-500 bg-indigo-500/20" : "border-border"}`}>
      {done && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
    </div>
    <span className={done ? "line-through opacity-50" : ""}>{label}</span>
    {!done && (
      <span className="ml-auto text-[10px] text-muted-foreground/50 shrink-0">
        upcoming
      </span>
    )}
  </div>
)

export default function Home() {
  const { currentUser, isLoading: authLoading } = useAuth()

  // Single query — staleTime prevents duplicate fetches across components
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["public-stats"],
    queryFn: getPublicStats,
    staleTime: 1000 * 60 * 60,  // 1 hour — avoids re-fetch on navigation
    gcTime: 1000 * 60 * 60 * 24,
  })

  // getPublicStats returns: { syllabus, units, resources, pyqs }
  return (
    <div className="min-h-screen flex flex-col">

      {/* Ambient blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px]
                        bg-indigo-500/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-[5%] right-[-5%] w-[400px] h-[400px]
                        bg-blue-500/6 rounded-full blur-[120px]" />
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-12 space-y-10">

        {/* ── HERO ── */}
        <section className="pt-4 space-y-6">

          <motion.div {...fadeUp(0)} className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                            border border-amber-500/30 bg-amber-500/8
                            text-amber-500 text-xs font-medium">
              <Construction size={11} />
              Work in progress — more coming soon
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.07)} className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold
                           leading-tight tracking-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400
                               bg-clip-text text-transparent">
                Unizuya
              </span>
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground
                          max-w-xl mx-auto leading-relaxed">
              A unified academic platform — PYQs, syllabus, resources and a
              student forum, all in one place.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.14)} className="flex flex-wrap justify-center gap-3">
            {authLoading ? (
              <Skeleton className="h-10 w-40 rounded-xl" />
            ) : currentUser ? (
              <Link to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                           bg-gradient-to-r from-blue-500 to-indigo-500
                           text-white text-sm font-semibold shadow-sm
                           hover:opacity-90 hover:scale-[1.02]
                           active:scale-[0.98] transition-all duration-150">
                Go to Dashboard <ChevronRight size={14} />
              </Link>
            ) : (
              <>
                <Link to="/universities"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-gradient-to-r from-blue-500 to-indigo-500
                             text-white text-sm font-semibold shadow-sm
                             hover:opacity-90 hover:scale-[1.02]
                             active:scale-[0.98] transition-all duration-150">
                  Browse Universities <ChevronRight size={14} />
                </Link>
                <Link to="/forum"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl
                             border border-border bg-background/60
                             text-sm font-medium text-foreground
                             hover:bg-muted hover:scale-[1.02]
                             active:scale-[0.98] transition-all duration-150">
                  Student Forum
                </Link>
              </>
            )}
          </motion.div>
        </section>

        {/* ── STATS — uses actual getPublicStats fields ── */}
        <motion.section {...fadeUp(0.18)}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard value={stats?.syllabus} label="Syllabus items" loading={statsLoading} />
            <StatCard value={stats?.units} label="Units" loading={statsLoading} />
            <StatCard value={stats?.resources} label="Resources" loading={statsLoading} />
            <StatCard value={stats?.pyqs} label="PYQs" loading={statsLoading} />
          </div>
        </motion.section>

        {/* ── WHAT IS UNIZUYA ── */}
        <motion.section {...fadeUp(0.22)}>
          <GlassCard className="p-6 sm:p-7">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 flex items-center
                              justify-center shrink-0 mt-0.5">
                <GraduationCap size={15} className="text-indigo-500" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">What is Unizuya?</h2>
                <p className="text-xs text-muted-foreground mt-0.5">The name and the mission</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                The name{" "}
                <span className="font-semibold text-foreground">Unizuya</span>{" "}
                is inspired by the idea of{" "}
                <span className="italic text-foreground">"Odd Jobs"</span> — a concept
                from Japanese pop culture where a single platform takes care of many
                different needs.
              </p>
              <p>
                In the same spirit, Unizuya brings together multiple academic services
                to make student life simpler and more organised — from past year questions
                and syllabus to study resources and a student discussion forum.
              </p>
              <p>Think of it as your university companion that actually does odd jobs for you.</p>
            </div>

            <div className="mt-5 pt-5 border-t border-border/40">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                Currently in active development. More features and universities added over time.
              </div>
            </div>
          </GlassCard>
        </motion.section>

        {/* ── FEATURES ── */}
        <section className="space-y-4">
          <motion.h2 {...fadeUp(0.26)} className="text-base font-bold text-foreground">
            What you can do
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FeatureCard
              icon={FileText} title="Past Year Questions"
              desc="Access PYQs organised by university, program and branch — searchable and filterable."
              color="bg-orange-500/15 text-orange-500" delay={0.28} />
            <FeatureCard
              icon={BookOpen} title="Syllabus & Study Materials"
              desc="Browse structured syllabus and upload or download study resources for any subject."
              color="bg-blue-500/15 text-blue-500" delay={0.32} />
            <FeatureCard
              icon={MessageSquare} title="Student Forum"
              desc="Ask questions, share insights and discuss academics with students from your university."
              color="bg-indigo-500/15 text-indigo-500" delay={0.36} />
            <FeatureCard
              icon={Layers} title="Organised by University"
              desc="Everything is scoped to your university and program — see only what's relevant to you."
              color="bg-emerald-500/15 text-emerald-500" delay={0.40} />
          </div>
        </section>

        {/* ── ROADMAP ── */}
        <motion.section {...fadeUp(0.44)}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap size={15} className="text-indigo-500" />
              <h2 className="text-base font-bold text-foreground">Roadmap</h2>
              <span className="ml-auto text-[10px] text-muted-foreground
                               bg-muted px-2 py-0.5 rounded-full">
                Work in progress
              </span>
            </div>

            <div className="space-y-3">
              {/* ── Completed ── */}
              <RoadmapItem label="University, program and branch management" done />
              <RoadmapItem label="Syllabus and unit uploads" done />
              <RoadmapItem label="PYQ uploads and browsing" done />
              <RoadmapItem label="Study resource uploads" done />
              <RoadmapItem label="Student forum with threaded replies" done />
              <RoadmapItem label="User profiles, karma and followers" done />
              <RoadmapItem label="Bookmarks and saved threads" done />
              <RoadmapItem label="Notification system" done />
              <RoadmapItem label="Personalised academic dashboard" done />
              <RoadmapItem label="University notices & events feed" done />
              <RoadmapItem label="CGPA & grade calculator" done />
              <RoadmapItem label="Study to-do list & task tracker" done />
              <RoadmapItem label="Class timetable builder" done />

              {/* ── Upcoming ── */}
              <RoadmapItem label="Shareable link option" />
              <RoadmapItem label="Direct messages & group chats" />
              <RoadmapItem label="AI-powered study assistant" />
              <RoadmapItem label="Collaborative notes" />
              <RoadmapItem label="Mobile app (PWA improvements)" />
            </div>
          </GlassCard>
        </motion.section>

      </div>

      <Footer />
    </div>
  )
}
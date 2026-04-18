// src/components/home/RoadmapModal.jsx
import { AnimatePresence, motion } from "framer-motion"
import { Zap, X } from "lucide-react"

const ROADMAP_DONE = [
  "University, program and branch management",
  "Syllabus and unit uploads",
  "PYQ uploads and browsing",
  "Study resource uploads",
  "Student forum with threaded replies",
  "User profiles, karma and followers",
  "Bookmarks and saved threads",
  "Notification system",
  "Personalised academic dashboard",
  "University notices and events feed",
  "CGPA and grade calculator",
  "Study to-do list and task tracker",
  "Class timetable builder",
  "Shareable link option",
  "Attendance management tool",
]

const ROADMAP_UPCOMING = [
  "Direct messages and group chats",
  "AI-powered study assistant",
  "Collaborative notes",
  "Mobile app improvements",
]

export default function RoadmapModal({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-md max-h-[85vh] overflow-y-auto
                       [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]
                       bg-white dark:bg-[#0f1b2e] rounded-2xl
                       border border-slate-200 dark:border-white/[0.07] shadow-2xl p-6 relative"
          >
            <button onClick={onClose}
              className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center
                justify-center border border-slate-200 dark:border-white/10 text-slate-400
                hover:text-slate-700 dark:hover:text-white bg-slate-50 dark:bg-white/5 transition-colors">
              <X size={13} />
            </button>

            <div className="flex items-center gap-2.5 mb-1">
              <Zap size={15} className="text-indigo-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Roadmap</h2>
              <span className="ml-auto text-[10px] font-medium text-slate-400 bg-slate-100 dark:bg-white/5
                px-2 py-0.5 rounded-full border border-slate-200 dark:border-white/10 mr-8">
                Work in progress
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Here's what's shipped and what's coming next.
            </p>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Shipped
            </p>
            <div className="space-y-0.5 mb-5">
              {ROADMAP_DONE.map(item => (
                <div key={item}
                  className="flex items-center gap-2.5 py-2 border-b border-slate-100 dark:border-white/5 last:border-0">
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-500 bg-indigo-500/10
                    flex items-center justify-center flex-shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 opacity-70">{item}</span>
                </div>
              ))}
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
              Coming up
            </p>
            <div className="space-y-0.5">
              {ROADMAP_UPCOMING.map(item => (
                <div key={item}
                  className="flex items-center justify-between gap-2 py-2
                    border-b border-slate-100 dark:border-white/5 last:border-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-white/20 flex-shrink-0" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">{item}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 opacity-50 flex-shrink-0">upcoming</span>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
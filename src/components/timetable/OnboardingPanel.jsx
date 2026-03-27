// src/components/timetable/OnboardingPanel.jsx

const TIPS = [
  { icon: "📅", title: "Setup periods first",   desc: "Go to Setup tab → define your institution's period timings (I, II, III…). Mark lunch/break periods so they don't show as class slots." },
  { icon: "📚", title: "Add subjects",           desc: "Add each subject with default teacher and room. These auto-fill when placing a class but can be overridden per slot." },
  { icon: "✦",  title: "Place classes on grid",  desc: "Click any '+' cell on the grid to add a class. Select subject, period, and duration (span = number of periods for labs)." },
  { icon: "🤖", title: "AI Scan",               desc: "Have a printed timetable? Click 'AI Scan' → upload a photo or PDF → Gemini extracts everything automatically. Review before applying." },
  { icon: "🔁", title: "Recurring vs one-off",  desc: "Classes can be weekly recurring (normal) or one specific date (for makeup classes, extra sessions)." },
]

export function OnboardingPanel({ onDismiss }) {
  return (
    <div className="mb-6 rounded-2xl border border-violet-200 dark:border-violet-800/50 bg-violet-50 dark:bg-violet-950/30 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-sm flex items-center gap-2">
            <span className="text-violet-500">✦</span> Welcome to Timetable Builder
          </h3>
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">Here's a quick guide to get started</p>
        </div>
        <button onClick={onDismiss} className="text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 text-xl leading-none transition-colors">✕</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {TIPS.map((tip, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-xl bg-white dark:bg-zinc-900/60 border border-violet-100 dark:border-violet-800/30">
            <span className="text-xl shrink-0 mt-0.5">{tip.icon}</span>
            <div>
              <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200">{tip.title}</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5 leading-relaxed">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <button onClick={onDismiss}
        className="mt-4 w-full py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-semibold transition-colors">
        Got it, let's go! →
      </button>
    </div>
  )
}
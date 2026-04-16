import { Link } from "react-router-dom"
import UnizuyaLogo from "@/components/common/Logo/UnizuyaLogo"

const NAVIGATION_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
]

const SOCIAL_PLACEHOLDERS = ["LinkedIn", "GitHub", "Instagram"]

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-slate-200/70 bg-slate-100 dark:border-white/[0.05] dark:bg-[#080e1a]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent to-slate-100 dark:to-[#080e1a]" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <UnizuyaLogo size={30} />
            <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-xl font-semibold text-transparent">
              Unizuya
            </span>
          </Link>
          <p className="max-w-sm text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Unizuya unifies syllabus, PYQs, forum, attendance, and productivity tools into one academic system for students.
          </p>
          <Link
            to="/privacy"
            className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition-colors hover:text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-blue-400"
          >
            Privacy Policy
          </Link>
        </div>

        <nav aria-label="Footer navigation">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Navigation
          </h2>
          <ul className="space-y-2.5">
            {NAVIGATION_LINKS.map(link => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-sm text-slate-600 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <section aria-label="Social placeholders">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Social
          </h2>
          <ul className="space-y-2.5">
            {SOCIAL_PLACEHOLDERS.map(item => (
              <li
                key={item}
                className="text-sm text-slate-500 dark:text-slate-400"
              >
                {item} (coming soon)
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="relative border-t border-slate-200/70 px-6 py-4 dark:border-white/[0.05]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            &copy; {new Date().getFullYear()} Unizuya. All rights reserved.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Built for students, by students.
          </p>
        </div>
      </div>
    </footer>
  )
}

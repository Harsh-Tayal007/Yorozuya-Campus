import { Link } from "react-router-dom"
import { Github, Linkedin, Instagram } from "lucide-react"
import UnizuyaLogo from "@/components/common/Logo/UnizuyaLogo"

// Discord SVG icon (not in Lucide) - inline minimal path
function DiscordIcon({ size = 14 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  )
}

const NAVIGATION_LINKS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
]

// ─── Team social links ────────────────────────────────────────────────────────
const TEAM_SOCIALS = [
  {
    name: "Harsh",
    links: [
      // TODO: Add actual GitHub link
      { icon: Github, href: "https://github.com/Harsh-Tayal007", label: "GitHub" },
      // TODO: Add actual LinkedIn link
      { icon: Linkedin, href: "https://www.linkedin.com/in/harsh-tayal-619521247?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app", label: "LinkedIn" },
      // TODO: Add actual Instagram link
      { icon: Instagram, href: "https://www.instagram.com/harshisweeb/", label: "Instagram" },
      // TODO: Add actual Discord link
      { icon: DiscordIcon, href: "https://discord.gg/eZcF8eMu", label: "Discord" },
    ],
  },
  {
    name: "Kuldeep",
    links: [
      // TODO: Add actual GitHub link
      { icon: Github, href: "https://github.com/kuldeepvashisth", label: "GitHub" },
      // TODO: Add actual LinkedIn link
      { icon: Linkedin, href: "https://www.linkedin.com/in/kuldeep-vashisth-974630380?utm_source=share_via&utm_content=profile&utm_medium=member_android#", label: "LinkedIn" },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-slate-200/70 bg-slate-100 dark:border-white/[0.05] dark:bg-[#080e1a]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent to-slate-100 dark:to-[#080e1a]" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-3">
        {/* Brand */}
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

        {/* Navigation */}
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

        {/* Team socials - replaces the old "coming soon" placeholders */}
        <section aria-label="Team social links">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
            Connect
          </h2>
          <div className="space-y-3">
            {TEAM_SOCIALS.map((member) => (
              <div key={member.name} className="flex items-center gap-2.5">
                <span className="w-14 shrink-0 text-xs text-slate-500 dark:text-slate-400">
                  {member.name}
                </span>
                <div className="flex items-center gap-1.5">
                  {member.links.map(({ icon: Icon, href, label }) => (
                    <a
                      key={label}
                      href={href}
                      aria-label={`${member.name} on ${label}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
                    >
                      <Icon size={13} />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
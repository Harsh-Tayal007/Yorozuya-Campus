import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

const PLATFORM_LINKS = [
  { label: "Home",         to: "/"             },
  { label: "Forum",        to: "/forum"        },
  { label: "Universities", to: "/universities" },
  { label: "Resources",    to: "/universities" },
  { label: "PYQs",         to: "/universities" },
]

const LEGAL_LINKS = [
  { label: "Privacy Policy", to: "/privacy" },
]

export default function Footer() {
  const { currentUser } = useAuth()

  return (
    <footer className="relative mt-auto">
      {/* Seamless gradient fade from page background into footer */}
      <div className="absolute inset-x-0 top-0 h-32 pointer-events-none
        bg-gradient-to-b
        from-transparent
        via-slate-100/60
        to-slate-100
        dark:via-[#080e1a]/60
        dark:to-[#080e1a]" />

      {/* Footer body */}
      <div className="relative
        bg-slate-100 dark:bg-[#080e1a]
        border-t border-slate-200/60 dark:border-white/[0.04]">

        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-10">

            {/* Brand */}
            <div className="col-span-2">
              <Link to="/" className="inline-block mb-4">
                <span className="text-xl font-bold bg-gradient-to-r from-blue-500
                                 to-indigo-500 bg-clip-text text-transparent">
                  Unizuya
                </span>
              </Link>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                A unified academic platform helping students access syllabus,
                resources, PYQs, and connect through a student forum — all in one place.
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
                              bg-amber-50 dark:bg-amber-500/10
                              border border-amber-200/60 dark:border-amber-500/20">
                <span className="text-amber-500 text-xs">🚧</span>
                <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                  Active development
                </span>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest
                             text-slate-400 dark:text-slate-500 mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5">
                {PLATFORM_LINKS.map(link => (
                  <li key={link.label}>
                    <Link to={link.to}
                      className="text-sm text-slate-500 dark:text-slate-400
                                 hover:text-blue-600 dark:hover:text-blue-400
                                 transition-colors duration-150">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-widest
                             text-slate-400 dark:text-slate-500 mb-4">
                Account
              </h4>
              <ul className="space-y-2.5">
                {currentUser ? (
                  <>
                    {[
                      { label: "Dashboard", to: "/dashboard" },
                      { label: "Profile",   to: `/profile/${currentUser.username}` },
                      { label: "Settings",  to: "/dashboard/settings" },
                    ].map(link => (
                      <li key={link.label}>
                        <Link to={link.to}
                          className="text-sm text-slate-500 dark:text-slate-400
                                     hover:text-blue-600 dark:hover:text-blue-400
                                     transition-colors duration-150">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </>
                ) : (
                  <>
                    {[
                      { label: "Login",   to: "/login"  },
                      { label: "Sign Up", to: "/signup" },
                    ].map(link => (
                      <li key={link.label}>
                        <Link to={link.to}
                          className="text-sm text-slate-500 dark:text-slate-400
                                     hover:text-blue-600 dark:hover:text-blue-400
                                     transition-colors duration-150">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-slate-200/60 dark:border-white/[0.04]
                          flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} Unizuya. All rights reserved.
            </p>

            {/* Legal links */}
            <div className="flex items-center gap-4">
              {LEGAL_LINKS.map(link => (
                <Link key={link.label} to={link.to}
                  className="text-xs text-slate-400 dark:text-slate-500
                             hover:text-blue-600 dark:hover:text-blue-400
                             transition-colors duration-150">
                  {link.label}
                </Link>
              ))}
              <span className="text-xs text-slate-300 dark:text-slate-600">·</span>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Built for students, by students
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
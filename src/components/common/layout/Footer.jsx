// src/components/Footer.jsx
import { Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

const PLATFORM_LINKS = [
  { label: "Home",         to: "/"             },
  { label: "Forum",        to: "/forum"        },
  { label: "Universities", to: "/universities" },
  { label: "Resources",    to: "/universities" },
  { label: "PYQs",         to: "/universities" },
]

const ACCOUNT_LINKS = [
  { label: "Dashboard", to: "/dashboard",          auth: true  },
  { label: "Profile",   to: null,                  auth: true  }, // built below
  { label: "Settings",  to: "/dashboard/settings", auth: true  },
  { label: "Login",     to: "/login",               auth: false },
  { label: "Sign Up",   to: "/signup",              auth: false },
]

export default function Footer() {
  const { currentUser } = useAuth()

  return (
    <footer className="relative border-t border-border/40 bg-background/60 backdrop-blur-md mt-auto">
      {/* Top gradient blend */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b
                      from-indigo-500/5 to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-10">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <Link to="/" className="inline-block">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-400
                               to-indigo-400 bg-clip-text text-transparent">
                Unizuya
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
              A unified academic platform helping students access syllabus,
              resources, and PYQs — all in one place.
            </p>
            <p className="mt-4 text-xs text-muted-foreground/60">
              🚧 Currently in active development
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider
                           text-foreground mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {PLATFORM_LINKS.map(link => (
                <li key={link.label}>
                  <Link to={link.to}
                    className="text-sm text-muted-foreground hover:text-primary
                               transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider
                           text-foreground mb-4">
              Account
            </h4>
            <ul className="space-y-2.5">
              {currentUser ? (
                <>
                  <li>
                    <Link to="/dashboard"
                      className="text-sm text-muted-foreground hover:text-primary
                                 transition-colors duration-150">
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link to={`/profile/${currentUser.username}`}
                      className="text-sm text-muted-foreground hover:text-primary
                                 transition-colors duration-150">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link to="/dashboard/settings"
                      className="text-sm text-muted-foreground hover:text-primary
                                 transition-colors duration-150">
                      Settings
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login"
                      className="text-sm text-muted-foreground hover:text-primary
                                 transition-colors duration-150">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/signup"
                      className="text-sm text-muted-foreground hover:text-primary
                                 transition-colors duration-150">
                      Sign Up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col sm:flex-row
                        items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Unizuya. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Built for students, by students
          </p>
        </div>
      </div>
    </footer>
  )
}
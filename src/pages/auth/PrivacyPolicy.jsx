import { Shield, Database, Cookie, Lock, Mail, Eye } from "lucide-react"
import { Link } from "react-router-dom"

const Section = ({ icon: Icon, title, children }) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-blue-600 dark:text-blue-400" />
      </div>
      <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
    </div>
    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed pl-10 space-y-2">
      {children}
    </div>
  </div>
)

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen px-4 py-12
      bg-gradient-to-br from-slate-50 via-white to-slate-100
      dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]">

      <div className="max-w-2xl mx-auto space-y-10">

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-4">
            <Link to="/" className="hover:text-blue-500 transition">Home</Link>
            <span>/</span>
            <span>Privacy Policy</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                            flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <Shield size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Privacy Policy</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500">Last updated: March 2026</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
            Unizuya is built for students, by students. We keep things simple —
            no ads, no data selling, no tracking. Here's exactly what we store and why.
          </p>
        </div>

        <div className="h-px bg-slate-200 dark:bg-white/5" />

        {/* Sections */}
        <div className="space-y-8">

          <Section icon={Database} title="What we store">
            <p>We store the following data to make the app work:</p>
            <ul className="space-y-1.5 list-none">
              {[
                ["Account info", "Your name, email, username, and profile picture (if uploaded)"],
                ["Academic profile", "Your university, program, and branch — used to show relevant content"],
                ["App preferences", "Theme, dashboard settings, notification preferences"],
                ["Content you create", "Forum posts, replies, bookmarks, and task/timetable data"],
                ["Session data", "Login session managed securely via Appwrite"],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  <span><span className="font-medium text-slate-700 dark:text-slate-300">{label}:</span> {desc}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Cookie} title="Cookies & local storage">
            <p>We use browser cookies and local storage for:</p>
            <ul className="space-y-1.5 list-none">
              {[
                ["Login session", "Appwrite sets a secure session cookie to keep you logged in"],
                ["Saved accounts", "Usernames and avatars of accounts you've added for quick switching"],
                ["Encrypted vault", "An AES-256 encrypted blob used for seamless account switching — your password never leaves your device in plain text"],
                ["App state", "Cached data, last visited route, and UI preferences"],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  <span><span className="font-medium text-slate-700 dark:text-slate-300">{label}:</span> {desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2">
              We do <span className="font-medium text-slate-700 dark:text-slate-300">not</span> use
              any third-party tracking cookies, analytics, or advertising cookies.
            </p>
          </Section>

          <Section icon={Eye} title="What we don't do">
            <ul className="space-y-1.5 list-none">
              {[
                "Sell your data to anyone",
                "Show you ads or share data with advertisers",
                "Track your behavior across other websites",
                "Share your data with third parties except as needed to run the service (Appwrite for auth/database, Cloudinary for image storage)",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Lock} title="Data security">
            <p>
              Your account is secured via Appwrite's authentication system.
              Passwords are never stored in plain text anywhere — Appwrite handles
              password hashing. Our account-switching vault uses AES-256-GCM
              encryption with keys derived via PBKDF2 (100,000 iterations).
            </p>
            <p>
              We recommend using a strong, unique password and enabling any
              available security features on your account.
            </p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>
              If you have any questions about your data or want it deleted,
              reach out at{" "}
              <a href="mailto:support@unizuya.com"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                support@unizuya.com
              </a>
              . We'll respond within 48 hours.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Unizuya is currently in beta. This policy may be updated as features are added.
              Continued use of the app constitutes acceptance of any changes.
            </p>
          </Section>

        </div>

        <div className="h-px bg-slate-200 dark:bg-white/5" />

        {/* Footer */}
        <div className="flex items-center justify-between">
          <Link to="/"
            className="text-sm text-blue-600 dark:text-blue-400 hover:opacity-80 transition font-medium">
            ← Back to Unizuya
          </Link>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            © 2026 Unizuya
          </span>
        </div>

      </div>
    </div>
  )
}

export default PrivacyPolicy
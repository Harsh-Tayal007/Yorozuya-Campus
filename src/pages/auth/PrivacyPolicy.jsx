import { Shield, Database, Cookie, Lock, Mail, Eye, Users, Activity, UserCog } from "lucide-react"
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
              <p className="text-xs text-slate-400 dark:text-slate-500">Last updated: April 2026</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
            Unizuya is built for students, by students. We keep things simple:
            no ads, no data selling, no tracking. This page explains what we store and why.
          </p>
        </div>

        <div className="h-px bg-slate-200 dark:bg-white/5" />

        <div className="space-y-8">

          <Section icon={Database} title="What we store">
            <p>We store the following data to make the app work and improve your experience:</p>
            <ul className="space-y-1.5 list-none">
              {[
                ["Account info", "Your name, email, username, and profile picture if you upload one."],
                ["Academic profile", "Your university, program, and branch, used to show you relevant content."],
                ["Role information", "Your account type (Student, Teacher, or Admin) to enforce granular role-based access control."],
                ["App preferences", "Theme, dashboard settings, and notification preferences."],
                ["Content you create", "Forum posts, replies, bookmarks, and any task or timetable data."],
                ["AI processing", "Images uploaded for timetable or marksheet scanning are processed securely in real-time. They are not stored permanently or used to train AI models."],
                ["Session data", "Your login session, managed securely via Appwrite."],
                ["Communication data", "Support queries or messages sent via the contact form."],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  <span><span className="font-medium text-slate-700 dark:text-slate-300">{label}:</span> {desc}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Activity} title="How we use your data">
            <p>Your data is used strictly to provide and maintain the Unizuya platform:</p>
            <ul className="space-y-1.5 list-none">
              {[
                "To authenticate you and keep your account secure.",
                "To personalize your experience, delivering syllabus and resources relevant to your academic profile.",
                "To process AI requests (like scanning a marksheet or timetable) securely.",
                "To monitor platform health, performance, and troubleshoot bugs.",
                "To enforce community guidelines and ensure a safe environment via moderation tools.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Cookie} title="Cookies and local storage">
            <p>We use browser cookies and local storage for the following purposes:</p>
            <ul className="space-y-1.5 list-none">
              {[
                ["Login session", "Appwrite sets a secure session cookie to keep you logged in."],
                ["Saved accounts", "Usernames and avatars of accounts you have added for quick switching."],
                ["Encrypted vault", "An AES-256 encrypted blob used for seamless account switching. Your password never leaves your device in plain text."],
                ["App state", "Cached data, last visited route, local filters, and UI preferences."],
                ["Push notifications", "Service worker registrations for delivering timely alerts if you opt-in."],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  <span><span className="font-medium text-slate-700 dark:text-slate-300">{label}:</span> {desc}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2">
              We do <span className="font-medium text-slate-700 dark:text-slate-300">not</span> use
              any third-party tracking cookies, analytics cookies, or advertising cookies.
            </p>
          </Section>

          <Section icon={Eye} title="What we do not do">
            <ul className="space-y-1.5 list-none">
              {[
                "Sell your data to anyone.",
                "Show you ads or share data with advertisers.",
                "Track your behaviour across other websites.",
                "Share your data with third parties beyond what is needed to run the service. This is limited to Appwrite for auth and database, and Cloudinary for image storage.",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-green-500 mt-0.5 shrink-0">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={UserCog} title="Your rights over your data">
            <p>You have full control over your personal information on Unizuya:</p>
            <ul className="space-y-1.5 list-none">
              {[
                ["Access and update", "You can view and modify all your personal data, academic profile, and settings directly from the dashboard."],
                ["Data export", "You can export your tasks, attendance reports, and timetables via the internal tools."],
                ["Account deletion", "You can permanently delete your account from the settings page. Personal information and forum posts are removed. Note: Attendance records you were part of may be anonymised and preserved to maintain class history for teachers."],
                ["Opt-out of notifications", "You can disable push notifications or emails from your dashboard preferences at any time."],
              ].map(([label, desc]) => (
                <li key={label} className="flex gap-2">
                  <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                  <span><span className="font-medium text-slate-700 dark:text-slate-300">{label}:</span> {desc}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Users} title="Community guidelines and moderation">
            <p>
              Unizuya is a space for students to learn, discuss, and collaborate. To keep it that way,
              we maintain community standards and give moderators the tools to enforce them.
            </p>

            <div className="space-y-4 mt-1">

              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-1.5">What is not allowed</p>
                <ul className="space-y-1.5 list-none">
                  {[
                    "Harassment, bullying, or targeted abuse of any user.",
                    "Hate speech or content that discriminates on the basis of caste, religion, gender, ethnicity, or any other identity.",
                    "Explicit, NSFW, or sexually inappropriate content.",
                    "Spam, repeated off-topic posts, or deliberate disruption of discussions.",
                    "Sharing personal information of other users without their consent.",
                    "Impersonating other users, faculty, or official institutions.",
                    "Any content that violates applicable law.",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-red-400 mt-0.5 shrink-0">✕</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-1.5">Reporting</p>
                <p>
                  Any user can report a post, reply, or account that appears to violate these guidelines.
                  Reports are reviewed by moderators and acted upon at their discretion. Submitting
                  false or malicious reports is itself a violation of community guidelines.
                </p>
              </div>

              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-1.5">What moderators can do</p>
                <ul className="space-y-1.5 list-none">
                  {[
                    ["Content removal", "Posts or replies that violate guidelines may be removed. Removed content is marked as deleted and is no longer visible to other users."],
                    ["Temporary ban", "A user may be banned for a set period, ranging from 1 day to several months, for less severe or first-time violations. Banned users cannot post, reply, or interact until the ban expires or is lifted."],
                    ["Permanent ban", "Repeat violations or severe offences may result in a permanent ban, issued by senior moderators or the platform owner."],
                    ["Lifting a ban", "Moderators can lift an active ban early if circumstances warrant it."],
                  ].map(([label, desc]) => (
                    <li key={label} className="flex gap-2">
                      <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                      <span><span className="font-medium text-slate-700 dark:text-slate-300">{label}:</span> {desc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-1.5">What moderators cannot do</p>
                <ul className="space-y-1.5 list-none">
                  {[
                    "Access your password, private messages, or payment information.",
                    "Remove content without it being reported or reviewed.",
                    "Issue permanent bans without the appropriate permission level.",
                    "Act on reports that they themselves submitted.",
                  ].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notifications</p>
                <p>
                  If action is taken on your account, you will receive an in-app notification
                  explaining the reason. Ban reasons are visible to you but not to other users.
                </p>
              </div>

              <p className="text-xs text-slate-400 dark:text-slate-500">
                If you believe a moderation action was taken in error, contact us at{" "}
                <a href="mailto:support@unizuya.in"
                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  support@unizuya.in
                </a>
                .
              </p>

            </div>
          </Section>

          <Section icon={Lock} title="Data security">
            <p>
              Your account is secured via Appwrite's authentication system.
              Passwords are never stored in plain text. Appwrite handles password hashing on
              the server side. The account-switching vault uses AES-256-GCM encryption with
              keys derived via PBKDF2 at 100,000 iterations.
            </p>
            <p>
              We recommend using a strong, unique password and enabling any available
              security features on your account.
            </p>
          </Section>

          <Section icon={Mail} title="Contact">
            <p>
              For questions about your data, deletion requests, or moderation appeals,
              reach out at{" "}
              <a href="mailto:support@unizuya.in"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                support@unizuya.in
              </a>
              . We aim to respond within 48 hours.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
              Unizuya is currently in beta. This policy may be updated as features are added.
              Continued use of the app constitutes acceptance of any changes.
            </p>
          </Section>

        </div>

        <div className="h-px bg-slate-200 dark:bg-white/5" />

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
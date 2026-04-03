/**
 * ForgotPassword.jsx
 * 
 * Standalone page at /forgot-password
 * Users enter their email → calls the Appwrite function → Resend sends the email
 */

import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { functions } from "@/lib/appwrite"
import { motion } from "framer-motion"
import { Mail, ArrowLeft, Check } from "lucide-react"

const FUNCTION_ID = import.meta.env.VITE_APPWRITE_RECOVERY_FUNCTION_ID

const ForgotPassword = () => {

  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) { setError("Email is required"); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Enter a valid email"); return }

    setLoading(true)
    setError(null)

    try {
      const execution = await functions.createExecution(
        FUNCTION_ID,
        JSON.stringify({ email: email.trim() }),
        false,
        "/",
        "POST"
      )

      const result = JSON.parse(execution.responseBody || "{}")
      if (result.error) throw new Error(result.error)

      setSent(true)

      // ── For admin dashboard stats ──────────────────────────────────────────────────
      navigator.sendBeacon(
        "https://unizuya-stats.harshtayal710.workers.dev/track/resend",
        JSON.stringify({ type: "password-reset" })
      )
      // ─────────────────────────────────────────────────────────────
    } catch (err) {
      setError(err?.message ?? "Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const meta = document.createElement("meta")
    meta.name = "robots"
    meta.content = "noindex, nofollow"
    document.head.appendChild(meta)
    return () => document.head.removeChild(meta) // cleanup on unmount
  }, [])

  return (
    <div className="
      relative min-h-screen flex items-center justify-center overflow-hidden px-4
      bg-gradient-to-br from-slate-100 via-white to-slate-200
      dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]
    ">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-30
        bg-blue-400 dark:bg-blue-600 top-[-120px] left-[-120px]" />
      <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-20
        bg-indigo-400 dark:bg-violet-700 bottom-[-120px] right-[-120px]" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="
          bg-white/90 dark:bg-[#0f1b2e]/80 backdrop-blur-2xl
          border border-slate-200/80 dark:border-white/[0.07]
          shadow-2xl shadow-slate-200/60 dark:shadow-black/60
          rounded-2xl p-8
        ">
          {sent ? (
            /* ── Success state ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/10
                flex items-center justify-center">
                <Check size={28} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Check your inbox</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                We sent a password reset link to{" "}
                <span className="font-medium text-slate-700 dark:text-slate-200">{email}</span>
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Didn't get it? Check your spam folder or{" "}
                <button
                  onClick={() => setSent(false)}
                  className="text-blue-500 hover:text-blue-600 font-medium transition"
                >
                  try again
                </button>
              </p>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-500
                  bg-clip-text text-transparent hover:opacity-80 transition"
              >
                Back to login
              </button>
            </motion.div>
          ) : (
            /* ── Form state ── */
            <>
              {/* Header */}
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                  flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                  <Mail size={18} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Forgot password?</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null) }}
                    placeholder="you@example.com"
                    disabled={loading}
                    className="w-full h-10 px-3.5 rounded-xl border
                      border-slate-200 dark:border-white/10
                      bg-slate-50 dark:bg-white/5
                      text-slate-900 dark:text-white
                      placeholder:text-slate-400 dark:placeholder:text-slate-600
                      focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                      disabled:opacity-50 transition text-sm"
                  />
                  {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 rounded-xl font-semibold text-sm text-white
                    bg-gradient-to-r from-blue-600 to-indigo-600
                    hover:from-blue-500 hover:to-indigo-500
                    shadow-lg shadow-blue-600/25
                    disabled:opacity-60 transition-all duration-200
                    flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending…
                    </>
                  ) : "Send reset link"}
                </button>
              </form>

              <div className="mt-5 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400
                    hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  <ArrowLeft size={14} /> Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPassword
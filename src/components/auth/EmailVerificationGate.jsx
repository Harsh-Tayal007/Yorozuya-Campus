/**
 * EmailVerificationGate.jsx
 *
 * Full-screen gate shown to logged-in but unverified users.
 * Features:
 *  - Shows account email
 *  - 24h countdown to auto-delete
 *  - Resend verification email (rate-limited to once per 60s)
 *  - Sign out option
 */

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, RefreshCw, LogOut, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { sendVerificationEmail } from "@/services/auth/emailVerificationService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID    = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = "users"

// ── Countdown hook ────────────────────────────────────────────────────────────
const useCountdown = (targetMs) => {
  const [remaining, setRemaining] = useState(() => Math.max(0, targetMs - Date.now()))

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, targetMs - Date.now()))
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [targetMs])

  const h  = Math.floor(remaining / 3_600_000)
  const m  = Math.floor((remaining % 3_600_000) / 60_000)
  const s  = Math.floor((remaining % 60_000) / 1000)

  return {
    expired: remaining === 0,
    label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
  }
}

// ── Resend cooldown hook ──────────────────────────────────────────────────────
const COOLDOWN_MS = 60_000 // 60 seconds

const useResendCooldown = () => {
  const storageKey = "unizuya_verify_last_sent"
  const [cooldownEnd, setCooldownEnd] = useState(() => {
    const stored = localStorage.getItem(storageKey)
    return stored ? parseInt(stored, 10) : 0
  })

  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 1000))
      setSecondsLeft(left)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [cooldownEnd])

  const canResend = secondsLeft === 0

  const startCooldown = () => {
    const end = Date.now() + COOLDOWN_MS
    localStorage.setItem(storageKey, String(end))
    setCooldownEnd(end)
  }

  return { canResend, secondsLeft, startCooldown }
}

// ── Main component ────────────────────────────────────────────────────────────
const EmailVerificationGate = () => {
  const { currentUser, logout } = useAuth()

  const [resendStatus, setResendStatus] = useState("idle") // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState("")

  const { canResend, secondsLeft, startCooldown } = useResendCooldown()

  // Estimate deletion deadline: 24h from account creation
  // Appwrite account.$createdAt is an ISO string
  const createdAt  = currentUser?.$createdAt
  const deleteAt   = createdAt ? new Date(createdAt).getTime() + 24 * 3_600_000 : Date.now() + 24 * 3_600_000
  const { expired, label: countdownLabel } = useCountdown(deleteAt)

  const handleResend = useCallback(async () => {
    if (!canResend || resendStatus === "sending") return
    setResendStatus("sending")
    setErrorMsg("")
    try {
      await sendVerificationEmail({
        userId: currentUser?.$id,
        email:  currentUser?.email,
        name:   currentUser?.name,
      })
      setResendStatus("sent")
      startCooldown()
      setTimeout(() => setResendStatus("idle"), 4000)
    } catch (err) {
      setResendStatus("error")
      setErrorMsg(err?.message ?? "Failed to send. Please try again.")
      setTimeout(() => setResendStatus("idle"), 4000)
    }
  }, [canResend, currentUser, resendStatus, startCooldown])

  const handleLogout = async () => {
    await logout()
  }

  const email = currentUser?.email ?? "your email"
  const [emailUser, emailDomain] = email.includes("@")
    ? [email.split("@")[0], "@" + email.split("@")[1]]
    : [email, ""]

  return (
    <div className="
      relative min-h-screen flex items-center justify-center overflow-hidden px-4
      bg-gradient-to-br from-slate-100 via-white to-slate-200
      dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]
    ">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-25
        bg-blue-400 dark:bg-blue-600 top-[-180px] left-[-180px]" />
      <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-20
        bg-indigo-400 dark:bg-violet-700 bottom-[-140px] right-[-140px]" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="
          bg-white/90 dark:bg-[#0f1b2e]/80 backdrop-blur-2xl
          border border-slate-200/80 dark:border-white/[0.07]
          shadow-2xl shadow-slate-200/60 dark:shadow-black/60
          rounded-2xl overflow-hidden
        ">
          {/* Top accent */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

          <div className="p-8 sm:p-10">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6 w-16 h-16 rounded-2xl
                bg-gradient-to-br from-blue-500/10 to-indigo-500/10
                border border-blue-500/20
                flex items-center justify-center"
            >
              <Mail className="text-blue-500 dark:text-blue-400" size={28} />
            </motion.div>

            {/* Heading */}
            <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white tracking-tight mb-2">
              Check your inbox
            </h1>
            <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              We sent a verification link to
            </p>

            {/* Email pill */}
            <div className="mx-auto mb-6 w-fit max-w-full px-4 py-2 rounded-xl
              bg-slate-50 dark:bg-white/5
              border border-slate-200 dark:border-white/10
              flex items-center gap-2 overflow-hidden">
              <Mail size={14} className="text-slate-400 shrink-0" />
              <span className="text-sm font-mono text-slate-700 dark:text-slate-200 truncate">
                <span className="font-semibold">{emailUser}</span>
                <span className="text-slate-400 dark:text-slate-500">{emailDomain}</span>
              </span>
            </div>

            {/* Countdown */}
            <div className={`
              mb-6 rounded-xl px-4 py-3
              flex items-center gap-3
              ${expired
                ? "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
                : "bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20"
              }
            `}>
              <Clock size={16} className={expired ? "text-red-500 shrink-0" : "text-amber-500 shrink-0"} />
              <div className="flex-1 min-w-0">
                {expired ? (
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    Verification window expired - your account may be deleted soon.
                  </p>
                ) : (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Account deleted in
                    </p>
                    <span className="font-mono text-sm font-bold text-amber-600 dark:text-amber-300 tabular-nums">
                      {countdownLabel}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Resend button */}
            <AnimatePresence mode="wait">
              {resendStatus === "sent" ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-3 flex items-center justify-center gap-2 h-11 rounded-xl
                    bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20"
                >
                  <CheckCircle size={16} className="text-green-500" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    New link sent - check your inbox
                  </span>
                </motion.div>
              ) : resendStatus === "error" ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mb-3 flex items-center justify-center gap-2 h-11 rounded-xl px-4
                    bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20"
                >
                  <AlertTriangle size={16} className="text-red-500 shrink-0" />
                  <span className="text-xs text-red-600 dark:text-red-400 text-center">{errorMsg}</span>
                </motion.div>
              ) : (
                <motion.button
                  key="resend"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleResend}
                  disabled={!canResend || resendStatus === "sending"}
                  className="
                    mb-3 w-full h-11 rounded-xl font-semibold text-sm
                    bg-gradient-to-r from-blue-600 to-indigo-600
                    hover:from-blue-500 hover:to-indigo-500
                    text-white shadow-lg shadow-blue-600/20
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                    flex items-center justify-center gap-2
                  "
                >
                  {resendStatus === "sending" ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Sending…
                    </>
                  ) : !canResend ? (
                    <>
                      <RefreshCw size={14} />
                      Resend in {secondsLeft}s
                    </>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      Resend verification email
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>

            {/* Sign out */}
            <button
              onClick={handleLogout}
              className="
                w-full h-10 rounded-xl text-sm font-medium
                border border-slate-200 dark:border-white/10
                text-slate-500 dark:text-slate-400
                hover:bg-slate-50 dark:hover:bg-white/5
                flex items-center justify-center gap-2
                transition-all duration-200
              "
            >
              <LogOut size={14} />
              Sign out
            </button>

            {/* Help text */}
            <p className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Check your spam folder if you don't see it. The link expires in 24 hours.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default EmailVerificationGate
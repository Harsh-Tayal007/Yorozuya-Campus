import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Link as LinkIcon } from "lucide-react"
import { Link } from "react-router-dom"
import { account } from "@/lib/appwrite"

import AccountStep from "./AccountStep"
import AcademicStep from "./AcademicStep"

import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import { getBranchesByProgram } from "@/services/university/branchService"

const signupWithGoogle = () => {
  account.createOAuth2Session(
    "google",
    `${window.location.origin}/oauth/callback`,
    `${window.location.origin}/signup`
  )
}

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5.1l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-3-11.3-7.3L6 33.8C9.4 39.7 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6.3 5.2C41 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z" />
  </svg>
)

const STEP_LABELS = ["Account", "Academic", "Confirm"]

const Signup = () => {
  const [step, setStep] = useState(1)
  const [signupData, setSignupData] = useState({
    name: "", email: "", password: "",
    universityId: "", programId: "", branchId: "",
  })

  const [universityName, setUniversityName] = useState("")
  const [programName, setProgramName]       = useState("")
  const [branchName, setBranchName]         = useState("")

  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [privacyError, setPrivacyError]       = useState(false)

  useEffect(() => {
    if (!signupData.universityId) return
    getUniversities().then(list => {
      const u = list.find(u => u.$id === signupData.universityId)
      if (u) setUniversityName(u.name)
    }).catch(() => {})
  }, [signupData.universityId])

  useEffect(() => {
    if (!signupData.programId || !signupData.universityId) return
    getProgramsByUniversity(signupData.universityId).then(list => {
      const p = list.find(p => p.$id === signupData.programId)
      if (p) setProgramName(p.name)
    }).catch(() => {})
  }, [signupData.programId])

  useEffect(() => {
    if (!signupData.branchId || !signupData.programId) return
    getBranchesByProgram(signupData.programId).then(list => {
      const b = list.find(b => b.$id === signupData.branchId)
      if (b) setBranchName(b.name)
    }).catch(() => {})
  }, [signupData.branchId])

  const { completeSignup } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [signupSuccess, setSignupSuccess] = useState(false)

  const handleFinalSubmit = async () => {
    if (!privacyAccepted) { setPrivacyError(true); return }
    try {
      setLoading(true); setError(null)
      await completeSignup(signupData)
      setSignupSuccess(true)
      navigator.sendBeacon(
        "https://unizuya-stats.harshtayal710.workers.dev/track/activity",
        JSON.stringify({ userId: null, isNewSignup: true })
      )
      setTimeout(() => navigate("/dashboard"), 1200)
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.")
    } finally { setLoading(false) }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 py-6
      bg-gradient-to-br from-slate-100 via-white to-slate-200
      dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]">
      <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-40
        bg-blue-400 dark:bg-blue-600 top-[-160px] left-[-160px]" />
      <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-30
        bg-indigo-400 dark:bg-violet-700 bottom-[-120px] right-[-120px]" />

      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md">
        <Card className="bg-white/90 dark:bg-[#0f1b2e]/80 backdrop-blur-2xl
          border border-slate-200/80 dark:border-white/[0.07]
          shadow-2xl shadow-slate-200/60 dark:shadow-black/60">
          <CardContent className="p-6">

            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-5">
              {STEP_LABELS.map((label, idx) => {
                const s = idx + 1
                const isActive    = step === s
                const isCompleted = step > s
                return (
                  <div key={s} className="flex items-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <motion.div
                        animate={{ scale: isActive ? 1.08 : 1 }}
                        transition={{ duration: 0.2 }}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold
                          ${isCompleted ? "bg-green-500 text-white"
                            : isActive   ? "bg-blue-600 text-white"
                            : "bg-slate-100 dark:bg-white/10 text-slate-400 dark:text-slate-500"}`}>
                        {isCompleted ? <Check size={14} /> : s}
                      </motion.div>
                      <span className={`text-[9px] font-medium tracking-wide
                        ${isActive    ? "text-blue-600 dark:text-blue-400"
                          : isCompleted ? "text-green-600 dark:text-green-400"
                          : "text-slate-400 dark:text-slate-600"}`}>
                        {label}
                      </span>
                    </div>
                    {s < 3 && (
                      <div className="w-14 mx-1 mb-3.5">
                        <div className="h-px bg-slate-200 dark:bg-white/10 relative overflow-hidden">
                          <motion.div className="absolute inset-y-0 left-0 bg-green-500"
                            initial={{ width: 0 }}
                            animate={{ width: isCompleted ? "100%" : "0%" }}
                            transition={{ duration: 0.3 }} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Google OAuth — step 1 only */}
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="oauth"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden">
                  <button type="button" onClick={signupWithGoogle}
                    className="w-full flex items-center justify-center gap-2.5 h-9 mb-3
                      border border-slate-200 dark:border-white/10
                      bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10
                      text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg
                      transition-all duration-200 shadow-sm">
                    <GoogleIcon /> Continue with Google
                  </button>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                    <span className="text-xs text-slate-400 font-medium tracking-wide">OR</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}>

                {step === 1 && (
                  <AccountStep data={signupData} setData={setSignupData} onNext={() => setStep(2)} />
                )}

                {step === 2 && (
                  <AcademicStep data={signupData} setData={setSignupData}
                    onBack={() => setStep(1)} onNext={() => setStep(3)} />
                )}

                {step === 3 && !signupSuccess && (
                  <div className="space-y-3.5">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white">Almost there!</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step 3 of 3 — Confirm and create</p>
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl border border-slate-200 dark:border-white/10
                                    bg-slate-50 dark:bg-white/5 px-3.5 py-3 space-y-2">
                      <SummaryRow label="Name"     value={signupData.name} />
                      <SummaryRow label="Email"    value={signupData.email} />
                      <SummaryRow label="Password" value="••••••••" />
                      {universityName && <SummaryRow label="University" value={universityName} />}
                      {programName    && <SummaryRow label="Program"    value={programName} />}
                      {branchName     && <SummaryRow label="Branch"     value={branchName} />}
                    </div>

                    {/* Privacy Policy */}
                    <div className="space-y-1">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <div onClick={() => { setPrivacyAccepted(p => !p); setPrivacyError(false) }}
                          className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border flex items-center justify-center
                            transition-colors duration-150 cursor-pointer
                            ${privacyAccepted
                              ? "bg-blue-600 border-blue-600"
                              : privacyError
                                ? "border-red-400 bg-white dark:bg-white/5"
                                : "border-slate-300 dark:border-white/20 bg-white dark:bg-white/5"
                            }`}>
                          {privacyAccepted && <Check size={10} className="text-white" />}
                        </div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          We use cookies and local storage for sessions and preferences. No tracking or ads.{" "}
                          <Link to="/privacy"
                            className="text-blue-500 hover:text-blue-600 underline underline-offset-2 transition">
                            Privacy Policy
                          </Link>
                        </span>
                      </label>
                      {privacyError && (
                        <p className="text-xs text-red-500 ml-6">Please accept the Privacy Policy to continue.</p>
                      )}
                    </div>

                    {error && (
                      <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
                        <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                      </div>
                    )}

                    <Button onClick={handleFinalSubmit} disabled={loading}
                      className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600
                        hover:from-blue-500 hover:to-indigo-500 text-white font-semibold
                        shadow-lg shadow-blue-600/25 transition-all duration-200 disabled:opacity-60">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Creating account…
                        </span>
                      ) : "Create Account"}
                    </Button>

                    <Button variant="outline" onClick={() => setStep(2)}
                      className="w-full h-9 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 text-sm">
                      Back
                    </Button>
                  </div>
                )}

                {signupSuccess && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4 py-4">
                    <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center">
                      <Check className="text-green-500" size={28} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Account created!</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting you to dashboard…</p>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Bottom link — separated with border, not cramped */}
            {!signupSuccess && (
              <p className="mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06]
                            text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{" "}
                <button onClick={() => navigate("/login")}
                  className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-500
                    bg-clip-text text-transparent hover:opacity-80 transition">
                  Sign in
                </button>
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

const SummaryRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-xs">
    <span className="text-slate-500 dark:text-slate-400">{label}</span>
    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[190px]">{value}</span>
  </div>
)

export default Signup
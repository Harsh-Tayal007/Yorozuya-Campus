import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Link as LinkIcon, GraduationCap, BookOpen } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { account } from "@/lib/appwrite"

import AccountStep from "./AccountStep"
import AcademicStep from "./AcademicStep"

import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import Stepper, { Step } from "@/components/ui/Stepper"

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
  const [searchParams, setSearchParams] = useSearchParams()
  const roleParam = searchParams.get("role") // "student" | "teacher" | null
  const isTeacher = roleParam === "teacher"

  const selectRole = (r) => setSearchParams({ role: r }, { replace: true })

  const [step, setStep] = useState(1)
  const [signupData, setSignupData] = useState({
    name: "", email: "", password: "", username: "",
    universityId: "", programId: "", branchId: "",
    accountType: roleParam || "student",
  })

  // Keep accountType in sync when roleParam changes
  useEffect(() => {
    if (roleParam) setSignupData(prev => ({ ...prev, accountType: roleParam }))
  }, [roleParam])

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
      dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-30
        bg-blue-400 dark:bg-blue-600/20 top-[-160px] left-[-160px]" />
      <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-20
        bg-indigo-400 dark:bg-violet-700/20 bottom-[-120px] right-[-120px]" />

      <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[460px]">
        <Card className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl
          border border-slate-200/80 dark:border-slate-700/50
          shadow-2xl shadow-slate-200/60 dark:shadow-black/60">
          <CardContent className="p-6">

            {/* Logo */}
            <div className="flex justify-center mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
            </div>

            {/* ── Role Selection Gateway ── */}
            {!roleParam && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="space-y-4 text-center"
              >
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Join Unizuya</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">How will you use the platform?</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => selectRole("student")}
                    className="group flex flex-col items-center gap-2.5 p-5 rounded-xl border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-800/50 hover:border-blue-400 dark:hover:border-blue-500/60
                      hover:bg-blue-50/50 dark:hover:bg-blue-500/10 transition-all duration-200">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center
                      group-hover:bg-blue-500/20 dark:group-hover:bg-blue-500/30 transition-colors">
                      <GraduationCap size={18} className="text-blue-500 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Student</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Access notes, PYQs & more</p>
                    </div>
                  </button>
                  <button onClick={() => selectRole("teacher")}
                    className="group flex flex-col items-center gap-2.5 p-5 rounded-xl border border-slate-200 dark:border-slate-700
                      bg-white dark:bg-slate-800/50 hover:border-emerald-400 dark:hover:border-emerald-500/60
                      hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 transition-all duration-200">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center
                      group-hover:bg-emerald-500/20 dark:group-hover:bg-emerald-500/30 transition-colors">
                      <BookOpen size={18} className="text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Teacher</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Manage classes & attendance</p>
                    </div>
                  </button>
                </div>

                <p className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800
                              text-center text-sm text-slate-500 dark:text-slate-400">
                  Already have an account?{" "}
                  <button onClick={() => navigate("/login")}
                    className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-500
                      bg-clip-text text-transparent hover:opacity-80 transition">
                    Sign in
                  </button>
                </p>
              </motion.div>
            )}

            {/* ── Signup Flow (only when role is selected) ── */}
            {roleParam && (
              <>
                {!signupSuccess ? (
                  <Stepper
                    initialStep={step}
                    onStepChange={setStep}
                    onFinalStepCompleted={handleFinalSubmit}
                    backButtonText="Back"
                    nextButtonText="Continue"
                    stepCircleContainerClassName="!border-none !shadow-none !bg-transparent"
                    stepContainerClassName="!p-0 !mb-6 justify-center"
                    contentClassName="!px-0"
                    footerClassName={step === 3 ? "!px-0 !pb-0" : "hidden"}
                    renderStepIndicator={({ step: s, currentStep, onStepClick }) => {
                      const isActive = currentStep === s
                      const isCompleted = currentStep > s
                      return (
                        <div className="flex flex-col items-center gap-1.5 group cursor-pointer" onClick={() => onStepClick(s)}>
                          <motion.div
                            animate={{ scale: isActive ? 1.1 : 1 }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2
                              ${isCompleted 
                                ? "bg-green-500 border-green-500 text-white" 
                                : isActive 
                                  ? "bg-[#5227FF] border-[#5227FF] text-white" 
                                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500"}`}
                          >
                            {isCompleted ? <Check size={14} /> : s}
                          </motion.div>
                          <span className={`text-[10px] font-medium transition-colors ${isActive ? "text-[#5227FF]" : "text-slate-400 dark:text-slate-500"}`}>
                            {STEP_LABELS[s-1]}
                          </span>
                        </div>
                      )
                    }}
                    backButtonProps={{
                      className: "text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    }}
                    nextButtonProps={{
                      className: `!h-10 !px-6 !rounded-xl !bg-gradient-to-r !from-blue-600 !to-indigo-600 !hover:from-blue-500 !hover:to-indigo-500 !shadow-lg !shadow-blue-600/25 !text-sm !font-semibold !text-white !transition ${loading ? 'opacity-60 pointer-events-none' : ''}`
                    }}
                  >
                    <Step>
                      <div className="space-y-4">
                        {/* Google OAuth - step 1 only */}
                        <div className="overflow-hidden">
                          <button type="button" onClick={signupWithGoogle}
                            className="w-full flex items-center justify-center gap-2.5 h-9 mb-3
                              border border-slate-200 dark:border-slate-700
                              bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50
                              text-slate-700 dark:text-slate-200 text-sm font-medium rounded-xl
                              transition-all duration-200 shadow-sm">
                            <GoogleIcon /> Continue with Google
                          </button>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">OR</span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                          </div>
                        </div>
                        <AccountStep data={signupData} setData={setSignupData} onNext={() => setStep(2)} />
                      </div>
                    </Step>

                    <Step>
                      <AcademicStep data={signupData} setData={setSignupData}
                        onBack={() => setStep(1)} onNext={() => setStep(3)}
                        accountType={signupData.accountType} />
                    </Step>

                    <Step>
                      <div className="space-y-3.5">
                        <div>
                          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Almost there!</h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Step 3 of 3 - Confirm and create</p>
                        </div>

                        <div className="rounded-xl border border-slate-200 dark:border-slate-700
                                        bg-slate-50 dark:bg-slate-800/50 px-3.5 py-3 space-y-2">
                          <SummaryRow label="Name"     value={signupData.name} />
                          <SummaryRow label="Email"    value={signupData.email} />
                          <SummaryRow label="Password" value="••••••••" />
                          <SummaryRow label="Username" value={`@${signupData.username}`} />
                          {isTeacher && <SummaryRow label="Account Type" value="Teacher" />}
                          {universityName && <SummaryRow label="University" value={universityName} />}
                          {!isTeacher && programName && <SummaryRow label="Program" value={programName} />}
                          {!isTeacher && branchName  && <SummaryRow label="Branch"  value={branchName} />}
                        </div>

                        {isTeacher && (
                          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2.5">
                            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                              <strong>Note:</strong> Teacher accounts start with standard access. An administrator must approve your teacher privileges before you can manage classes.
                            </p>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="flex items-start gap-2.5 cursor-pointer">
                            <div onClick={() => { setPrivacyAccepted(p => !p); setPrivacyError(false) }}
                              className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 border-2 flex items-center justify-center
                                transition-colors duration-150 cursor-pointer
                                ${privacyAccepted
                                  ? "bg-blue-600 border-blue-600"
                                  : privacyError
                                    ? "border-red-500 bg-white dark:bg-slate-800"
                                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800"
                                }`}>
                              {privacyAccepted && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                              We use cookies and local storage for sessions and preferences. No tracking or ads.{" "}
                              <Link to="/privacy"
                                className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline underline-offset-2 transition">
                                Privacy Policy
                              </Link>
                            </span>
                          </label>
                          {privacyError && (
                            <p className="text-xs text-red-500 dark:text-red-400 ml-6">Please accept the Privacy Policy to continue.</p>
                          )}
                        </div>

                        {error && (
                          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 px-3 py-2.5">
                            <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                          </div>
                        )}
                        {loading && (
                          <p className="text-xs text-blue-500 dark:text-blue-400 text-center animate-pulse">Creating account...</p>
                        )}
                      </div>
                    </Step>
                  </Stepper>
                ) : (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4 py-8">
                    <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <Check className="text-green-500" size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Account created!</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Redirecting you to dashboard…</p>
                  </motion.div>
                )}

                {/* Bottom link - separated with border, not cramped */}
                {!signupSuccess && roleParam && (
                  <p className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800
                                text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an account?{" "}
                    <button onClick={() => navigate("/login")}
                      className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-500
                        bg-clip-text text-transparent hover:opacity-80 transition">
                      Sign in
                    </button>
                  </p>
                )}
              </>
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
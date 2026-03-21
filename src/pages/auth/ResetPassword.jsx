import { useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { functions } from "@/lib/appwrite"
import { Eye, EyeOff, KeyRound, Check } from "lucide-react"
import { motion } from "framer-motion"

const ResetPassword = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const userId = searchParams.get("userId")
  const secret = searchParams.get("secret")

  const [newPassword, setNewPassword] = useState("")
  const [confirmPass, setConfirmPass] = useState("")
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState(null)
  const [success,     setSuccess]     = useState(false)

  // Invalid link guard
  if (!userId || !secret) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4
        bg-gradient-to-br from-slate-100 via-white to-slate-200
        dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mx-auto">
            <KeyRound size={20} className="text-red-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Invalid reset link</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">This link is invalid or has expired.</p>
          <button onClick={() => navigate("/login")}
            className="text-sm text-blue-500 hover:text-blue-600 font-medium transition">
            Back to login
          </button>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!newPassword || !confirmPass) { setError("Both fields are required"); return }
    if (newPassword.length < 8)       { setError("Password must be at least 8 characters"); return }
    if (newPassword !== confirmPass)   { setError("Passwords don't match"); return }

    try {
      setLoading(true)

      // Call Appwrite Function to reset password server-side (no session needed)
      const execution = await functions.createExecution(
        import.meta.env.VITE_APPWRITE_RECOVERY_FUNCTION_ID,
        JSON.stringify({ userId, secret, newPassword }),
        false,
        "/",
        "POST"
      )

      const result = JSON.parse(execution.responseBody || "{}")
      if (result.error) throw new Error(result.error)

      setSuccess(true)
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      setError(err?.message ?? "Reset failed. The link may have expired.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4
      bg-gradient-to-br from-slate-100 via-white to-slate-200
      dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]">

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
        <div className="bg-white/90 dark:bg-[#0f1b2e]/80 backdrop-blur-2xl
          border border-slate-200/80 dark:border-white/[0.07]
          shadow-2xl shadow-slate-200/60 dark:shadow-black/60
          rounded-2xl p-8">

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-green-100 dark:bg-green-500/10
                flex items-center justify-center">
                <Check size={28} className="text-green-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Password reset!</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Redirecting you to login…
              </p>
            </motion.div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600
                  flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                  <KeyRound size={18} className="text-white" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Set new password</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Choose a strong password for your account.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="w-full h-10 px-3.5 pr-10 rounded-xl border
                        border-slate-200 dark:border-white/10
                        bg-slate-50 dark:bg-white/5
                        text-slate-900 dark:text-white
                        placeholder:text-slate-400 dark:placeholder:text-slate-600
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                        transition text-sm"
                    />
                    <button type="button" onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {newPassword && (
                    <div className="flex gap-1 mt-1.5">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          newPassword.length >= 8 + i * 4
                            ? i < 1 ? "bg-red-400" : i < 2 ? "bg-yellow-400" : i < 3 ? "bg-blue-400" : "bg-green-400"
                            : "bg-slate-200 dark:bg-white/10"
                        }`} />
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPass}
                      onChange={e => setConfirmPass(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full h-10 px-3.5 pr-10 rounded-xl border
                        border-slate-200 dark:border-white/10
                        bg-slate-50 dark:bg-white/5
                        text-slate-900 dark:text-white
                        placeholder:text-slate-400 dark:placeholder:text-slate-600
                        focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                        transition text-sm"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirmPass && (
                    <p className={`text-xs ${newPassword === confirmPass ? "text-green-500" : "text-red-400"}`}>
                      {newPassword === confirmPass ? "✓ Passwords match" : "✗ Passwords don't match"}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 mt-1 rounded-xl font-semibold text-sm text-white
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
                      Resetting…
                    </>
                  ) : "Reset Password"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
                Remember it?{" "}
                <button onClick={() => navigate("/login")}
                  className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition">
                  Back to login
                </button>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default ResetPassword
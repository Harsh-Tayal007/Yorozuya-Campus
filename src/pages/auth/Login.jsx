import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useNavigate, useLocation, Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { account } from "@/lib/appwrite"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { motion } from "framer-motion"

// ── OAuth handler ─────────────────────────────────────────────────────────────
const loginWithGoogle = () => {
  account.createOAuth2Session(
    "google",
    `${window.location.origin}/oauth/callback`,
    `${window.location.origin}/login`
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
const OrDivider = () => (
  <div className="flex items-center gap-3 my-1">
    <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">OR</span>
    <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
  </div>
)

// ── OAuth Button ──────────────────────────────────────────────────────────────
const OAuthButton = ({ onClick, icon, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="
      w-full flex items-center justify-center gap-2.5 h-10
      border border-slate-200 dark:border-white/10
      bg-white dark:bg-white/5
      hover:bg-slate-50 dark:hover:bg-white/10
      text-slate-700 dark:text-slate-200
      text-sm font-medium rounded-lg
      transition-all duration-200
      shadow-sm hover:shadow
    "
  >
    {icon}
    {label}
  </button>
)

// ── Google SVG ────────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.1 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 10-1.9 13.6-5.1l-6.3-5.2C29.5 35.5 26.9 36 24 36c-5.2 0-9.6-3-11.3-7.3L6 33.8C9.4 39.7 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.2-2.3 4.1-4.3 5.4l6.3 5.2C41 35.3 44 30 44 24c0-1.3-.1-2.7-.4-4z" />
  </svg>
)

// ── Main Component ────────────────────────────────────────────────────────────
const Login = () => {
  const { login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Respect redirect-after-login
  const from = location.state?.from?.pathname || "/dashboard"

  const [form, setForm] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!form.email.trim()) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Enter a valid email"
    if (!form.password) newErrors.password = "Password is required"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: "" })
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setError(null)
    try {
      await login({ email: form.email, password: form.password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err?.message || "Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="
      relative min-h-screen flex items-center justify-center overflow-hidden px-4
      bg-gradient-to-br
      from-slate-100 via-white to-slate-200
      dark:from-[#080e1a] dark:via-[#0d1628] dark:to-[#080e1a]
    ">
      {/* Glow blobs */}
      <div className="pointer-events-none absolute w-[500px] h-[500px] rounded-full blur-3xl opacity-40
        bg-blue-400 dark:bg-blue-600
        top-[-160px] left-[-160px]" />
      <div className="pointer-events-none absolute w-[400px] h-[400px] rounded-full blur-3xl opacity-30
        bg-indigo-400 dark:bg-violet-700
        bottom-[-120px] right-[-120px]" />

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="
          bg-white/90 dark:bg-[#0f1b2e]/80
          backdrop-blur-2xl
          border border-slate-200/80 dark:border-white/[0.07]
          shadow-2xl shadow-slate-200/60 dark:shadow-black/60
        ">
          <CardHeader className="space-y-1.5 text-center pb-2 pt-8">
            {/* Logo mark */}
            <div className="mx-auto mb-3 w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Welcome back
            </CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to your Unizuya account
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8 pt-4">
            {/* OAuth Button */}
            <OAuthButton onClick={loginWithGoogle} icon={<GoogleIcon />} label="Continue with Google" />
            <div className="mb-5" />

            <OrDivider />

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  disabled={loading}
                  className="
                    h-10
                    bg-slate-50 dark:bg-white/5
                    border-slate-200 dark:border-white/10
                    text-slate-900 dark:text-white
                    placeholder:text-slate-400 dark:placeholder:text-slate-600
                    focus:border-blue-500 focus:ring-blue-500/20
                    transition
                  "
                />
                {errors.email && <p className="text-xs text-red-500 dark:text-red-400">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={form.password}
                    onChange={handleChange}
                    disabled={loading}
                    className="
                      h-10 pr-10
                      bg-slate-50 dark:bg-white/5
                      border-slate-200 dark:border-white/10
                      text-slate-900 dark:text-white
                      placeholder:text-slate-400 dark:placeholder:text-slate-600
                      focus:border-blue-500 focus:ring-blue-500/20
                      transition
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    disabled={!form.password || loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition disabled:opacity-30"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 dark:text-red-400">{errors.password}</p>}
              </div>

              {/* Backend error */}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-3 py-2.5">
                  <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
                </div>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="
                  w-full h-10 mt-1
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  hover:from-blue-500 hover:to-indigo-500
                  text-white font-semibold
                  shadow-lg shadow-blue-600/25
                  transition-all duration-200
                  disabled:opacity-60
                "
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Signing in…
                  </span>
                ) : "Sign in"}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent hover:opacity-80 transition"
              >
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

export default Login
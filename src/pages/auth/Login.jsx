import { useState, useEffect } from "react"
import { Eye, EyeOff } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { Link } from "react-router-dom"

import { motion } from "framer-motion"

const Login = () => {
  const { login, authStatus, currentUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

// useEffect(() => {
//   console.log("Auth user:", currentUser)
// }, [currentUser])


  const from = location.state?.from?.pathname || "/"

  const [form, setForm] = useState({
    email: "",
    password: "",
  })

  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  // backend / auth error
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // ---------- validation ----------
  const validate = () => {
    const newErrors = {}

    // Email
    if (!form.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address"
    }

    // Password
    if (!form.password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: "" }) // clear field error
    setError(null) // clear backend error while typing
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log("Redirect from:", location.state)

    if (!validate()) return

    setLoading(true)
    setError(null)

    try {
      await login({
        email: form.email,
        password: form.password,
      })

      // redirect after successful login
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="
  relative min-h-screen flex items-center justify-center overflow-hidden px-4
  bg-gradient-to-br 
  from-slate-100 via-white to-slate-200
  dark:from-[#0b1220] dark:via-[#0f1b2e] dark:to-[#0b1220]
">


      {/* Animated Background Blobs */}
      <div className="
  absolute w-[400px] h-[400px] rounded-full blur-3xl
  bg-blue-500/20 dark:bg-blue-600/20
  animate-pulse top-[-120px] left-[-120px]
" />

      <div className="
  absolute w-[400px] h-[400px] rounded-full blur-3xl
  bg-indigo-400/20 dark:bg-indigo-600/20
  animate-pulse bottom-[-120px] right-[-120px]
" />


      {/* Animated Card */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
        className="relative z-10 w-full max-w-md"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Card className="
  bg-white/80 dark:bg-white/5
  backdrop-blur-xl
  border border-slate-200 dark:border-white/10
  shadow-xl dark:shadow-2xl dark:shadow-black/40
  transition-all duration-300
">

            <CardHeader className="space-y-2 text-center">
              <CardTitle className="
  text-3xl font-bold
  text-slate-900 dark:text-white
">

                Welcome back
              </CardTitle>
              <p className="text-sm text-slate-500 dark:text-gray-400">

                Sign in to your account
              </p>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">
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
  bg-white dark:bg-white/5
  border-slate-300 dark:border-white/10
  text-slate-900 dark:text-white
  placeholder:text-slate-400 dark:placeholder:text-gray-500
  focus:border-blue-500 focus:ring-blue-500
"

                  />
                  {errors.email && (
                    <p className="text-xs text-red-400">{errors.email}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">
                    Password
                  </Label>

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
  bg-white dark:bg-white/5
  border-slate-300 dark:border-white/10
  text-slate-900 dark:text-white
  placeholder:text-slate-400 dark:placeholder:text-gray-500
  focus:border-blue-500 focus:ring-blue-500
"

                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={!form.password || loading}
                      className="
                  absolute right-3 top-1/2 -translate-y-1/2
                  text-gray-400 hover:text-white
                  transition 
                "
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {errors.password && (
                    <p className="text-xs text-red-400">{errors.password}</p>
                  )}
                </div>

                {/* Backend error */}
                {error && (
                  <p className="text-sm text-red-400 text-center">
                    {error}
                  </p>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="
              w-full h-11
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-500 hover:to-indigo-500
              text-white font-medium
              transition-all duration-300
              shadow-lg shadow-blue-600/20
            "
                >
                  {loading ? "Signing in..." : "Sign in"}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-400">
                Don’t have an account?{" "}
                <Link
                  to="/signup"
                  className="text-blue-400 hover:text-blue-300 font-medium transition"
                >
                  Sign up
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )

}

export default Login

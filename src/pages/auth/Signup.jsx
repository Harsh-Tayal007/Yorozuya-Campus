import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"

import { Link } from "react-router-dom"

import { motion } from "framer-motion"


const Signup = () => {
    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
    })

    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)

    const { signup } = useAuth()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)


    // ---------- helpers ----------
    const validate = () => {
        const newErrors = {}

        // Name
        if (!form.name.trim()) {
            newErrors.name = "Name is required"
        } else if (form.name.length < 2) {
            newErrors.name = "Name must be at least 2 characters"
        }

        // Email
        if (!form.email.trim()) {
            newErrors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Enter a valid email address"
        }

        // Password
        if (!form.password) {
            newErrors.password = "Password is required"
        } else if (form.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters"
        } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(form.password)) {
            newErrors.password = "Must include letters and numbers"
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value })
        setErrors({ ...errors, [e.target.name]: "" }) // clear error as user types
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            await signup({
                name: form.name,
                email: form.email,
                password: form.password,
            })

            navigate("/", { replace: true })
        } catch (err) {
            setError(err?.message || "Signup failed")
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

    {/* Glow Blobs */}
    <div className="absolute w-[400px] h-[400px] rounded-full blur-3xl
      bg-blue-500/20 dark:bg-blue-600/20
      animate-pulse top-[-120px] left-[-120px]" />

    <div className="absolute w-[400px] h-[400px] rounded-full blur-3xl
      bg-indigo-400/20 dark:bg-indigo-600/20
      animate-pulse bottom-[-120px] right-[-120px]" />

    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative z-10 w-full max-w-md"
       whileHover={{ scale: 1.02 }}
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >

        <Card className="
          bg-white/80 dark:bg-white/5
          backdrop-blur-xl
          border border-slate-200 dark:border-white/10
          shadow-xl dark:shadow-2xl dark:shadow-black/40
          transition-all duration-300
        ">

          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-3xl font-bold text-slate-900 dark:text-white">
              Create account
            </CardTitle>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              Enter your details to get started
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Name */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-gray-300">
                  Name
                </Label>
                <Input
                  name="name"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  className="
                    bg-white dark:bg-white/5
                    border-slate-300 dark:border-white/10
                    text-slate-900 dark:text-white
                    placeholder:text-slate-400 dark:placeholder:text-gray-500
                    focus:border-blue-500 focus:ring-blue-500
                    selection:bg-blue-500 selection:text-white
                  "
                />
                {errors.name && (
                  <p className="text-xs text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-gray-300">
                  Email
                </Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  className="
                    bg-white dark:bg-white/5
                    border-slate-300 dark:border-white/10
                    text-slate-900 dark:text-white
                    placeholder:text-slate-400 dark:placeholder:text-gray-500
                    focus:border-blue-500 focus:ring-blue-500
                    selection:bg-blue-500 selection:text-white
                  "
                />
                {errors.email && (
                  <p className="text-xs text-red-400">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label className="text-slate-700 dark:text-gray-300">
                  Password
                </Label>

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="At least 8 characters"
                    value={form.password}
                    onChange={handleChange}
                    className="
                      pr-10
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
                    className="
                      absolute right-3 top-1/2 -translate-y-1/2
                      text-slate-400 dark:text-gray-400
                      hover:text-slate-700 dark:hover:text-white
                      transition
                    "
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {errors.password ? (
                  <p className="text-xs text-red-400">{errors.password}</p>
                ) : (
                  <p className="text-xs text-slate-500 dark:text-gray-500">
                    Use at least 8 characters with letters and numbers
                  </p>
                )}
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="
                  w-full h-11
                  bg-gradient-to-r from-blue-600 to-indigo-600
                  hover:from-blue-500 hover:to-indigo-500
                  text-white
                  shadow-lg shadow-blue-600/20
                "
              >
                {loading ? "Creating account..." : "Sign up"}
              </Button>

            </form>

            <div className="mt-6 text-center text-sm text-slate-500 dark:text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                Login
              </Link>
            </div>
          </CardContent>
        </Card>

      </motion.div>
    </motion.div>
  </div>
)

}

export default Signup

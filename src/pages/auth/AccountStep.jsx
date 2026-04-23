import { useState, useEffect, useRef } from "react"
import { Eye, EyeOff, RefreshCw, Check, X, Loader2, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { generateUsernameCandidate, isUsernameAvailable } from "@/services/admin/authService"

const AccountStep = ({ data, setData, onNext }) => {
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  // ── Username state ─────────────────────────────────────────────────────────
  const [usernameStatus, setUsernameStatus] = useState("idle") // idle | checking | available | taken
  const checkTimer = useRef(null)

  // Generate a suggestion on first mount
  useEffect(() => {
    if (!data.username) generateSuggestion()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const generateSuggestion = async () => {
    const candidate = generateUsernameCandidate()
    setData(prev => ({ ...prev, username: candidate }))
    checkAvailability(candidate)
  }

  const checkAvailability = (val) => {
    if (!val || val.length < 3) {
      setUsernameStatus("idle")
      return
    }
    clearTimeout(checkTimer.current)
    setUsernameStatus("checking")
    checkTimer.current = setTimeout(async () => {
      try {
        const available = await isUsernameAvailable(val)
        setUsernameStatus(available ? "available" : "taken")
      } catch {
        setUsernameStatus("idle")
      }
    }, 500)
  }

  const handleUsernameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "")
    setData(prev => ({ ...prev, username: val }))
    setErrors(prev => ({ ...prev, username: "" }))
    checkAvailability(val)
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {}

    if (!data.name.trim()) {
      newErrors.name = "Name is required"
    } else if (data.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters"
    }

    if (!data.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Enter a valid email address"
    }

    if (!data.password) {
      newErrors.password = "Password is required"
    } else if (data.password.length < 8) {
      newErrors.password = "Minimum 8 characters"
    }

    if (!data.username || data.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters"
    } else if (usernameStatus === "taken") {
      newErrors.username = "This username is taken. Pick another or re-roll ↻"
    } else if (usernameStatus === "checking") {
      newErrors.username = "Still checking availability…"
    } else if (usernameStatus === "idle") {
      newErrors.username = "Enter a valid username"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field) => (e) => {
    setData((prev) => ({ ...prev, [field]: e.target.value }))
    setErrors((prev) => ({ ...prev, [field]: "" }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onNext()
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Create your account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Step 1 of 3 - Basic info</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Full Name
          </Label>
          <Input
            name="name"
            placeholder="John Doe"
            value={data.name}
            onChange={handleChange("name")}
            className="
              h-10
              bg-slate-50 dark:bg-slate-800/50
              border-slate-200 dark:border-slate-700
              text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:border-blue-500 focus:ring-blue-500/20
            "
          />
          {errors.name && <p className="text-xs text-red-500 dark:text-red-400">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
          </Label>
          <Input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={data.email}
            onChange={handleChange("email")}
            className="
              h-10
              bg-slate-50 dark:bg-slate-800/50
              border-slate-200 dark:border-slate-700
              text-slate-900 dark:text-slate-100
              placeholder:text-slate-400 dark:placeholder:text-slate-500
              focus:border-blue-500 focus:ring-blue-500/20
            "
          />
          {errors.email && <p className="text-xs text-red-500 dark:text-red-400">{errors.email}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Password
          </Label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Min. 8 characters"
              value={data.password}
              onChange={handleChange("password")}
              className="
                h-10 pr-10
                bg-slate-50 dark:bg-slate-800/50
                border-slate-200 dark:border-slate-700
                text-slate-900 dark:text-slate-100
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                focus:border-blue-500 focus:ring-blue-500/20
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              disabled={!data.password}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition disabled:opacity-30"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 dark:text-red-400">{errors.password}</p>}
          {/* Password strength bar */}
          {data.password && !errors.password && (
            <div className="flex gap-1 mt-1.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    data.password.length >= 8 + i * 4
                      ? i < 1 ? "bg-red-400 dark:bg-red-500"
                        : i < 2 ? "bg-yellow-400 dark:bg-yellow-500"
                        : i < 3 ? "bg-blue-400 dark:bg-blue-500"
                        : "bg-green-400 dark:bg-green-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Username ─────────────────────────────────────────────────────── */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Username
            </Label>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold leading-none
              bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400
              border border-amber-200 dark:border-amber-700">
              permanent
            </span>
          </div>

          <div className="relative">
            <Input
              value={data.username || ""}
              onChange={handleUsernameChange}
              placeholder="your_username"
              spellCheck={false}
              className="
                h-10 pr-16 font-mono text-sm
                bg-slate-50 dark:bg-slate-800/50
                border-slate-200 dark:border-slate-700
                text-slate-900 dark:text-slate-100
                placeholder:text-slate-400 dark:placeholder:text-slate-500
                focus:border-blue-500 focus:ring-blue-500/20
                transition
              "
            />

            {/* Status icon */}
            <div className="absolute right-9 top-1/2 -translate-y-1/2 flex items-center">
              {usernameStatus === "checking" && (
                <Loader2 size={13} className="animate-spin text-slate-400 dark:text-slate-500" />
              )}
              {usernameStatus === "available" && (
                <Check size={13} className="text-green-500" />
              )}
              {usernameStatus === "taken" && (
                <X size={13} className="text-red-500" />
              )}
            </div>

            {/* Re-roll button */}
            <button
              type="button"
              onClick={generateSuggestion}
              title="Generate new username"
              className="absolute right-2.5 top-1/2 -translate-y-1/2
                text-slate-400 dark:text-slate-500 hover:text-blue-500 dark:hover:text-blue-400
                transition-colors duration-150"
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Inline status text */}
          {usernameStatus === "available" && !errors.username && (
            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
              <Check size={11} /> Username available
            </p>
          )}
          {usernameStatus === "taken" && (
            <p className="text-xs text-red-500 dark:text-red-400">
              Username taken - try another or hit ↻ to re-roll
            </p>
          )}
          {errors.username && usernameStatus !== "taken" && (
            <p className="text-xs text-red-500 dark:text-red-400">{errors.username}</p>
          )}

          <p className="text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
            Lowercase letters, numbers and underscores only.{" "}
            <span className="text-amber-500 dark:text-amber-400 font-medium">This cannot be changed later.</span>
          </p>
        </div>

        <Button
          type="submit"
          className="
            w-full h-10 mt-2
            bg-gradient-to-r from-blue-600 to-indigo-600
            hover:from-blue-500 hover:to-indigo-500
            text-white font-semibold
            shadow-lg shadow-blue-600/25
            transition-all duration-200
            flex items-center justify-center gap-2
          "
        >
          Continue <ChevronRight size={14} />
        </Button>
      </form>
    </div>
  )
}

export default AccountStep
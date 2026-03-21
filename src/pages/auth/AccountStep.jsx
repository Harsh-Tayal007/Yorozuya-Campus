import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

const AccountStep = ({ data, setData, onNext }) => {
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Create your account</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Step 1 of 3 — Basic info</p>
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
              bg-slate-50 dark:bg-white/5
              border-slate-200 dark:border-white/10
              text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-600
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
              bg-slate-50 dark:bg-white/5
              border-slate-200 dark:border-white/10
              text-slate-900 dark:text-white
              placeholder:text-slate-400 dark:placeholder:text-slate-600
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
                bg-slate-50 dark:bg-white/5
                border-slate-200 dark:border-white/10
                text-slate-900 dark:text-white
                placeholder:text-slate-400 dark:placeholder:text-slate-600
                focus:border-blue-500 focus:ring-blue-500/20
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword((p) => !p)}
              disabled={!data.password}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition disabled:opacity-30"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500 dark:text-red-400">{errors.password}</p>}
          {/* Password strength hint */}
          {data.password && !errors.password && (
            <div className="flex gap-1 mt-1.5">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                    data.password.length >= 8 + i * 4
                      ? i < 1 ? "bg-red-400"
                        : i < 2 ? "bg-yellow-400"
                        : i < 3 ? "bg-blue-400"
                        : "bg-green-400"
                      : "bg-slate-200 dark:bg-white/10"
                  }`}
                />
              ))}
            </div>
          )}
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
          "
        >
          Continue
        </Button>
      </form>
    </div>
  )
}

export default AccountStep
import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

const AccountStep = ({ data, setData, onNext }) => {
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  const validate = () => {
    const newErrors = {}

    if (!data.name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!data.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      newErrors.email = "Enter a valid email"
    }

    if (!data.password) {
      newErrors.password = "Password is required"
    } else if (data.password.length < 8) {
      newErrors.password = "Minimum 8 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!validate()) return

    onNext() // 🔥 Just move to step 2
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Name */}
      <div>
        <input
          name="name"
          placeholder="Full Name"
          value={data.name}
          onChange={(e) =>
            setData(prev => ({
              ...prev,
              name: e.target.value
            }))
          }
          className="w-full p-3 rounded-lg bg-white/10"
        />
        {errors.name && (
          <p className="text-xs text-red-400 mt-1">{errors.name}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <input
          name="email"
          placeholder="Email"
          value={data.email}
          onChange={(e) =>
            setData(prev => ({
              ...prev,
              email: e.target.value
            }))
          }
          className="w-full p-3 rounded-lg bg-white/10"
        />
        {errors.email && (
          <p className="text-xs text-red-400 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Password"
          value={data.password}
          onChange={(e) =>
            setData(prev => ({
              ...prev,
              password: e.target.value
            }))
          }
          className="w-full p-3 rounded-lg bg-white/10"
        />

        <button
          type="button"
          onClick={() => setShowPassword(prev => !prev)}
          className="absolute right-3 top-3"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>

        {errors.password && (
          <p className="text-xs text-red-400 mt-1">{errors.password}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 py-3 rounded-lg"
      >
        Continue
      </button>
    </form>
  )
}

export default AccountStep

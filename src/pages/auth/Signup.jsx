import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"

import { Link } from "react-router-dom"


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
        <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md shadow-lg transition-all hover:shadow-xl">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-semibold">
                        Create account
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Enter your details to get started
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div className="space-y-1">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Your full name"
                                value={form.name}
                                onChange={handleChange}
                                className={errors.name ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">{errors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                className={errors.email ? "border-red-500 focus-visible:ring-red-500" : ""}
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500">{errors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-1">
                            <Label htmlFor="password">Password</Label>

                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="At least 8 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    className={`pr-10 ${errors.password
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : ""
                                        }`}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    disabled={!form.password}
                                    className="
                    absolute right-3 top-1/2 -translate-y-1/2
                    text-muted-foreground hover:text-foreground
                    transition disabled:opacity-50
                  "
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {errors.password ? (
                                <p className="text-xs text-red-500">{errors.password}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">
                                    Use at least 8 characters with letters and numbers
                                </p>
                            )}
                        </div>

                        {/* Submit */}
                        {error && (
                            <p className="text-sm text-red-500 text-center">
                                {error}
                            </p>
                        )}

                        <Button
                            className="w-full"
                            size="lg"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Creating account..." : "Sign up"}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            to="/login"
                            className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                            Login
                        </Link>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}

export default Signup

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function AuthRedirect({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) {
      // already logged in → kick out of auth pages
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true })
    }
  }, [user, loading, navigate])

  if (loading || user) return null

  return children
}

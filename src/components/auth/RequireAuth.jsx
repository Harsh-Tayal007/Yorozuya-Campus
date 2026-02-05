import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function RequireAuth({ children }) {
  const { authStatus, loading } = useAuth()

  if (loading) return null

  if (!authStatus) {
    return <Navigate to="/login" replace />
  }

  return children
}

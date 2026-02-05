import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function RequirePermissionRoute({ permission, children }) {
  const { hasPermission, loading, authStatus } = useAuth()

  // ⏳ Wait until auth is resolved
  if (loading) return null

  // 🔐 Not logged in
  if (!authStatus) {
    return <Navigate to="/login" replace />
  }

  // 🚫 Logged in but lacks permission
  if (!hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

const ProtectedRoute = () => {
  const { authStatus, isLoading } = useAuth()
  const location = useLocation()

  // ⏳ Wait until session restore completes
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">Checking session...</p>
      </div>
    )
  }

  // 🚫 Not authenticated → redirect to login
  if (!authStatus) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  // ✅ Authenticated → render route
  return <Outlet />
}

export default ProtectedRoute

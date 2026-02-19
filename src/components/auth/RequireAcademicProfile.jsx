import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

const RequireAcademicProfile = () => {
  const { currentUser, isLoading } = useAuth()
  const location = useLocation()

  // Wait for auth restore
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">
          Checking profile...
        </p>
      </div>
    )
  }

  // If somehow user missing (shouldn't happen because session guard exists)
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  // 🚨 Profile incomplete
  if (!currentUser.profileCompleted) {
    return (
      <Navigate
        to="/complete-profile"
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}

export default RequireAcademicProfile

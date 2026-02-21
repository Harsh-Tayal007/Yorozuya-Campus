import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Skeleton } from "@/components/ui/skeleton"

const ProtectedRoute = () => {
  const { currentUser, isLoading } = useAuth()
  const location = useLocation()

 if (isLoading) {
  return (
    <div className="min-h-screen px-6 py-8 space-y-6">
      
      {/* Top Bar Skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>

      {/* Title Skeleton */}
      <Skeleton className="h-8 w-64" />

      {/* Cards Grid Skeleton */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

    </div>
  )
}

  if (!currentUser) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return <Outlet />
}

export default ProtectedRoute
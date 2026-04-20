/**
 * ProtectedRoute.jsx
 *
 * Guards all logged-in routes.
 * Chain:
 *   1. Auth still loading     → <DashboardSkeleton /> (protected routes only)
 *   2. Not logged in          → /login
 *   3. Logged in, unverified  → <EmailVerificationGate />
 *   4. Logged in, verified    → render <Outlet />
 *
 * Because AuthContext now hydrates instantly from sessionStorage on repeat
 * visits, the skeleton will only flash on true cold visits.
 */

import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Skeleton } from "@/components/ui/skeleton"
import EmailVerificationGate from "@/components/auth/EmailVerificationGate"

// ── Dashboard skeleton - mimics the real dashboard layout ───────────────────
function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav bar */}
      <div className="h-14 border-b border-border px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-7 w-7 rounded-full" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - visible on desktop */}
        <aside className="hidden md:flex flex-col w-56 border-r border-border p-4 gap-2 flex-shrink-0">
          <Skeleton className="h-4 w-20 rounded mb-2" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5">
              <Skeleton className="h-4 w-4 rounded flex-shrink-0" />
              <Skeleton className="h-3 rounded" style={{ width: `${55 + (i % 3) * 18}px` }} />
            </div>
          ))}
          <div className="mt-auto pt-4 border-t border-border">
            <div className="flex items-center gap-2 px-2">
              <Skeleton className="h-7 w-7 rounded-full flex-shrink-0" />
              <div className="flex flex-col gap-1 flex-1">
                <Skeleton className="h-3 w-24 rounded" />
                <Skeleton className="h-2 w-16 rounded" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main content area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 space-y-6">
          {/* Page header */}
          <div className="space-y-1.5">
            <Skeleton className="h-7 w-48 rounded" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>

          {/* Stat cards row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-2">
                <Skeleton className="h-3 w-16 rounded" />
                <Skeleton className="h-7 w-12 rounded" />
              </div>
            ))}
          </div>

          {/* Content cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
                  <Skeleton className="h-4 w-28 rounded" />
                </div>
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-4/5 rounded" />
                <Skeleton className="h-3 w-3/5 rounded" />
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

// ── ProtectedRoute ───────────────────────────────────────────────────────────
const ProtectedRoute = () => {
  const { currentUser, isLoading } = useAuth()
  const location = useLocation()

  // isLoading is only true on cold visits (no sessionStorage cache).
  // Repeat visits hydrate instantly so this skeleton is rarely seen.
  if (isLoading) return <DashboardSkeleton />

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  // OAuth users (Google) have emailVerification: true set by Appwrite.
  // Email/password signups must verify before accessing the dashboard.
  const isVerified =
    currentUser?.emailVerified    === true ||
    currentUser?.emailVerification === true

  if (!isVerified) return <EmailVerificationGate />

  return <Outlet />
}

export default ProtectedRoute
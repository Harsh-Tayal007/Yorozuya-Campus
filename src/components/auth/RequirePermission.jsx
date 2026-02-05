import { useAuth } from "@/context/AuthContext"
import { Navigate } from "react-router-dom"

export default function RequirePermission({
    permission,          // string OR array
    children,
    fallback = "/admin/dashboard", // sensible default
}) {
    const { hasPermission, loading } = useAuth()

    if (loading) return null

    const allowed = Array.isArray(permission)
        ? permission.some(hasPermission)
        : hasPermission(permission)

    if (!allowed) {
        return typeof fallback === "string"
            ? <Navigate to={fallback} replace />
            : fallback
    }

    return children
}

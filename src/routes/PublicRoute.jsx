import { Navigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth()

  if (currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PublicRoute
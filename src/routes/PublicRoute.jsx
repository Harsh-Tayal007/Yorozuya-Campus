import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

const PublicRoute = ({ children }) => {
  const { currentUser } = useAuth()
  const location = useLocation()
  const isSwitch = new URLSearchParams(location.search).get("switch") === "1"

  if (currentUser && !isSwitch) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PublicRoute
import { Link, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/AuthContext"
import { DarkModeToggle } from "."
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { Download } from "lucide-react"

import { motion } from "framer-motion"

const Navbar = () => {
  const navigate = useNavigate()
  const { isInstallable, install } = usePWAInstall();

  const {
    authStatus,
    currentUser,
    isLoading,
    logout,
    hasRole,
    hasAnyPermission
  } = useAuth()

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches;

  if (isLoading) return null

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <nav className="
  sticky top-0 z-50 w-full
  backdrop-blur-xl
  bg-white/70 dark:bg-[#0b1220]/70
  border-b border-slate-200 dark:border-white/10
  transition-all duration-300
">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

    {/* Logo */}
    <Link
      to="/"
      className="
        relative text-xl font-semibold tracking-tight
        text-slate-900 dark:text-white
        group
      "
    >
      Unizuya

      {/* Animated underline */}
      <span className="
        absolute left-0 -bottom-1 h-[2px] w-0
        bg-gradient-to-r from-blue-500 to-indigo-500
        transition-all duration-300
        group-hover:w-full
      " />
    </Link>

    {/* Right Section */}
    <div className="flex items-center gap-3">

      {/* Install Button */}
      {isInstallable && !isStandalone && (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={install}
            size="sm"
            className="
              gap-2
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-500 hover:to-indigo-500
              text-white
              shadow-md shadow-blue-500/20
            "
          >
            <Download className="h-4 w-4" />
            Install
          </Button>
        </motion.div>
      )}

      <DarkModeToggle />

      {/* Auth Section */}
      {authStatus ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }}>
              <Button
                variant="outline"
                className="
                  h-9 px-4 text-sm
                  bg-white/60 dark:bg-white/5
                  border-slate-300 dark:border-white/10
                  text-slate-900 dark:text-white
                  backdrop-blur-md
                  hover:bg-slate-100 dark:hover:bg-white/10
                  transition-all duration-200
                "
              >
                {currentUser?.name || currentUser?.email}
              </Button>
            </motion.div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="
              w-48
              bg-white dark:bg-[#111827]
              border border-slate-200 dark:border-white/10
              shadow-xl
              backdrop-blur-xl
            "
          >
            {hasAnyPermission(["view:admin-dashboard"]) && (
              <>
                <DropdownMenuItem asChild>
                  <Link to="/admin/dashboard">
                    Admin Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem
              onClick={handleLogout}
              className="
                text-red-500
                focus:text-red-500
              "
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            asChild
            size="sm"
            className="
              bg-gradient-to-r from-blue-600 to-indigo-600
              hover:from-blue-500 hover:to-indigo-500
              text-white
              shadow-md shadow-blue-500/20
            "
          >
            <Link to="/login">Login</Link>
          </Button>
        </motion.div>
      )}
    </div>
  </div>
</nav>

  )

}

export default Navbar

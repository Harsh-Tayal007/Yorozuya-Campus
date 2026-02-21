import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import { DarkModeToggle } from "."
import { usePWAInstall } from "@/hooks/usePWAInstall"
import { Download, Menu } from "lucide-react"

import { motion } from "framer-motion"

import { useScroll, useMotionValueEvent } from "framer-motion"
import { useState } from "react"
import { useSidebar } from "@/context/SidebarContext"

const Navbar = ({
  isSidebarOpen,
  setIsSidebarOpen,
}) => {
  const navigate = useNavigate()
  const { isInstallable, install } = usePWAInstall();

  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)

  const location = useLocation()

 const sidebar = useSidebar()

 const toggleSidebar = () => {
  const isDesktop = window.innerWidth >= 1024

  if (!isDesktop) {
    sidebar.setIsOpen(prev => !prev)
    return
  }

  if (sidebar.isPinned) {
    sidebar.setIsPinned(false)
    sidebar.setIsOpen(false)
  } else {
    sidebar.setIsPinned(true)
    sidebar.setIsOpen(true)
  }
}

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 20)
  })

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

  const handleLogout = async () => {
  await logout()
  navigate("/", { replace: true })
}
  return (
    <nav
      className={`
    fixed top-0 left-0 right-0 z-30 w-full
    backdrop-blur-xl backdrop-saturate-150
    bg-white/40 dark:bg-[#0b1220]/40
    border-b border-white/10 dark:border-white/10
    shadow-[0_8px_30px_rgba(0,0,0,0.12)]
    transition-all duration-300
    ${sidebar?.isOpen ? "brightness-75 pointer-events-none" : ""}
  `}
    >
      {/* Top subtle gradient highlight */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/20 to-transparent dark:from-white/5 pointer-events-none" />
      <motion.div
        animate={{ height: isScrolled ? 58 : 70 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative mx-auto flex max-w-7xl items-center justify-between px-6"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">

          {/* Sidebar Trigger */}
            <button
              onClick={toggleSidebar}
              className="
    p-2 rounded-lg
    cursor-pointer
    relative
    text-slate-800 dark:text-white

    bg-white/50 dark:bg-white/5
    backdrop-blur-md
    border border-white/20 dark:border-white/10

    hover:text-indigo-500 dark:hover:text-indigo-400
    hover:border-indigo-400/50
    hover:shadow-[0_0_18px_rgba(99,102,241,0.35)]

    hover:scale-110
    active:scale-95

    transition-all duration-200 ease-out

    focus:outline-none
    focus-visible:ring-2
    focus-visible:ring-indigo-500/60
  "
            >
              <span className="
  absolute inset-0 rounded-lg
  bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0
  opacity-0 hover:opacity-100
  transition-opacity duration-300
  pointer-events-none
" />

              <Menu size={18} />
            </button>

          {/* Logo */}
          <motion.div
            initial="rest"
            whileHover="hover"
            className="relative"
          >
            <Link
              to="/"
              className="relative inline-block text-xl md:text-2xl font-semibold tracking-tight text-slate-900 dark:text-white transition-colors duration-300 hover:text-indigo-500"
            >
              Unizuya
            </Link>
          </motion.div>

        </div>

        <div className="flex items-center gap-3 sm:gap-4">

          {/* Install Button */}
          {isInstallable && !isStandalone && (
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={install}
              className="
            hidden sm:flex items-center gap-2
            rounded-lg px-3 py-1.5 text-sm
            bg-blue-600 text-white
            shadow-md hover:shadow-lg
            transition-all duration-200
          "
            >
              <Download className="h-4 w-4" />
              Install
            </motion.button>
          )}

          <DarkModeToggle />

          {/* Auth */}
          {isLoading ? (
            <div className="h-8 w-20 rounded-md bg-white/20 dark:bg-white/10 animate-pulse" />
          ) : authStatus ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="
                flex items-center gap-2
                rounded-full px-2.5 py-1.5
                bg-white/70 dark:bg-white/5
                hover:bg-white/90 dark:hover:bg-white/10
                transition-all duration-200
                shadow-sm
              "
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-semibold">
                    {(currentUser?.name || currentUser?.email)?.charAt(0).toUpperCase()}
                  </div>

                  <span className="hidden sm:block text-sm text-slate-800 dark:text-white">
                    {currentUser?.name || currentUser?.email}
                  </span>
                </motion.button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="
    w-48 rounded-2xl
    bg-white/75 dark:bg-[#111827]/75
    backdrop-blur-2xl
    border border-white/20 dark:border-white/10
    shadow-[0_20px_60px_rgba(0,0,0,0.25)]
    p-2
  "
              >
                {hasAnyPermission(["view:admin-dashboard"]) && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin/dashboard"
                        className="
          flex items-center rounded-lg px-3 py-2 text-sm
          text-slate-800 dark:text-white
          hover:bg-white/60 dark:hover:bg-white/10
          transition-colors duration-150
        "
                      >
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1 bg-white/20 dark:bg-white/10" />
                  </>
                )}

                <DropdownMenuItem
                  onClick={handleLogout}
                  className="
    flex items-center rounded-lg px-3 py-2 text-sm
    text-red-500
    hover:bg-red-50 dark:hover:bg-red-500/10
    transition-colors duration-150
  "
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={{ duration: 0.2 }}
            >
              <Link
                to="/login"
                className="
      rounded-full px-4 py-1.5 text-sm
      bg-slate-900 text-white
      dark:bg-white dark:text-black
      hover:bg-slate-800 dark:hover:bg-slate-200
      focus:outline-none focus-visible:ring-2
      focus-visible:ring-indigo-500/60
      transition-all duration-200
      shadow-sm
    "
              >
                Login
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>
    </nav>
  )

}

export default Navbar

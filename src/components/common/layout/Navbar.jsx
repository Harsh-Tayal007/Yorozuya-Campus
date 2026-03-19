import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import { Menu, User, LayoutDashboard, Settings, LogOut, ChevronDown, ShieldCheck } from "lucide-react"
import { motion } from "framer-motion"
import { useScroll, useMotionValueEvent } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { useSidebar } from "@/context/SidebarContext"

const Navbar = () => {
  const navigate = useNavigate()
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [triggerRect, setTriggerRect] = useState(null)
  const triggerRef = useRef(null)
  const dropdownRef = useRef(null)
  const sidebar = useSidebar()

  const toggleSidebar = () => {
    const isDesktop = window.innerWidth >= 1024
    if (!isDesktop) { sidebar.setIsOpen(prev => !prev); return }
    if (sidebar.isPinned) { sidebar.setIsPinned(false); sidebar.setIsOpen(false) }
    else { sidebar.setIsPinned(true); sidebar.setIsOpen(true) }
  }

  useMotionValueEvent(scrollY, "change", (latest) => setIsScrolled(latest > 20))

  const { authStatus, currentUser, isLoading, logout, hasAnyPermission } = useAuth()

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => {
      if (
        !dropdownRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) setDropdownOpen(false)
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [dropdownOpen])

  useEffect(() => {
    if (!dropdownOpen) return
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setTriggerRect(rect)
    }
    update()
    window.addEventListener("scroll", update, { passive: true })
    window.addEventListener("resize", update)
    return () => {
      window.removeEventListener("scroll", update)
      window.removeEventListener("resize", update)
    }
  }, [dropdownOpen])

  const handleOpen = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setTriggerRect(rect)
    setDropdownOpen(v => !v)
  }

  const handleLogout = async () => {
    setDropdownOpen(false)
    await logout()
    navigate("/", { replace: true })
  }

  const Avatar = ({ className = "w-8 h-8" }) => {
    if (currentUser?.avatarUrl) {
      return (
        <img
          src={currentUser.avatarUrl}
          alt={currentUser.name}
          className={`${className} rounded-full object-cover border border-white/20`}
        />
      )
    }
    return (
      <div className={`${className} rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
                       flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
        {(currentUser?.name || currentUser?.email)?.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <>
      <nav
        className={`
          fixed top-0 left-0 right-0 z-30 w-full
          backdrop-blur-xl backdrop-saturate-150
          bg-white/40 dark:bg-[#0b1220]/40
          border-b border-white/10 dark:border-white/10
          shadow-[0_8px_30px_rgba(0,0,0,0.12)]
          transition-[filter,opacity] duration-300
          ${sidebar?.isOpen ? "brightness-75 pointer-events-none" : ""}
        `}
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/20 to-transparent
                        dark:from-white/5 pointer-events-none" />

        <motion.div
          animate={{ height: isScrolled ? 58 : 70 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="relative mx-auto flex max-w-7xl items-center justify-between px-6"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg cursor-pointer relative
                         text-slate-800 dark:text-white
                         bg-white/50 dark:bg-white/5 backdrop-blur-md
                         border border-white/20 dark:border-white/10
                         hover:text-indigo-500 dark:hover:text-indigo-400
                         hover:border-indigo-400/50
                         hover:shadow-[0_0_18px_rgba(99,102,241,0.35)]
                         hover:scale-110 active:scale-95
                         transition-[color,border-color,box-shadow,transform] duration-200 ease-out
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
            >
              <span className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/0
                               via-indigo-500/20 to-indigo-500/0 opacity-0 hover:opacity-100
                               transition-opacity duration-300 pointer-events-none" />
              <Menu size={18} />
            </button>
            <Link
              to="/"
              className="relative inline-block text-xl md:text-2xl font-semibold tracking-tight
                         text-slate-900 dark:text-white transition-colors duration-300 hover:text-indigo-500"
            >
              Unizuya
            </Link>
          </div>

          {/* Right side — DarkModeToggle removed, moved to Settings > Preferences */}
          <div className="flex items-center gap-3 sm:gap-4">
            {isLoading ? (
              <div className="h-8 w-20 rounded-md bg-white/20 dark:bg-white/10 animate-pulse" />
            ) : authStatus ? (
              <motion.button
                ref={triggerRef}
                onClick={handleOpen}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 rounded-full px-2.5 py-1.5
                           bg-white/70 dark:bg-white/5
                           hover:bg-white/90 dark:hover:bg-white/10
                           transition-colors duration-200 shadow-sm"
              >
                <Avatar className="w-8 h-8" />
                <span className="hidden sm:block text-sm text-slate-800 dark:text-white">
                  {currentUser?.name || currentUser?.email}
                </span>
                <ChevronDown
                  size={13}
                  className={`hidden sm:block text-slate-500 dark:text-slate-400
                              transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                />
              </motion.button>
            ) : (
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ duration: 0.2 }}>
                <Link
                  to="/login"
                  className="rounded-full px-4 py-1.5 text-sm
                             bg-slate-900 text-white dark:bg-white dark:text-black
                             hover:bg-slate-800 dark:hover:bg-slate-200
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60
                             transition-colors duration-200 shadow-sm"
                >
                  Login
                </Link>
              </motion.div>
            )}
          </div>
        </motion.div>
      </nav>

      {/* Dropdown rendered at document root — escapes all stacking contexts */}
      {dropdownOpen && triggerRect && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top:  triggerRect.bottom + 8,
            right: window.innerWidth - triggerRect.right,
          }}
          className="w-52 z-[9999] rounded-2xl border border-border bg-background
                     shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden p-1.5
                     animate-in fade-in-0 zoom-in-95 duration-100 origin-top-right"
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-0.5">
            {currentUser?.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name}
                   className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
                              flex items-center justify-center text-white text-xs font-semibold shrink-0">
                {(currentUser?.name || currentUser?.email)?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{currentUser?.name}</p>
              <p className="text-xs text-muted-foreground truncate">@{currentUser?.username}</p>
            </div>
          </div>

          <div className="h-px bg-border mx-1 mb-1" />

          <Link to={`/profile/${currentUser?.username}`} onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm
                       text-foreground hover:bg-muted transition-colors duration-150">
            <User size={14} className="text-muted-foreground shrink-0" />
            View Profile
          </Link>

          <Link to="/dashboard" onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm
                       text-foreground hover:bg-muted transition-colors duration-150">
            <LayoutDashboard size={14} className="text-muted-foreground shrink-0" />
            Dashboard
          </Link>

          <Link to="/dashboard/settings" onClick={() => setDropdownOpen(false)}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm
                       text-foreground hover:bg-muted transition-colors duration-150">
            <Settings size={14} className="text-muted-foreground shrink-0" />
            Settings
          </Link>

          {hasAnyPermission(["view:admin-dashboard"]) && (
            <>
              <div className="h-px bg-border mx-1 my-1" />
              <a href="/admin/dashboard" target="_blank" rel="noopener noreferrer"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm
                           text-foreground hover:bg-muted transition-colors duration-150">
                <ShieldCheck size={14} className="text-muted-foreground shrink-0" />
                Admin Dashboard
              </a>
            </>
          )}

          <div className="h-px bg-border mx-1 my-1" />

          <button onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-sm
                       text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10
                       transition-colors duration-150">
            <LogOut size={14} className="shrink-0" />
            Logout
          </button>
        </div>
      )}
    </>
  )
}

export default Navbar
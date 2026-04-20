// src/components/common/layout/Navbar.jsx
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"
import {
  Menu, User, LayoutDashboard, Settings,
  LogOut, ChevronDown, ShieldCheck, Users,
} from "lucide-react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { useState, useRef, useEffect } from "react"
import { useSidebar } from "@/context/SidebarContext"
import NotificationBell from "../navigation/NotificationBell"
import SwitchAccountModal from "../navigation/SwitchAccountModal"
import WhatsNewBadge from "../navigation/WhatsNewBadge"

const NAVBAR_H = 68

// ── Unizuya logo mark - bounces once on hover ─────────────────────────────────
const NavLogoMark = () => {
  const [bouncing, setBouncing] = useState(false)

  const handleHover = () => {
    if (bouncing) return
    setBouncing(true)
    // Reset after animation completes so it can trigger again
    setTimeout(() => setBouncing(false), 900)
  }

  return (
    <>
      <style>{`
        @keyframes nav-bounce {
          0%   { transform: translateY(0)    scale(1, 1); }
          18%  { transform: translateY(-7px) scale(0.94, 1.06); }
          36%  { transform: translateY(0px)  scale(1.12, 0.88); }
          50%  { transform: translateY(-4px) scale(0.97, 1.03); }
          64%  { transform: translateY(0px)  scale(1.05, 0.96); }
          78%  { transform: translateY(-2px) scale(0.99, 1.01); }
          100% { transform: translateY(0)    scale(1, 1); }
        }
        .nav-logo-bounce {
          animation: nav-bounce 0.85s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        /* Beacon dot pulses gently at rest */
        @keyframes nav-beacon-idle {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.55; }
        }
        .nav-beacon-dot {
          animation: nav-beacon-idle 2.4s ease-in-out infinite;
        }
        .nav-logo-bounce .nav-beacon-dot {
          animation: none;
          opacity: 1;
        }
      `}</style>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 120 120"
        width="26"
        height="26"
        fill="none"
        aria-hidden="true"
        onMouseEnter={handleHover}
        className={`shrink-0 cursor-pointer select-none ${bouncing ? "nav-logo-bounce" : ""}`}
      >
        {/* Left page */}
        <path d="M28 32 L28 78 Q28 90 42 90 L58 90 L58 32 Z"
          fill="#4A9EFF" fillOpacity="0.14"/>
        <path d="M28 32 L28 78 Q28 90 42 90 L58 90 L58 32 Z"
          stroke="#4A9EFF" strokeWidth="5" strokeLinejoin="round" fill="none"/>

        {/* Right page */}
        <path d="M92 32 L92 78 Q92 90 78 90 L62 90 L62 32 Z"
          fill="#4A9EFF" fillOpacity="0.14"/>
        <path d="M92 32 L92 78 Q92 90 78 90 L62 90 L62 32 Z"
          stroke="#4A9EFF" strokeWidth="5" strokeLinejoin="round" fill="none"/>

        {/* Top crossbar */}
        <line x1="28" y1="32" x2="92" y2="32"
          stroke="#4A9EFF" strokeWidth="5" strokeLinecap="round"/>

        {/* Center spine */}
        <line x1="60" y1="32" x2="60" y2="90"
          stroke="#4A9EFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>

        {/* Beacon connector */}
        <line x1="60" y1="22" x2="60" y2="32"
          stroke="#4A9EFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>

        {/* Beacon dot */}
        <circle cx="60" cy="15" r="6.5" fill="#4A9EFF" className="nav-beacon-dot"/>
      </svg>
    </>
  )
}

const Navbar = () => {
  const navigate   = useNavigate()
  const sidebar    = useSidebar()
  const { scrollY } = useScroll()
  const [isScrolled,       setIsScrolled]       = useState(false)
  const [dropdownOpen,     setDropdownOpen]     = useState(false)
  const [triggerRect,      setTriggerRect]      = useState(null)
  const [switchModalOpen,  setSwitchModalOpen]  = useState(false)
  const triggerRef  = useRef(null)
  const dropdownRef = useRef(null)

  const { authStatus, currentUser, isLoading, logout, hasAnyPermission } = useAuth()

  useMotionValueEvent(scrollY, "change", latest => setIsScrolled(latest > 20))

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => {
      if (!dropdownRef.current?.contains(e.target) &&
          !triggerRef.current?.contains(e.target))
        setDropdownOpen(false)
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

  const Avatar = ({ size = "w-8 h-8" }) => {
    if (currentUser?.avatarUrl) {
      return (
        <img src={currentUser.avatarUrl} alt={currentUser.name}
             className={`${size} rounded-full object-cover border border-white/20 shrink-0`} />
      )
    }
    return (
      <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-indigo-500
                       flex items-center justify-center text-white text-xs font-semibold shrink-0`}>
        {(currentUser?.name || currentUser?.email)?.charAt(0).toUpperCase()}
      </div>
    )
  }

  return (
    <>
      <nav
        style={{ height: NAVBAR_H }}
        className="fixed top-0 left-0 right-0 z-30
                   flex items-center px-4 gap-3
                   backdrop-blur-xl backdrop-saturate-150
                   bg-white/50 dark:bg-[#0b1220]/60
                   border-b border-white/10 dark:border-white/5
                   shadow-[0_1px_0_rgba(0,0,0,0.05)]
                   transition-shadow duration-300"
      >
        {/* Hamburger */}
        <button
          onClick={sidebar.toggleSidebar}
          className="p-2 rounded-lg text-muted-foreground
                     hover:text-foreground hover:bg-muted
                     transition-colors duration-150 shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Logo mark + wordmark */}
        <Link to="/" className="flex items-center gap-2 group">
          <NavLogoMark />
          <span className="text-lg font-semibold tracking-tight text-foreground
                           group-hover:text-indigo-500 transition-colors duration-150">
            Unizuya
          </span>
        </Link>

        <div className="flex-1" />

        {/* Right - bell + auth */}
        {isLoading ? (
          <div className="h-8 w-24 rounded-full bg-muted animate-pulse" />
        ) : authStatus ? (
          <div className="flex items-center gap-2">
            <WhatsNewBadge />
            <NotificationBell />
            <button
              ref={triggerRef}
              onClick={handleOpen}
              className="flex items-center gap-2 rounded-full px-2.5 py-1.5
                         bg-white/60 dark:bg-white/5
                         hover:bg-white/80 dark:hover:bg-white/10
                         border border-white/20 dark:border-white/5
                         transition-colors duration-150"
            >
              <Avatar size="w-7 h-7" />
              <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
                {currentUser?.name || currentUser?.email}
              </span>
              <ChevronDown size={13}
                className={`hidden sm:block text-muted-foreground transition-transform duration-200
                            ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        ) : (
          <Link to="/login"
            className="rounded-full px-4 py-1.5 text-sm font-medium
                       bg-foreground text-background
                       hover:opacity-90 transition-opacity duration-150">
            Login
          </Link>
        )}
      </nav>

      {/* User dropdown */}
      {dropdownOpen && triggerRect && (
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top:   triggerRect.bottom + 8,
            right: window.innerWidth - triggerRect.right,
          }}
          className="w-52 z-[9999] rounded-2xl border border-border bg-background
                     shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden p-1.5
                     animate-in fade-in-0 zoom-in-95 duration-150 origin-top-right"
        >
          <div className="flex items-center gap-2.5 px-3 py-2.5">
            <Avatar size="w-9 h-9" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {currentUser?.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                @{currentUser?.username}
              </p>
            </div>
          </div>

          <div className="h-px bg-border mx-1 mb-1" />

          <DropItem to={`/profile/${currentUser?.username}`}
            icon={User} label="View Profile" onClose={() => setDropdownOpen(false)} />
          <DropItem to="/dashboard"
            icon={LayoutDashboard} label="Dashboard" onClose={() => setDropdownOpen(false)} />
          <DropItem to="/dashboard/settings"
            icon={Settings} label="Settings" onClose={() => setDropdownOpen(false)} />

          <div className="h-px bg-border mx-1 my-1" />
          <button
            onClick={() => { setDropdownOpen(false); setSwitchModalOpen(true) }}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl
                       text-sm text-foreground hover:bg-muted transition-colors duration-150"
          >
            <Users size={14} className="text-muted-foreground shrink-0" />
            Switch Account
          </button>

          {hasAnyPermission(["view:admin-dashboard"]) && (
            <>
              <div className="h-px bg-border mx-1 my-1" />
              <a href="/admin/dashboard" target="_blank" rel="noopener noreferrer"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl
                           text-sm text-foreground hover:bg-muted transition-colors">
                <ShieldCheck size={14} className="text-muted-foreground shrink-0" />
                Admin Dashboard
              </a>
            </>
          )}

          <div className="h-px bg-border mx-1 my-1" />

          <button onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl
                       text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10
                       transition-colors duration-150">
            <LogOut size={14} className="shrink-0" />
            Logout
          </button>
        </div>
      )}

      <SwitchAccountModal
        open={switchModalOpen}
        onClose={() => setSwitchModalOpen(false)}
      />
    </>
  )
}

const DropItem = ({ to, icon: Icon, label, onClose }) => (
  <Link to={to} onClick={onClose}
    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl
               text-sm text-foreground hover:bg-muted transition-colors duration-150">
    <Icon size={14} className="text-muted-foreground shrink-0" />
    {label}
  </Link>
)

export default Navbar
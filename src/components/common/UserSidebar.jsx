import { motion, AnimatePresence } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { useEffect, useRef } from "react"
import { X, Menu } from "lucide-react"

const sidebarWidth = 280

const spring = {
    type: "spring",
    stiffness: 220,
    damping: 26
}

const isMobile = window.innerWidth < 1024


export default function UserSidebar({
    isOpen,
    setIsOpen,
    isPinned,
    setIsPinned
}) {
    const location = useLocation()
    const sidebarRef = useRef()

    const isDesktop = window.innerWidth >= 1024

    // Close on route change
    useEffect(() => {
        setIsOpen(false)
        setIsPinned(false)
    }, [location.pathname])

    // Lock scroll on mobile
    useEffect(() => {
        if (isOpen && !isDesktop) {
            document.body.style.overflow = "hidden"
        } else {
            document.body.style.overflow = ""
        }
    }, [isOpen])

    // Auto close when mouse leaves (if not pinned)
    const handleMouseLeave = () => {
        if (!isPinned && isDesktop) {
            setIsOpen(false)
        }
    }

    const togglePin = () => {
        if (isPinned) {
            setIsPinned(false)
            setIsOpen(false)
        } else {
            setIsPinned(true)
            setIsOpen(true)
        }
    }

    return (
        <>
            {/* Overlay */}
            <motion.div
                initial={false}
                animate={{ opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => {
                    setIsOpen(false)
                    setIsPinned(false)
                }}
                className={`
        fixed inset-0 z-40
        bg-black/30
        backdrop-blur-sm
        ${isOpen ? "pointer-events-auto" : "pointer-events-none"}
      `}
            />

            {/* Sidebar */}
            <motion.aside
                onMouseLeave={handleMouseLeave}
                initial={false}
                animate={{
                    x: isOpen ? 0 : -320
                }}
               transition={{
  type: "spring",
  stiffness: isMobile ? 320 : 260,
  damping: 28,
  mass: 0.7
}}


                className="fixed top-0 left-0 bottom-0 z-50 w-[280px] origin-left"
            >
                {/* Inner wrapper for gap effect */}
                <motion.div
                    initial={false}
                    animate={{
                        margin: isMobile ? 0 : isPinned ? 0 : 16,
                        borderRadius: isMobile
                            ? "0px"
                            : isPinned
                                ? "0px 16px 0px 0px"
                                : "16px"
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 220,
                        damping: 28
                    }}
                    className="
          h-full
          bg-white/75 dark:bg-[#0b1220]/80
          backdrop-blur-2xl backdrop-saturate-150
          border border-white/10
          shadow-[0_20px_60px_rgba(0,0,0,0.35)]
          flex flex-col
        "
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500" />
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                Unizuya
                            </span>
                        </div>

                        <button
                            onClick={togglePin}
                            className="
              p-2 rounded-lg
              hover:bg-white/40 dark:hover:bg-white/10
              transition-all duration-200
            "
                        >
                            {isPinned ? <X size={18} /> : <Menu size={18} />}
                        </button>
                    </div>

                    {/* Links */}
                    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-2">
                        <SidebarLink to="/" label="Home" />
                        <SidebarLink to="/profile" label="Profile" />
                        <SidebarLink to="/settings" label="Settings" />
                    </div>
                </motion.div>
            </motion.aside>
        </>
    )

}

function SidebarLink({ to, label }) {
    return (
        <Link
            to={to}
            className="
        block rounded-xl px-4 py-3 text-sm
        text-slate-800 dark:text-white
        hover:bg-white/50 dark:hover:bg-white/10
        transition-all duration-200
      "
        >
            {label}
        </Link>
    )
}

import { motion, AnimatePresence } from "framer-motion"
import { Link, useLocation } from "react-router-dom"
import { useEffect, useRef, useState } from "react"
import { X, Menu, ChevronDown } from "lucide-react"

import { useSidebar } from "@/context/SidebarContext"
import { dashboardRootLink, dashboardSidebarSections, forumRootLink, homeRootLink } from "@/config/dashboardSidebarConfig"
import { useAcademicIdentity } from "@/hooks/useAcademicIdentity"
import { useAuth } from "@/context/AuthContext"

export default function UserSidebar() {

    const { isOpen, setIsOpen, isPinned, setIsPinned } = useSidebar()

    const isDesktop = window.innerWidth >= 1024

    const isMobile = window.innerWidth < 1024

    const location = useLocation()
    const [openSections, setOpenSections] = useState([])

    const { user } = useAuth()
    const { data: academicIdentity } = useAcademicIdentity()

    const isLoggedIn = !!user
    const hasAcademicIdentity = !!academicIdentity


    // Close on route change
    useEffect(() => {
        setIsOpen(false)
        setIsPinned(false)
    }, [location.pathname])


    // Auto close when mouse leaves (if not pinned)
    const handleMouseLeave = () => {
        if (!isPinned && isDesktop) {
            setIsOpen(false)
        }
    }

    const togglePin = () => {
        const isDesktop = window.innerWidth >= 1024

        if (!isDesktop) {
            setIsOpen(false)
            setIsPinned(false)
            return
        }

        if (isPinned) {
            setIsPinned(false)
            setIsOpen(false)
        } else {
            setIsPinned(true)
            setIsOpen(true)
        }
    }

    useEffect(() => {
        const activeSection = dashboardSidebarSections.find((section) =>
            section.children.some((child) =>
                location.pathname.startsWith(child.path)
            )
        )

        if (activeSection) {
            setOpenSections((prev) =>
                prev.includes(activeSection.id)
                    ? prev
                    : [...prev, activeSection.id]
            )
        }
    }, [location.pathname])

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


                className="fixed top-0 left-0 bottom-0 z-60 w-[280px] origin-left"
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
                    <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">

                        {/* HOME LINK */}
                        <Link
                            to={homeRootLink.path}
                            className={`
    group flex items-center gap-3
    px-3 py-2.5 rounded-xl
    text-sm font-medium
    transition-all duration-200
    ${location.pathname === "/"
                                    ? "bg-indigo-500/20 text-indigo-500"
                                    : "text-slate-800 dark:text-white hover:bg-white/40 dark:hover:bg-white/10"
                                }
  `}
                        >
                            <homeRootLink.icon size={18} />
                            {homeRootLink.label}
                        </Link>

                        {/* ROOT DASHBOARD LINK */}
                        {isLoggedIn && (
                            <Link
                                to={dashboardRootLink.path}
                                className={`
      group flex items-center gap-3
      px-3 py-2.5 rounded-xl
      text-sm font-medium
      transition-all duration-200
      ${location.pathname === "/dashboard"
                                        ? "bg-indigo-500/20 text-indigo-500"
                                        : "text-slate-800 dark:text-white hover:bg-white/40 dark:hover:bg-white/10"
                                    }
    `}
                            >
                                <dashboardRootLink.icon size={18} />
                                {dashboardRootLink.label}
                            </Link>
                        )}
                        {/* FORUM LINK */}
                        <Link
                            to={forumRootLink.path}
                            className={`
    group flex items-center gap-3
    px-3 py-2.5 rounded-xl
    text-sm font-medium
    transition-all duration-200
    ${location.pathname.startsWith("/forum")
                                    ? "bg-indigo-500/20 text-indigo-500"
                                    : "text-slate-800 dark:text-white hover:bg-white/40 dark:hover:bg-white/10"
                                }
  `}
                        >
                            <forumRootLink.icon size={18} />
                            {forumRootLink.label}
                        </Link>

                        {/* Divider */}
                        <div className="h-px bg-white/10 my-2" />

                        {/* SECTIONS */}
                        {isLoggedIn && dashboardSidebarSections.map((section) => {
                            const isExpanded = openSections.includes(section.id)

                            return (
                                <div key={section.id} className="space-y-1">

                                    {/* Section Header */}
                                    <button
                                        onClick={() =>
                                            setOpenSections((prev) =>
                                                prev.includes(section.id)
                                                    ? prev.filter((id) => id !== section.id)
                                                    : [...prev, section.id]
                                            )
                                        }
                                        className="
                                        hover:bg-white/30 dark:hover:bg-white/5 rounded-lg
            group w-full flex items-center justify-between
            px-3 py-2
            text-xs font-semibold tracking-wide uppercase
            text-slate-500 dark:text-slate-400
            hover:text-slate-800 dark:hover:text-white
            transition-colors
          "
                                    >
                                        <div className="flex items-center gap-2">
                                            <section.icon size={14} />
                                            {section.label}
                                        </div>

                                        <motion.div
                                            animate={{ rotate: isExpanded ? 180 : 0 }}
                                            transition={{ duration: 0.25 }}
                                        >
                                            <ChevronDown size={14} />
                                        </motion.div>
                                    </button>

                                    {/* Dropdown */}
                                    <AnimatePresence initial={false}>
                                        {isExpanded && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.25 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-2 ml-3 border-l border-white/10 pl-3 space-y-1
">
                                                    {section.children.map((item) => {
                                                        const active = location.pathname.startsWith(item.path)

                                                        return (
                                                            <Link
                                                                key={item.id}
                                                                to={item.path}
                                                                className={`
                                                                   group relative flex items-center gap-3
                                                                   px-3 py-2 rounded-lg text-sm
                                                                   transition-all duration-200
                                                                   ${active
                                                                        ? "bg-indigo-500/20 text-indigo-500"
                                                                        : ":text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5"
                                                                    }
                      `}
                                                            >
                                                                <item.icon size={16} />
                                                                {item.label}

                                                                {active && (
                                                                    <motion.div
                                                                        layoutId="active-indicator"
                                                                        className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 rounded-r"
                                                                    />
                                                                )}
                                                            </Link>
                                                        )
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )
                        })}
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

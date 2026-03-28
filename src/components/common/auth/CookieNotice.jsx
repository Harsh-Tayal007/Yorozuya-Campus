// src/components/common/CookieNotice.jsx

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Cookie } from "lucide-react"
import { Link } from "react-router-dom"

const COOKIE_KEY = "unizuya_cookie_notice_dismissed"

const CookieNotice = () => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Small delay so it doesn't flash on load
        const timer = setTimeout(() => {
            const dismissed = localStorage.getItem(COOKIE_KEY)
            if (!dismissed) setVisible(true)
        }, 1500)
        return () => clearTimeout(timer)
    }, [])

    const dismiss = () => {
        localStorage.setItem(COOKIE_KEY, "1")
        setVisible(false)
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, y: 80 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 80 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="
            fixed bottom-4 left-1/2 -translate-x-1/2 z-[99990]
            w-[calc(100%-2rem)] max-w-lg
            flex items-center gap-3 px-4 py-3 rounded-2xl
            bg-white/90 dark:bg-[#0f1b2e]/90
            backdrop-blur-xl
            border border-slate-200/80 dark:border-white/[0.07]
            shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]
          "
                >
                    {/* Icon */}
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10
                          flex items-center justify-center">
                        <Cookie size={15} className="text-blue-600 dark:text-blue-400" />
                    </div>

                    {/* Text */}
                    <p className="flex-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        We use cookies and local storage for login sessions, preferences, and app features. No tracking or ads.{" "}
                        <Link to="/privacy" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                            Privacy Policy
                        </Link>
                    </p>

                    {/* Got it button */}
                    <button
                        onClick={dismiss}
                        className="
              shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-slate-900 dark:bg-white
              text-white dark:text-slate-900
              hover:opacity-80 transition-opacity duration-150
            "
                    >
                        Got it
                    </button>

                    {/* Close */}
                    <button
                        onClick={dismiss}
                        className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600
                       dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10
                       transition-colors duration-150"
                    >
                        <X size={14} />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    )
}

export default CookieNotice
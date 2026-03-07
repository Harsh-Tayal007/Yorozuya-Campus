import { Moon, Sun } from "lucide-react"
import React, { useState } from "react"
import { motion } from "framer-motion"

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )

  const applyTheme = (dark) => {
    document.documentElement.classList.toggle("dark", dark)
    localStorage.setItem("theme", dark ? "dark" : "light")
    setIsDark(dark)
  }

  const toggleTheme = () => {
    const next = !isDark

    // View Transition API delegates the visual switch to the compositor (GPU).
    // The browser takes a screenshot of the current state, applies the class
    // change, then cross-fades between them off the main thread.
    // No style recalculation lag regardless of how many elements are on screen.
    if (document.startViewTransition) {
      document.startViewTransition(() => applyTheme(next))
    } else {
      // Graceful fallback for browsers that don't support it yet
      applyTheme(next)
    }
  }

  return (
    <motion.button
      onClick={toggleTheme}
      whileTap={{ scale: 0.96 }}
      aria-label="Toggle theme"
      className="relative h-9 w-16 rounded-full p-1 shadow-sm
                 bg-white/70 dark:bg-white/5
                 hover:bg-white/90 dark:hover:bg-white/10
                 transition-colors duration-200 will-change-transform"
    >
      <motion.div
        animate={{ x: isDark ? 28 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="relative h-7 w-7 rounded-full flex items-center justify-center
                   shadow-md bg-white dark:bg-slate-900 will-change-transform"
      >
        {isDark
          ? <Moon className="h-4 w-4 text-blue-400" />
          : <Sun  className="h-4 w-4 text-yellow-500" />
        }
      </motion.div>
    </motion.button>
  )
}

export default React.memo(DarkModeToggle)
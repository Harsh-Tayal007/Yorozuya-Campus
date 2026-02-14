import { Moon, Sun } from "lucide-react"
import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme")
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

    const shouldBeDark =
      storedTheme === "dark" || (!storedTheme && prefersDark)

    document.documentElement.classList.toggle("dark", shouldBeDark)
    setIsDark(shouldBeDark)
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = !isDark
    document.documentElement.classList.toggle("dark", newTheme)
    localStorage.setItem("theme", newTheme ? "dark" : "light")
    setIsDark(newTheme)
  }

  if (!mounted) return null

  return (
    <motion.button
  onClick={toggleTheme}
  whileHover={{ scale: 1.04 }}
  whileTap={{ scale: 0.96 }}
  transition={{ duration: 0.2 }}
  aria-label="Toggle theme"
  className="
    relative h-9 w-16 rounded-full p-1
    bg-white/70 dark:bg-white/5
    hover:bg-white/90 dark:hover:bg-white/10
    transition-all duration-200
    shadow-sm
  "
>



      {/* Moving Thumb */}
      <motion.div
  animate={{ x: isDark ? 28 : 0 }}
  transition={{ type: "spring", stiffness: 500, damping: 30 }}
  className="
    absolute top-1 h-7 w-7 rounded-full
    flex items-center justify-center
    shadow-lg
    bg-white dark:bg-slate-900
  "
>
  {isDark ? (
    <Moon className="h-4 w-4 text-blue-400" />
  ) : (
    <Sun className="h-4 w-4 text-yellow-500" />
  )}
</motion.div>



      {/* Soft Glow When Dark */}
      {isDark && (
        <div className="absolute inset-0 rounded-full bg-blue-500/0 hover:bg-blue-500/10 pointer-events-none" />

      )}
    </motion.button>
  )
}

export default React.memo(DarkModeToggle)


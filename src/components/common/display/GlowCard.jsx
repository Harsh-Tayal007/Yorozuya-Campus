// src/components/common/display/GlowCard.jsx
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import GlareHover from "@/components/ui/glare-hover"

const GlowCard = ({ children, className = "", onClick, ...props }) => {
  const [glareEnabled, setGlareEnabled] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  useEffect(() => {
    setGlareEnabled(localStorage.getItem("pref_glare_hover") === "1")
  }, [])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`)
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`)
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={cn(
        `group relative overflow-hidden rounded-2xl
         border border-border/60 bg-card/60 backdrop-blur-sm
         transition-all duration-300
         hover:border-border hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-xl
         before:absolute before:inset-0 before:rounded-[inherit]
         before:opacity-0 hover:before:opacity-100
         before:transition-opacity before:duration-300 before:pointer-events-none
         before:bg-[radial-gradient(500px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(139,92,246,0.08),transparent_50%)]`,
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      {...props}
    >
      <GlareHover enabled={glareEnabled} active={isHovered} glareOpacity={0.1} />
      {/* Accent top line */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-70
                      transition-opacity duration-300 pointer-events-none z-10"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)" }} />
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}


export default GlowCard
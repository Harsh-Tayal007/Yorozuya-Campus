// src/components/common/display/GlowCard.jsx
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import GlareHover from "@/components/ui/glare-hover"

const GlowCard = ({ children, className = "", onClick, spotlightColor = "rgba(139, 92, 246, 0.12)", disableGlare = false, ...props }) => {
  const [glareEnabled, setGlareEnabled] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)
  
  useEffect(() => {
    setGlareEnabled(localStorage.getItem("pref_glare_hover") === "1")
  }, [])

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      onClick={onClick}
      className={cn(
        `group relative overflow-hidden rounded-2xl
         border border-border/60 bg-card/60 backdrop-blur-sm
         transition-all duration-300
         hover:border-border hover:bg-card/80 hover:-translate-y-0.5 hover:shadow-xl`,
        onClick && "cursor-pointer active:scale-[0.98]",
        className
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`
        }}
      />
      <GlareHover enabled={glareEnabled && !disableGlare} active={opacity > 0} glareOpacity={0.1} />
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
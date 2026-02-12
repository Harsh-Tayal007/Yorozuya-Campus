import React from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const GlowCard = ({ children, className = "", ...props }) => {
  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    e.currentTarget.style.setProperty("--mouse-x", `${x}px`)
    e.currentTarget.style.setProperty("--mouse-y", `${y}px`)
  }

  return (
    <Card
      onMouseMove={handleMouseMove}
      className={cn(
        `
        relative
        overflow-hidden
        transition-colors duration-300
        hover:ring-1 hover:ring-primary/40

        before:absolute
        before:inset-0
        before:rounded-[inherit]
        before:opacity-0
        hover:before:opacity-100
        before:transition-opacity before:duration-300
        before:pointer-events-none

        before:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.12),transparent_40%)]
        dark:before:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.08),transparent_40%)]
        `,
        className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}

export default GlowCard

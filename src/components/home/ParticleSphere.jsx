// src/components/home/ParticleSphere.jsx
// -------------------------------------------------------
// Canvas-based scattered confetti/particle background.
// Particles drift freely across the full viewport.
// On cursor move, nearby particles gently repel away.
// Each particle is a small rounded rectangle (bar/dash)
// at a random angle — like the Antigravity auth page.
// -------------------------------------------------------
import { useEffect, useRef, useCallback } from "react"

// -- Colour palette --
const PALETTE = [
  [59, 130, 246],   // blue-500
  [99, 102, 241],   // indigo-500
  [139, 92, 246],   // violet-500
  [167, 139, 250],  // violet-400
  [129, 140, 248],  // indigo-400
  [96, 165, 250],   // blue-400
  [192, 132, 252],  // purple-400
  [124, 58, 237],   // violet-600
  [79, 70, 229],    // indigo-600
  [37, 99, 235],    // blue-600
]

// Config
const PARTICLE_COUNT    = 140       // total particles across viewport
const CURSOR_RADIUS     = 160       // cursor influence radius (px)
const CURSOR_FORCE      = 2.8       // repulsion strength
const FRICTION          = 0.96      // velocity damping per frame
const DRIFT_SPEED_MAX   = 0.35      // max ambient drift speed
const PARTICLE_MIN_LEN  = 4         // min dash length
const PARTICLE_MAX_LEN  = 12        // max dash length
const PARTICLE_WIDTH    = 2.5       // dash thickness
const ROTATION_SPEED    = 0.008     // how fast particles spin

function createParticles(w, h) {
  const particles = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const [r, g, b] = PALETTE[i % PALETTE.length]
    const angle = Math.random() * Math.PI * 2
    const driftSpeed = 0.1 + Math.random() * DRIFT_SPEED_MAX

    particles.push({
      // position — scattered across full viewport
      x: Math.random() * w,
      y: Math.random() * h,
      // velocity (ambient drift)
      vx: Math.cos(angle) * driftSpeed,
      vy: Math.sin(angle) * driftSpeed,
      // visual
      len: PARTICLE_MIN_LEN + Math.random() * (PARTICLE_MAX_LEN - PARTICLE_MIN_LEN),
      rot: Math.random() * Math.PI * 2,            // rotation angle
      rotSpeed: (Math.random() - 0.5) * ROTATION_SPEED, // spin speed
      cr: r, cg: g, cb: b,
      alpha: 0.35 + Math.random() * 0.4,           // 0.35 .. 0.75
    })
  }
  return particles
}

export default function ParticleSphere() {
  const canvasRef    = useRef(null)
  const mouseRef     = useRef({ x: -9999, y: -9999 })
  const particlesRef = useRef(null)
  const rafRef       = useRef(null)
  const sizeRef      = useRef({ w: 0, h: 0 })

  const handleMouseMove = useCallback((e) => {
    mouseRef.current.x = e.clientX
    mouseRef.current.y = e.clientY
  }, [])

  const handleMouseLeave = useCallback(() => {
    mouseRef.current.x = -9999
    mouseRef.current.y = -9999
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", { alpha: true })
    if (!ctx) return

    // Resize handler
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      canvas.style.width  = w + "px"
      canvas.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { w, h }

      // Re-scatter particles if not yet created or viewport changed dramatically
      if (!particlesRef.current) {
        particlesRef.current = createParticles(w, h)
      }
    }
    resize()
    window.addEventListener("resize", resize)

    // Main render loop
    const animate = () => {
      const { w, h } = sizeRef.current
      const mouse = mouseRef.current
      const particles = particlesRef.current
      if (!particles) { rafRef.current = requestAnimationFrame(animate); return }

      ctx.clearRect(0, 0, w, h)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // --- Cursor repulsion ---
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const distSq = dx * dx + dy * dy
        const radius = CURSOR_RADIUS

        if (distSq < radius * radius && distSq > 0.01) {
          const dist = Math.sqrt(distSq)
          const force = (1 - dist / radius) * CURSOR_FORCE
          p.vx += (dx / dist) * force
          p.vy += (dy / dist) * force
        }

        // --- Apply velocity with friction ---
        p.vx *= FRICTION
        p.vy *= FRICTION

        // Restore gentle drift when velocity is very low
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed < 0.15) {
          // nudge with very gentle drift to keep things alive
          p.vx += (Math.random() - 0.5) * 0.04
          p.vy += (Math.random() - 0.5) * 0.04
        }

        p.x += p.vx
        p.y += p.vy

        // --- Wrap around edges ---
        const margin = 20
        if (p.x < -margin) p.x = w + margin
        if (p.x > w + margin) p.x = -margin
        if (p.y < -margin) p.y = h + margin
        if (p.y > h + margin) p.y = -margin

        // --- Spin ---
        p.rot += p.rotSpeed

        // --- Draw rounded bar / dash ---
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.beginPath()
        ctx.roundRect(-p.len / 2, -PARTICLE_WIDTH / 2, p.len, PARTICLE_WIDTH, PARTICLE_WIDTH / 2)
        ctx.fillStyle = `rgba(${p.cr},${p.cg},${p.cb},${p.alpha})`
        ctx.fill()
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    // Events
    window.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [handleMouseMove, handleMouseLeave])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1, contain: "strict" }}
    />
  )
}

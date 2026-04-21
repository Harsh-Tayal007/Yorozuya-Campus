// src/components/home/AntigravityShapes.jsx
// -------------------------------------------------------
// Canvas-based antigravity floating shapes background.
// Mixed circles, squares, and triangles with depth shadows,
// gentle antigravity drift, and cursor repulsion physics.
// Adapted from the Google Antigravity auth-success page.
// -------------------------------------------------------
import { useEffect, useRef, useCallback } from "react"

// -- Colour palette (Google-inspired + site theme accents) --
const COLORS = [
  "#EA4335", // red
  "#FBBC05", // yellow
  "#34A853", // green
  "#4285F4", // blue
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#E8F0FE", // light blue tint
  "#DADCE0", // grey tint
]

// Config
const PARTICLE_COUNT   = 45
const SPEED_FACTOR     = 0.8
const GRAVITY          = -0.05     // negative = antigravity (floats up)
const INTERACTION_RAD  = 150       // cursor influence radius
const FRICTION         = 0.96
const SPRITE_SIZE      = 64        // offscreen sprite canvas size
const DRAW_SIZE        = 30        // shape size inside sprite

// -- Sprite cache: pre-render shapes to offscreen canvases for GPU perf --
const spriteCache = {}

function getSprite(color, shapeType) {
  const key = `${color}-${shapeType}`
  if (spriteCache[key]) return spriteCache[key]

  const c = document.createElement("canvas")
  c.width = SPRITE_SIZE
  c.height = SPRITE_SIZE
  const cx = c.getContext("2d")
  const center = SPRITE_SIZE / 2

  // Baked shadow for depth
  cx.shadowColor = "rgba(0,0,0,0.08)"
  cx.shadowBlur = 15
  cx.shadowOffsetX = 5
  cx.shadowOffsetY = 5
  cx.fillStyle = color
  cx.translate(center, center)

  cx.beginPath()
  if (shapeType === 0) {
    // Circle
    cx.arc(0, 0, DRAW_SIZE / 2, 0, Math.PI * 2)
  } else if (shapeType === 1) {
    // Square
    cx.rect(-DRAW_SIZE / 2, -DRAW_SIZE / 2, DRAW_SIZE, DRAW_SIZE)
  } else {
    // Triangle
    cx.moveTo(0, -DRAW_SIZE / 2)
    cx.lineTo(DRAW_SIZE / 2, DRAW_SIZE / 2)
    cx.lineTo(-DRAW_SIZE / 2, DRAW_SIZE / 2)
    cx.closePath()
  }
  cx.fill()

  spriteCache[key] = c
  return c
}

function createParticle(w, h, randomY = true) {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const shapeType = Math.floor(Math.random() * 3) // 0=circle, 1=square, 2=triangle

  const x = Math.random() * w
  const y = randomY ? Math.random() * h : h + 50

  const vx = (Math.random() - 0.5) * 2 * SPEED_FACTOR
  let vy = (Math.random() - 0.5) * 2 * SPEED_FACTOR
  // Add upward bias for antigravity feel
  vy -= Math.random() * 1 * Math.abs(GRAVITY)

  return {
    x,
    y,
    vx,
    vy,
    visualSize: Math.random() * 15 + 5,
    color,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.05,
    type: shapeType,
    sprite: getSprite(color, shapeType),
    depth: Math.random() * 1 + 0.5, // 0.5 .. 1.5, parallax factor
  }
}

export default function AntigravityShapes() {
  const canvasRef    = useRef(null)
  const mouseRef     = useRef({ x: -1000, y: -1000 })
  const particlesRef = useRef(null)
  const rafRef       = useRef(null)
  const sizeRef      = useRef({ w: 0, h: 0 })

  const handleMouseMove = useCallback((e) => {
    mouseRef.current.x = e.clientX
    mouseRef.current.y = e.clientY
  }, [])

  const handleTouchMove = useCallback((e) => {
    mouseRef.current.x = e.touches[0].clientX
    mouseRef.current.y = e.touches[0].clientY
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d", {
      alpha: true,
      desynchronized: true,
      willReadFrequently: false,
    })
    if (!ctx) return

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + "px"
      canvas.style.height = h + "px"
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = "high"
      sizeRef.current = { w, h }

      if (!particlesRef.current) {
        const arr = []
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          arr.push(createParticle(w, h, true))
        }
        particlesRef.current = arr
      }
    }
    resize()
    window.addEventListener("resize", resize)

    const animate = () => {
      const { w, h } = sizeRef.current
      const { x: mx, y: my } = mouseRef.current
      const particles = particlesRef.current
      if (!particles) { rafRef.current = requestAnimationFrame(animate); return }

      ctx.clearRect(0, 0, w, h)

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Antigravity
        p.vy += GRAVITY * 0.05 * p.depth

        // Movement
        p.x += p.vx * p.depth
        p.y += p.vy * p.depth
        p.rotation += p.rotationSpeed

        // Cursor repulsion
        const dx = p.x - mx
        const dy = p.y - my
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < INTERACTION_RAD && dist > 0.1) {
          const force = (INTERACTION_RAD - dist) / INTERACTION_RAD
          const angle = Math.atan2(dy, dx)
          const push = force * 4
          p.vx += Math.cos(angle) * push
          p.vy += Math.sin(angle) * push
        }

        // Friction
        p.vx *= FRICTION
        p.vy *= FRICTION

        // Wrap horizontally
        if (p.x < -50) p.x = w + 50
        if (p.x > w + 50) p.x = -50

        // Reset when floated off top (antigravity)
        if (p.y < -60) {
          const np = createParticle(w, h, false)
          Object.assign(p, np)
        }

        // Draw using cached sprite (GPU texture)
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)

        const scaleFactor = (p.visualSize * p.depth) / DRAW_SIZE
        const renderSize = SPRITE_SIZE * scaleFactor

        ctx.drawImage(p.sprite, -renderSize / 2, -renderSize / 2, renderSize, renderSize)
        ctx.restore()
      }

      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("touchmove", handleTouchMove)

    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("touchmove", handleTouchMove)
    }
  }, [handleMouseMove, handleTouchMove])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: -1, contain: "strict" }}
    />
  )
}

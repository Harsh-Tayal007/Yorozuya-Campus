// src/components/home/AnimatedBlobs.jsx
// Loaded only after first paint via requestIdleCallback
import { motion } from "framer-motion"

const blobs = [
  {
    style: { width: 600, height: 600, top: "-12%", left: "-10%",
      background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.10) 55%, transparent 80%)",
      filter: "blur(50px)" },
    animate: { x: [0, 35, -10, 0], y: [0, 20, 35, 0], scale: [1, 1.06, 0.97, 1] },
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut" },
  },
  {
    style: { width: 480, height: 480, top: "8%", right: "-8%",
      background: "radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(139,92,246,0.09) 55%, transparent 80%)",
      filter: "blur(45px)" },
    animate: { x: [0, -30, 10, 0], y: [0, 25, -15, 0], scale: [1, 1.08, 1.02, 1] },
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 },
  },
  {
    style: { width: 380, height: 380, top: "30%", left: "-5%",
      background: "radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(99,102,241,0.08) 60%, transparent 80%)",
      filter: "blur(55px)" },
    animate: { x: [0, 20, -8, 0], y: [0, -25, 20, 0], scale: [1, 1.05, 0.98, 1] },
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 },
  },
  {
    style: { width: 420, height: 420, top: "45%", left: "35%",
      background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(59,130,246,0.07) 60%, transparent 80%)",
      filter: "blur(60px)" },
    animate: { x: [0, 25, -20, 0], y: [0, -20, 15, 0], scale: [1, 1.07, 0.96, 1] },
    transition: { duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.5 },
  },
  {
    style: { width: 320, height: 320, top: "55%", right: "-4%",
      background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 60%, transparent 80%)",
      filter: "blur(45px)" },
    animate: { x: [0, -18, 8, 0], y: [0, 22, -12, 0], scale: [1, 1.06, 0.99, 1] },
    transition: { duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 },
  },
  {
    style: { width: 360, height: 360, bottom: "22%", left: "8%",
      background: "radial-gradient(circle, rgba(59,130,246,0.13) 0%, rgba(99,102,241,0.07) 60%, transparent 80%)",
      filter: "blur(50px)" },
    animate: { x: [0, 15, -20, 0], y: [0, -18, 10, 0], scale: [1, 1.04, 0.97, 1] },
    transition: { duration: 8, repeat: Infinity, ease: "easeInOut", delay: 3 },
  },
  {
    style: { width: 300, height: 300, bottom: "10%", right: "5%",
      background: "radial-gradient(circle, rgba(139,92,246,0.13) 0%, rgba(59,130,246,0.07) 60%, transparent 80%)",
      filter: "blur(40px)" },
    animate: { x: [0, -22, 12, 0], y: [0, 18, -25, 0], scale: [1, 1.05, 0.98, 1] },
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2.5 },
  },
  {
    style: { width: 500, height: 260, bottom: "-5%", left: "20%",
      background: "radial-gradient(ellipse, rgba(59,130,246,0.11) 0%, rgba(99,102,241,0.05) 60%, transparent 80%)",
      filter: "blur(55px)" },
    animate: { x: [0, 20, -15, 0], y: [0, -12, 8, 0], scale: [1, 1.04, 0.99, 1] },
    transition: { duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 },
  },
]

export default function AnimatedBlobs() {
  return (
    <>
      <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {blobs.map((blob, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={blob.style}
            animate={blob.animate}
            transition={blob.transition}
          />
        ))}
      </div>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-[-9] pointer-events-none opacity-[0.025] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px 128px",
        }}
      />
    </>
  )
}
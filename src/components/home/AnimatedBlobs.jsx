// src/components/home/AnimatedBlobs.jsx
// Pure CSS blob animations - zero JS / zero main-thread cost.
// Each blob uses a unique @keyframes rule with translate3d + scale
// so the browser composites them entirely on the GPU.

const blobs = [
  {
    style: { width: 600, height: 600, top: "-12%", left: "-10%",
      background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.10) 55%, transparent 80%)",
      filter: "blur(50px)" },
    cls: "animate-blob-0",
  },
  {
    style: { width: 480, height: 480, top: "8%", right: "-8%",
      background: "radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(139,92,246,0.09) 55%, transparent 80%)",
      filter: "blur(45px)" },
    cls: "animate-blob-1",
  },
  {
    style: { width: 380, height: 380, top: "30%", left: "-5%",
      background: "radial-gradient(circle, rgba(59,130,246,0.14) 0%, rgba(99,102,241,0.08) 60%, transparent 80%)",
      filter: "blur(55px)" },
    cls: "animate-blob-2",
  },
  {
    style: { width: 420, height: 420, top: "45%", left: "35%",
      background: "radial-gradient(circle, rgba(139,92,246,0.14) 0%, rgba(59,130,246,0.07) 60%, transparent 80%)",
      filter: "blur(60px)" },
    cls: "animate-blob-3",
  },
  {
    style: { width: 320, height: 320, top: "55%", right: "-4%",
      background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.08) 60%, transparent 80%)",
      filter: "blur(45px)" },
    cls: "animate-blob-4",
  },
  {
    style: { width: 360, height: 360, bottom: "22%", left: "8%",
      background: "radial-gradient(circle, rgba(59,130,246,0.13) 0%, rgba(99,102,241,0.07) 60%, transparent 80%)",
      filter: "blur(50px)" },
    cls: "animate-blob-5",
  },
  {
    style: { width: 300, height: 300, bottom: "10%", right: "5%",
      background: "radial-gradient(circle, rgba(139,92,246,0.13) 0%, rgba(59,130,246,0.07) 60%, transparent 80%)",
      filter: "blur(40px)" },
    cls: "animate-blob-6",
  },
  {
    style: { width: 500, height: 260, bottom: "-5%", left: "20%",
      background: "radial-gradient(ellipse, rgba(59,130,246,0.11) 0%, rgba(99,102,241,0.05) 60%, transparent 80%)",
      filter: "blur(55px)" },
    cls: "animate-blob-7",
  },
]

// Keyframes match the original framer-motion animate arrays exactly.
// translate3d + scale → GPU-composited, zero main-thread cost.
const blobKeyframes = `
@keyframes blob-0 {
  0%,100% { transform: translate3d(0,0,0) scale(1); }
  25%     { transform: translate3d(35px,20px,0) scale(1.06); }
  50%     { transform: translate3d(-10px,35px,0) scale(0.97); }
  75%     { transform: translate3d(0,0,0) scale(1); }
}
@keyframes blob-1 {
  0%,100% { transform: translate3d(0,0,0) scale(1); }
  25%     { transform: translate3d(-30px,25px,0) scale(1.08); }
  50%     { transform: translate3d(10px,-15px,0) scale(1.02); }
  75%     { transform: translate3d(0,0,0) scale(1); }
}
@keyframes blob-2 {
  0%,100% { transform: translate3d(0,0,0) scale(1); }
  25%     { transform: translate3d(20px,-25px,0) scale(1.05); }
  50%     { transform: translate3d(-8px,20px,0) scale(0.98); }
  75%     { transform: translate3d(0,0,0) scale(1); }
}
@keyframes blob-3 {
  0%,100% { transform: translate3d(0,0,0) scale(1); }
  25%     { transform: translate3d(25px,-20px,0) scale(1.07); }
  50%     { transform: translate3d(-20px,15px,0) scale(0.96); }
  75%     { transform: translate3d(0,0,0) scale(1); }
}
@keyframes blob-4 {
  0%,100% { transform: translate3d(0,0,0) scale(1); }
  25%     { transform: translate3d(-18px,22px,0) scale(1.06); }
  50%     { transform: translate3d(8px,-12px,0) scale(0.99); }
  75%     { transform: translate3d(0,0,0) scale(1); }
}
@keyframes blob-5 {
  0%,100% { transform: translate3d(0,0,0) scale(1); }
  25%     { transform: translate3d(15px,-18px,0) scale(1.04); }
  50%     { transform: translate3d(-20px,10px,0) scale(0.97); }
  75%     { transform: translate3d(0,0,0) scale(1); }
}
@keyframes blob-6 {
  0%,100% { transform: translate3d(0,0,0) scale(1); }
  25%     { transform: translate3d(-22px,18px,0) scale(1.05); }
  50%     { transform: translate3d(12px,-25px,0) scale(0.98); }
  75%     { transform: translate3d(0,0,0) scale(1); }
}
@keyframes blob-7 {
  0%,100% { transform: translate3d(0,0,0) scale(1); }
  25%     { transform: translate3d(20px,-12px,0) scale(1.04); }
  50%     { transform: translate3d(-15px,8px,0) scale(0.99); }
  75%     { transform: translate3d(0,0,0) scale(1); }
}
.animate-blob-0 { animation: blob-0 7s ease-in-out infinite; }
.animate-blob-1 { animation: blob-1 8s ease-in-out 1s infinite; }
.animate-blob-2 { animation: blob-2 6s ease-in-out 2s infinite; }
.animate-blob-3 { animation: blob-3 9s ease-in-out 0.5s infinite; }
.animate-blob-4 { animation: blob-4 7s ease-in-out 1.5s infinite; }
.animate-blob-5 { animation: blob-5 8s ease-in-out 3s infinite; }
.animate-blob-6 { animation: blob-6 6s ease-in-out 2.5s infinite; }
.animate-blob-7 { animation: blob-7 9s ease-in-out 1s infinite; }
`

export default function AnimatedBlobs() {
  return (
    <>
      <style>{blobKeyframes}</style>
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        style={{ contain: "strict" }}
      >
        {blobs.map((blob, i) => (
          <div
            key={i}
            className={`absolute rounded-full will-change-transform ${blob.cls}`}
            style={blob.style}
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
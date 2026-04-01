import { useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { reportBrokenLink } from "@/services/moderation/reportService"
import { useAuth } from "@/context/AuthContext"

const TOTAL_SECONDS = 10

const NotFound = () => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [seconds, setSeconds] = useState(TOTAL_SECONDS)
  const [paused, setPaused] = useState(false)
  const [reported, setReported] = useState(false)

  const radius = 60
  const stroke = 6
  const normalizedRadius = radius - stroke * 0.5
  const circumference = normalizedRadius * 2 * Math.PI
  const [progress, setProgress] = useState(0)
  const strokeDashoffset = circumference * (1 - progress)

  useEffect(() => {
    let animationFrame
    let startTime
    let elapsedBeforePause = progress * TOTAL_SECONDS * 1000

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime + elapsedBeforePause
      const newProgress = Math.min(elapsed / (TOTAL_SECONDS * 1000), 1)
      setProgress(newProgress)
      setSeconds(Math.ceil(TOTAL_SECONDS * (1 - newProgress)))
      if (newProgress < 1 && !paused) {
        animationFrame = requestAnimationFrame(animate)
      } else if (newProgress >= 1) {
        navigate("/", { replace: true })
      }
    }

    if (!paused) animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [paused])

  const cancelRedirect = () => setPaused(true)

  const handleReportBrokenLink = async () => {
    cancelRedirect()
    if (reported) return

    try {
      await reportBrokenLink({
        url: window.location.href,
        reporterId:       currentUser?.$id       ?? "anonymous",
        reporterUsername: currentUser?.username   ?? "anonymous",
      })
      setReported(true)
      toast("Thanks for reporting!", { description: "Our team will look into this broken link." })
    } catch {
      toast.error("Failed to send report. Please try again.")
    }
  }

  return (
    <div className="
      min-h-screen flex items-center justify-center px-4
      bg-gradient-to-br
      from-slate-100 via-white to-slate-200
      dark:from-[#0b1220] dark:via-[#0f1b2e] dark:to-[#0b1220]
    ">
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="
          w-full max-w-md text-center p-8 rounded-2xl
          bg-white/80 dark:bg-white/5
          backdrop-blur-xl
          border border-slate-200 dark:border-white/10
          shadow-xl dark:shadow-2xl dark:shadow-black/40
        "
      >
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-500/10">
            <SearchX className="text-blue-600 dark:text-blue-400" size={36} />
          </div>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <svg height={radius * 2} width={radius * 2}>
            <circle stroke="rgba(148,163,184,0.2)" fill="transparent" strokeWidth={stroke}
              r={normalizedRadius} cx={radius} cy={radius} />
            <circle stroke="url(#gradient)" fill="transparent" strokeWidth={stroke}
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              r={normalizedRadius} cx={radius} cy={radius}
              style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }} />
            <defs>
              <linearGradient id="gradient">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#6366f1" />
              </linearGradient>
            </defs>
          </svg>
          <h1 className="absolute text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            404
          </h1>
        </div>

        <p className="text-lg font-semibold mb-2">Page Not Found</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Looks like this page got lost in the syllabus.
        </p>

        {!paused && seconds > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Redirecting to homepage in {seconds}s...
          </p>
        )}
        {paused && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-4">
            Redirect paused
          </p>
        )}

        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={() => { cancelRedirect(); navigate(-1) }} className="w-full">
            Go Back
          </Button>
          <Button onClick={() => { cancelRedirect(); navigate("/", { replace: true }) }} className="w-full">
            Go to Homepage Now
          </Button>
          <button
            onClick={handleReportBrokenLink}
            disabled={reported}
            className="text-xs text-slate-500 dark:text-slate-400 hover:underline mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {reported ? "✓ Reported" : "Report broken link"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
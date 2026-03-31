// src/components/common/navigation/WhatsNewBadge.jsx
// No visual changes needed — already matches your navbar glass style.
// Only path fix if you moved the service.
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Megaphone } from "lucide-react"
import { updateLogsService } from "@/services/updates/updateLogsService"

const LS_KEY = "unizuya_last_seen_update"

export default function WhatsNewBadge() {
  const [hasNew, setHasNew] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    updateLogsService.list(true).then(res => {
      const latest = res.documents?.[0]
      if (!latest) return
      const lastSeen = localStorage.getItem(LS_KEY)
      if (!lastSeen || new Date(latest.publishedAt) > new Date(lastSeen)) {
        setHasNew(true)
      }
    }).catch(() => {})
  }, [])

  const handleClick = () => {
    localStorage.setItem(LS_KEY, new Date().toISOString())
    setHasNew(false)
    navigate("/updates")
  }

  return (
    <button
      onClick={handleClick}
      title="What's New"
      className="relative flex items-center justify-center w-9 h-9 rounded-full
                 bg-white/60 dark:bg-white/5
                 hover:bg-white/80 dark:hover:bg-white/10
                 border border-white/20 dark:border-white/5
                 transition-colors duration-150"
    >
      <Megaphone size={15} className={hasNew ? "text-primary" : "text-foreground/70"} />
      {hasNew && (
        <>
          <span className="absolute inset-0 rounded-full ring-2 ring-primary/30 pointer-events-none" />
          <span className="absolute -top-1 -right-1 w-[9px] h-[9px] rounded-full
                           bg-red-500 border-2 border-background shadow-sm" />
        </>
      )}
    </button>
  )
}
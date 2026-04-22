// src/components/common/ShareButton.jsx
import { Share2 } from "lucide-react"
import { copyShareLink } from "@/utils/share"

/**
 * Small icon-only share button that matches the View/Download button style.
 *
 * Props:
 *   path {string}  - the public path to share, e.g. "/programs/.../syllabus/semester/4"
 *   className {string} - optional extra classes
 */
export default function ShareButton({ path, className = "" }) {
  return (
    <button
      onClick={() => copyShareLink(path)}
      title="Copy share link"
      aria-label="Copy share link"
      className={[
        "flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium",
        "border border-border/60 bg-muted/30 text-muted-foreground",
        "hover:border-border hover:text-foreground hover:bg-muted/60",
        "transition-all active:scale-95 shrink-0 cursor-target",
        className,
      ].join(" ")}
    >
      <Share2 size={11} />
      <span>Share</span>
    </button>
  )
}
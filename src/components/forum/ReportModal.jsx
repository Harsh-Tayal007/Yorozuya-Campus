// src/components/forum/ReportModal.jsx
import { useState } from "react"
import { X, Flag, Loader2 } from "lucide-react"
import { createReport, REPORT_REASONS } from "@/services/moderation/reportService"
import { useAuth } from "@/context/AuthContext"

export default function ReportModal({ isOpen, onClose, target }) {
  /*
   * target = {
   *   targetType: 'reply' | 'thread' | 'user',
   *   targetId,
   *   targetAuthorId,
   *   targetAuthorUsername,
   *   contentPreview,   // first 200 chars of content
   *   threadId,         // if reply
   * }
   */
  const { currentUser } = useAuth()
  const [reason,  setReason]  = useState("")
  const [details, setDetails] = useState("")
  const [loading, setLoading] = useState(false)
  const [done,    setDone]    = useState(false)
  const [error,   setError]   = useState("")

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (!reason) { setError("Please select a reason."); return }
    setLoading(true)
    setError("")
    try {
      await createReport({
        reporterId:           currentUser.$id,
        reporterUsername:     currentUser.username,
        targetType:           target.targetType,
        targetId:             target.targetId,
        targetAuthorId:       target.targetAuthorId,
        targetAuthorUsername: target.targetAuthorUsername,
        reason,
        details:              details.trim() || null,
        contentPreview:       target.contentPreview ?? null,
        threadId:             target.threadId ?? null,
      })
      setDone(true)
    } catch (e) {
      setError(e.message || "Failed to submit report.")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setReason(""); setDetails(""); setDone(false); setError(""); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-background border border-border shadow-2xl p-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flag size={16} className="text-red-500" />
            <span className="font-semibold text-foreground text-sm">Report Content</span>
          </div>
          <button onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition p-1 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-green-500/15 border border-green-500/30
                            flex items-center justify-center mx-auto mb-3">
              <Flag size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <p className="text-green-600 dark:text-green-400 font-semibold">Report submitted</p>
            <p className="text-muted-foreground text-sm">
              Our moderation team will review it shortly.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90
                         text-primary-foreground text-sm transition"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Reason chips */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">
                Select a reason
              </p>
              <div className="flex flex-wrap gap-2">
                {REPORT_REASONS.map(r => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                      reason === r
                        ? "bg-red-500/15 border-red-500/50 text-red-600 dark:text-red-400"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional details */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wide">
                Additional details (optional)
              </p>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                placeholder="Any extra context for moderators..."
                maxLength={400}
                rows={3}
                className="w-full rounded-lg bg-muted border border-border px-3 py-2 text-sm
                           text-foreground placeholder:text-muted-foreground/60 resize-none
                           focus:outline-none focus:border-primary/50 transition"
              />
            </div>

            {/* Content preview */}
            {target?.contentPreview && (
              <div className="rounded-lg bg-muted border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground/70 mb-1">Reported content preview</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{target.contentPreview}</p>
              </div>
            )}

            {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleClose}
                className="flex-1 py-2 rounded-lg border border-border text-muted-foreground
                           hover:text-foreground hover:bg-muted text-sm transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !reason}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50
                           text-white text-sm font-medium transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Submit Report
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
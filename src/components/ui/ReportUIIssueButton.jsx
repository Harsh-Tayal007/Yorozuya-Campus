// src/components/ui/ReportUIIssueButton.jsx
// Subtle report button shown at the bottom of the Customization tab.
// Opens a compact modal so users can flag animation/UI issues to admins.

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext"
import { createUIComplaintReport } from "@/services/moderation/reportService"

const AFFECTED_PAGES = [
  { value: "Homepage",    label: "Homepage" },
  { value: "Dashboard",   label: "Dashboard" },
  { value: "All pages",   label: "All pages" },
  { value: "Other",       label: "Other" },
]

export default function ReportUIIssueButton() {
  const { currentUser } = useAuth()
  const [open,        setOpen]        = useState(false)
  const [description, setDescription] = useState("")
  const [page,        setPage]        = useState("Homepage")
  const [submitting,  setSubmitting]  = useState(false)

  const handleOpen  = () => setOpen(true)
  const handleClose = () => { setOpen(false); setDescription(""); setPage("Homepage") }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!description.trim()) { toast.error("Please describe the issue"); return }
    if (!currentUser) { toast.error("You must be logged in to submit a report"); return }

    try {
      setSubmitting(true)
      await createUIComplaintReport({
        reporterId:       currentUser.$id,
        reporterUsername: currentUser.username,
        description:      description.trim(),
        affectedPage:     page,
      })
      toast.success("Thanks! Our team will review this.", {
        description: "We'll look into the UI issue you reported.",
      })
      handleClose()
    } catch (err) {
      toast.error(err?.message ?? "Failed to submit report. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60
                   hover:text-muted-foreground transition-colors duration-150 cursor-target"
      >
        <AlertTriangle size={10} />
        Having issues with animations? Report it
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center
                       bg-black/60 backdrop-blur-sm px-4"
            onClick={e => { if (e.target === e.currentTarget) handleClose() }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="w-full max-w-md rounded-2xl bg-background border border-border
                         shadow-2xl p-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25
                                  flex items-center justify-center">
                    <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Report UI Issue</h2>
                    <p className="text-[11px] text-muted-foreground">Help us improve the experience</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                             hover:bg-muted transition-colors cursor-target"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Describe the issue <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="e.g. The dot field causes the page to lag on scroll..."
                    maxLength={400}
                    rows={3}
                    className="w-full rounded-xl border border-border bg-muted/30 px-3.5 py-2.5
                               text-sm text-foreground placeholder:text-muted-foreground/50
                               focus:outline-none focus:ring-2 focus:ring-primary/30
                               focus:border-primary hover:border-primary/40
                               transition-all duration-150 resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground/50 text-right">
                    {description.length}/400
                  </p>
                </div>

                {/* Affected page */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Which page?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {AFFECTED_PAGES.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPage(p.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                                    ${page === p.value
                                      ? "bg-primary/10 border-primary/40 text-primary"
                                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                                    }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm
                               text-muted-foreground hover:text-foreground hover:bg-muted
                               transition-colors cursor-target"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={submitting || !description.trim()}
                    whileHover={{ scale: (submitting || !description.trim()) ? 1 : 1.01 }}
                    whileTap={{ scale: (submitting || !description.trim()) ? 1 : 0.98 }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                               bg-primary text-primary-foreground text-sm font-semibold
                               disabled:opacity-40 disabled:cursor-not-allowed
                               hover:bg-primary/90 transition-colors cursor-target"
                  >
                    {submitting
                      ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
                      : <><Send size={13} /> Submit Report</>
                    }
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Loader2, X, Trash2, ShieldAlert } from "lucide-react"

const CONFIRM_PHRASE = "delete my account"

const BulletRow = ({ label, deleted }) => (
  <div className="flex items-start gap-2.5 py-1.5">
    <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold
      ${deleted
        ? "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
        : "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400"}`}>
      {deleted ? "✕" : "✓"}
    </span>
    <span className={`text-sm ${deleted ? "text-foreground" : "text-muted-foreground"}`}>
      {label}
    </span>
  </div>
)

/**
 * DeleteAccountModal
 *
 * @param {boolean}  open
 * @param {Function} onClose
 * @param {Function} onConfirm  - async, called when user confirms; should throw on error
 */
const DeleteAccountModal = ({ open, onClose, onConfirm }) => {
  const [phrase, setPhrase]     = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const phraseMatch = phrase.trim().toLowerCase() === CONFIRM_PHRASE
  const canSubmit   = phraseMatch && !loading

  const handleConfirm = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err) {
      setError(err?.message ?? "Something went wrong. Please try again.")
      setLoading(false)
    }
    // On success the parent navigates away - no need to reset
  }

  const handleClose = () => {
    if (loading) return
    setPhrase("")
    setError(null)
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{ opacity: 0,  scale: 0.95, y: 16  }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="fixed inset-0 z-[301] flex items-center justify-center p-4"
            // Stop click-through to backdrop
            onClick={e => e.stopPropagation()}
          >
            <div className="relative w-full max-w-md rounded-2xl border border-border
                            bg-background shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4
                              border-b border-border/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center
                                  rounded-full bg-red-100 dark:bg-red-500/15">
                    <ShieldAlert size={18} className="text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground leading-tight">
                      Delete account permanently
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-lg p-1 text-muted-foreground hover:text-foreground
                             hover:bg-muted transition-colors disabled:opacity-40"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4">

                {/* What gets deleted */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider
                                text-muted-foreground mb-2">
                    What will be deleted
                  </p>
                  <div className="rounded-xl border border-red-200/60 dark:border-red-500/20
                                  bg-red-50/50 dark:bg-red-500/5 px-3.5 py-1">
                    <BulletRow deleted label="Your profile, avatar, and bio" />
                    <BulletRow deleted label="All forum threads you created" />
                    <BulletRow deleted label="Your reply content and attached images" />
                    <BulletRow deleted label="Bookmarks, votes, and follows" />
                    <BulletRow deleted label="Notifications and push subscriptions" />
                    <BulletRow deleted label="Tasks, timetables, and CGPA records" />
                    <BulletRow deleted label="Account credentials and sessions" />
                  </div>
                </div>

                {/* What is kept */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider
                                text-muted-foreground mb-2">
                    What will be kept
                  </p>
                  <div className="rounded-xl border border-border bg-muted/30 px-3.5 py-1">
                    <BulletRow label="Attendance sessions and records (for academic records)" />
                    <BulletRow label="Class enrollment history" />
                  </div>
                </div>

                {/* Confirmation input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Type{" "}
                    <span className="font-mono font-semibold text-foreground">
                      {CONFIRM_PHRASE}
                    </span>{" "}
                    to confirm
                  </label>
                  <input
                    type="text"
                    value={phrase}
                    onChange={e => { setPhrase(e.target.value); setError(null) }}
                    placeholder={CONFIRM_PHRASE}
                    disabled={loading}
                    autoComplete="off"
                    spellCheck={false}
                    className="w-full rounded-xl border border-border bg-background
                               px-3.5 py-2.5 text-sm text-foreground
                               placeholder:text-muted-foreground/50
                               focus:outline-none focus:ring-2 focus:ring-red-400/30
                               focus:border-red-400 hover:border-red-400/40
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-150"
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1,  y:  0 }}
                      className="flex items-start gap-1.5 text-xs text-red-500 break-words min-w-0"
                    >
                      <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                      <span className="break-all">{error}</span>
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 pb-5">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-border text-sm
                             font-medium text-muted-foreground hover:bg-muted
                             hover:text-foreground transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <motion.button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!canSubmit}
                  whileHover={{ scale: canSubmit ? 1.01 : 1 }}
                  whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                             bg-red-600 text-white text-sm font-semibold
                             hover:bg-red-700 transition-colors shadow-sm
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                    : <><Trash2 size={14} /> Delete my account</>
                  }
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default DeleteAccountModal
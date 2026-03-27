// src/components/timetable/SavedPanel.jsx
import { useState } from "react"
import { createPortal } from "react-dom"

export function SavedPanel({ saved, onLoad, onDelete }) {
  const [confirmId, setConfirmId] = useState(null)

  return (
    <div className="space-y-2">
      {saved.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-6">No saved timetables yet.</p>
      )}
      {saved.map(doc => (
        <div key={doc.$id}
          className="flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 dark:border-zinc-800
                     bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
          <div>
            <p className="text-sm font-semibold text-foreground">{doc.name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(doc.savedAt || doc.$createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onLoad(doc)}
              className="text-xs px-3 py-1.5 rounded-lg border border-violet-200 dark:border-violet-800
                         text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20
                         font-medium transition-colors">
              Load
            </button>
            <button onClick={() => setConfirmId(doc.$id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800/50
                         text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium transition-colors">
              Delete
            </button>
          </div>
        </div>
      ))}

      {confirmId && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
             style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
          <div className="w-72 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 p-5 text-center shadow-2xl">
            <p className="font-semibold text-foreground mb-1">Delete timetable?</p>
            <p className="text-xs text-muted-foreground mb-4">This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 h-9 text-sm border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-muted transition-colors">
                Cancel
              </button>
              <button onClick={() => { onDelete(confirmId); setConfirmId(null) }}
                className="flex-1 h-9 text-sm font-semibold bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
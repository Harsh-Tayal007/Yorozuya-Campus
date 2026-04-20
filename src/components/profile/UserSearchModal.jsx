// src/components/common/UserSearchModal.jsx
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, X, Clock, Trash2 } from "lucide-react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useNavigate } from "react-router-dom"

const DATABASE_ID    = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = "users"
const HISTORY_KEY    = "unizuya_user_search_history"
const MAX_HISTORY    = 8

// ── Persist history in localStorage ──────────────────────────────────────────
const loadHistory = () => {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) ?? [] }
  catch { return [] }
}
const saveHistory = (list) => {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(list)) }
  catch { /* ignore */ }
}

export default function UserSearchModal({ open, onClose }) {
  const [query,   setQuery]   = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])

  const inputRef = useRef(null)
  const navigate = useNavigate()
  const timer    = useRef(null)

  // Load history when opened; reset query
  useEffect(() => {
    if (open) {
      setQuery("")
      setResults([])
      setHistory(loadHistory())
      setTimeout(() => inputRef.current?.focus(), 80)
    }
  }, [open])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }
    clearTimeout(timer.current)
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
          Query.startsWith("username", query.toLowerCase().trim()),
          Query.limit(8),
        ])
        setResults(res.documents)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => clearTimeout(timer.current)
  }, [query])

  // Navigate to profile and push to history
  const handleSelect = (user) => {
    const entry = {
      username:  user.username,
      name:      user.name,
      avatarUrl: user.avatarUrl ?? null,
    }
    const next = [entry, ...history.filter(h => h.username !== user.username)].slice(0, MAX_HISTORY)
    setHistory(next)
    saveHistory(next)
    onClose()
    navigate(`/profile/${user.username}`)
  }

  // Remove one history entry
  const removeHistory = (username, e) => {
    e.stopPropagation()
    const next = history.filter(h => h.username !== username)
    setHistory(next)
    saveHistory(next)
  }

  // Clear all history
  const clearHistory = () => {
    setHistory([])
    saveHistory([])
  }

  const showHistory  = !query.trim() && history.length > 0
  const showEmpty    = !query.trim() && history.length === 0
  const showNoResult = !loading && !!query.trim() && results.length === 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="search-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* ── Modal ──
               Mobile  → full-width bottom sheet (slides up)
               Desktop → centered dropdown from top (scales in)
          ── */}
          <motion.div
            key="search-modal"
            // Mobile animation: slide up from bottom
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="
              fixed z-[61] flex flex-col
              bg-white dark:bg-[#0d1728]
              border-t border-slate-200/80 dark:border-white/[0.08]
              shadow-2xl shadow-black/50
              overflow-hidden

              /* mobile: anchored to bottom, full width, rounded top */
              bottom-0 left-0 right-0
              rounded-t-2xl
              max-h-[82vh]

              /* sm+: centered card, rounded all sides */
              sm:bottom-auto sm:top-20
              sm:left-1/2 sm:-translate-x-1/2
              sm:w-full sm:max-w-lg
              sm:rounded-2xl
              sm:border
              sm:max-h-[480px]
            "
          >
            {/* ── Drag handle - mobile only ── */}
            <div className="flex justify-center pt-3 pb-0 sm:hidden shrink-0">
              <div className="w-9 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
            </div>

            {/* ── Search input row ── */}
            <div className="flex items-center gap-2.5 px-4 py-3 shrink-0
                            border-b border-slate-100 dark:border-white/[0.07]">
              <Search size={16} className="text-slate-400 dark:text-slate-500 shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Escape") onClose() }}
                placeholder="Search by username…"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="flex-1 min-w-0 bg-transparent text-sm
                           text-slate-900 dark:text-white
                           placeholder:text-slate-400 dark:placeholder:text-slate-500
                           outline-none"
              />

              {/* Clear query button */}
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  className="p-1 rounded-full shrink-0
                             text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                             hover:bg-slate-100 dark:hover:bg-white/10 transition"
                >
                  <X size={14} />
                </button>
              ) : (
                /* Cancel - visible only on mobile when no query */
                <button
                  onClick={onClose}
                  className="sm:hidden text-sm font-medium shrink-0
                             text-blue-500 dark:text-blue-400
                             hover:text-blue-600 dark:hover:text-blue-300 transition"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* ── Scrollable body ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* Loading spinner */}
              {loading && (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-400">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Searching…
                </div>
              )}

              {/* No results */}
              {showNoResult && (
                <div className="py-10 text-center px-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No users found for{" "}
                    <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                      "{query}"
                    </span>
                  </p>
                </div>
              )}

              {/* Empty state */}
              {showEmpty && (
                <div className="py-12 text-center px-6">
                  <Search size={32} className="mx-auto mb-3 text-slate-200 dark:text-slate-700" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Search for people by their username
                  </p>
                </div>
              )}

              {/* ── Recent searches ── */}
              {showHistory && (
                <div className="pb-2">
                  <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide
                                     text-slate-400 dark:text-slate-500">
                      Recent
                    </span>
                    <button
                      onClick={clearHistory}
                      className="flex items-center gap-1 text-xs
                                 text-slate-400 dark:text-slate-500
                                 hover:text-red-500 dark:hover:text-red-400 transition"
                    >
                      <Trash2 size={11} />
                      Clear all
                    </button>
                  </div>

                  {history.map(entry => (
                    <button
                      key={entry.username}
                      onClick={() => handleSelect(entry)}
                      className="w-full flex items-center gap-3 px-4 py-2.5
                                 hover:bg-slate-50 dark:hover:bg-white/[0.04]
                                 active:bg-slate-100 dark:active:bg-white/[0.07]
                                 transition-colors duration-100 text-left group"
                    >
                      {/* Clock icon */}
                      <Clock size={14} className="text-slate-300 dark:text-slate-600 shrink-0" />

                      {/* Avatar */}
                      {entry.avatarUrl ? (
                        <img src={entry.avatarUrl} alt={entry.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0
                                     border border-slate-200 dark:border-white/10" />
                      ) : (
                        <div className="w-8 h-8 rounded-full shrink-0
                                        bg-gradient-to-br from-blue-500 to-indigo-500
                                        flex items-center justify-center
                                        text-white text-xs font-semibold">
                          {entry.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                      )}

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                          @{entry.username}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                          {entry.name}
                        </p>
                      </div>

                      {/* Per-item remove button */}
                      <button
                        onClick={(e) => removeHistory(entry.username, e)}
                        className="p-1.5 rounded-full shrink-0
                                   opacity-0 group-hover:opacity-100
                                   sm:group-focus-within:opacity-100
                                   text-slate-400 hover:text-slate-700 dark:hover:text-white
                                   hover:bg-slate-100 dark:hover:bg-white/10
                                   transition-all duration-150"
                        aria-label="Remove from history"
                      >
                        <X size={12} />
                      </button>
                    </button>
                  ))}
                </div>
              )}

              {/* ── Live results ── */}
              {!loading && results.length > 0 && (
                <div className="pb-2">
                  <div className="px-4 pt-3 pb-1.5">
                    <span className="text-xs font-semibold uppercase tracking-wide
                                     text-slate-400 dark:text-slate-500">
                      Results
                    </span>
                  </div>

                  {results.map(user => (
                    <button
                      key={user.$id}
                      onClick={() => handleSelect(user)}
                      className="w-full flex items-center gap-3 px-4 py-3
                                 hover:bg-slate-50 dark:hover:bg-white/[0.04]
                                 active:bg-slate-100 dark:active:bg-white/[0.07]
                                 transition-colors duration-100 text-left"
                    >
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name}
                          className="w-9 h-9 rounded-full object-cover shrink-0
                                     border border-slate-200 dark:border-white/10" />
                      ) : (
                        <div className="w-9 h-9 rounded-full shrink-0
                                        bg-gradient-to-br from-blue-500 to-indigo-500
                                        flex items-center justify-center
                                        text-white text-sm font-semibold">
                          {user.name?.charAt(0).toUpperCase() ?? "?"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          @{user.username}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {user.name}
                        </p>
                      </div>

                      {user.karma > 0 && (
                        <span className="text-[11px] font-medium shrink-0
                                         text-slate-400 dark:text-slate-500">
                          {user.karma} karma
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Footer - desktop only ── */}
            <div className="hidden sm:flex items-center justify-between shrink-0
                            px-4 py-2
                            border-t border-slate-100 dark:border-white/[0.07]">
              <p className="text-[10px] text-slate-400 dark:text-slate-600">
                Press{" "}
                <kbd className="font-mono px-1 py-0.5 rounded
                                bg-slate-100 dark:bg-white/10
                                border border-slate-200 dark:border-white/10">/</kbd>{" "}
                to open
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-600">
                <kbd className="font-mono px-1 py-0.5 rounded
                                bg-slate-100 dark:bg-white/10
                                border border-slate-200 dark:border-white/10">Esc</kbd>{" "}
                to close
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
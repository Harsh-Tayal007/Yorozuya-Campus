import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient, useMutation } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { deleteThread } from "@/services/forum/threadService"
import { MessageSquare, Clock, MoreVertical, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { getProgramById } from "@/services/university/programService"
import { getBranchById } from "@/services/university/branchService"


const highlightMatch = (text = "", query) => {
  const safeText = String(text)
  if (!query?.trim()) return <span>{safeText}</span>
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`(${escaped})`, "gi")
  return safeText.split(regex).map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5 not-italic">{part}</mark>
      : <span key={i}>{part}</span>
  )
}

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const Tag = ({ label }) => (
  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium
                   bg-muted text-muted-foreground border border-border/60
                   group-hover:border-primary/30 transition-colors duration-200
                   max-w-[140px] sm:max-w-[200px] truncate">
    {label}
  </span>
)

// ── Delete Confirm Dialog ─────────────────────────────────────────────────────
const DeleteConfirmDialog = ({ threadTitle, onConfirm, onCancel, isPending }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
       onClick={onCancel}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
    <div
      className="relative z-10 w-full max-w-sm bg-background border border-border
                 rounded-2xl shadow-2xl p-6 space-y-4
                 animate-in fade-in-0 zoom-in-95 duration-150"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-center w-11 h-11 rounded-full
                      bg-destructive/10 border border-destructive/20 mx-auto">
        <AlertTriangle size={20} className="text-destructive" />
      </div>
      <div className="text-center space-y-1.5">
        <h3 className="font-semibold text-base">Delete this thread?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">"{threadTitle}"</span>
          {" "}and all its replies will be permanently deleted. This cannot be undone.
        </p>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 h-10 rounded-xl border border-border text-sm font-medium
                     hover:bg-muted transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={isPending}
          className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground
                     text-sm font-semibold hover:bg-destructive/90
                     disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : "Delete"}
        </button>
      </div>
    </div>
  </div>
)

// =============================================================================
const ThreadCard = ({ thread, searchQuery }) => {
  const navigate    = useNavigate()
  const queryClient = useQueryClient()
  const { currentUser, role } = useAuth()  // role is separate state — NOT inside user object
  const menuRef     = useRef(null)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isOwn     = currentUser?.$id === thread.authorId
  const isMod     = role === "admin" || role === "moderator"
  const canDelete = isOwn || isMod

  // Resolve IDs → names
  // Universities are always cached (staleTime:Infinity from Forum's useUniversities)
  // Programs/branches: read from cache if filter was opened, else fetch on demand
  const universities = queryClient.getQueryData(["universities"]) ?? []
  const uniLabel     = universities.find(u => u.$id === thread.universityId)?.name ?? thread.universityId

  // Only fetch if ID looks like a real Appwrite $id (20+ chars)
  // Dummy IDs like "btech", "cse" are short strings — skip fetching them
  const isAppwriteId = (id) => typeof id === "string" && id.length >= 20

  const { data: programDoc } = useQuery({
    queryKey: ["program", thread.courseId],
    queryFn:  () => getProgramById(thread.courseId),
    enabled:  isAppwriteId(thread.courseId),
    staleTime: Infinity,
    retry: false,
  })
  const { data: branchDoc } = useQuery({
    queryKey: ["branch", thread.branchId],
    queryFn:  () => getBranchById(thread.branchId),
    enabled:  isAppwriteId(thread.branchId),
    staleTime: Infinity,
    retry: false,
  })
  const courseLabel = programDoc?.name ?? thread.courseId
  const branchLabel = branchDoc?.name  ?? thread.branchId

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler, { passive: true })
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("touchstart", handler)
    }
  }, [menuOpen])

  const deleteMutation = useMutation({
    mutationFn: () => deleteThread(thread.$id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["threads"] })
      const prev = queryClient.getQueryData(["threads"])
      queryClient.setQueryData(["threads"], (old = []) =>
        old.filter(t => t.$id !== thread.$id)
      )
      return { prev }
    },
    onError: (err, _, ctx) => {
      queryClient.setQueryData(["threads"], ctx.prev)
      console.error("Delete failed:", err)
      alert("Failed to delete thread. You may not have permission.")
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["threads"] }),
  })

  const handleCardClick = (e) => {
    if (menuRef.current?.contains(e.target)) return
    if (showConfirm) return
    navigate(`/forum/${thread.$id}`)
  }

  return (
    <>
      {showConfirm && (
        <DeleteConfirmDialog
          threadTitle={thread.title}
          isPending={deleteMutation.isPending}
          onConfirm={() => { deleteMutation.mutate(); setShowConfirm(false) }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div
        role="button"
        tabIndex={0}
        onClick={handleCardClick}
        onKeyDown={(e) => e.key === "Enter" && handleCardClick(e)}
        className="group relative bg-card border border-border rounded-2xl px-4 py-3.5
                   cursor-pointer select-none outline-none
                   transition-all duration-200 ease-out
                   hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5
                   hover:-translate-y-0.5
                   focus-visible:ring-2 focus-visible:ring-primary/50
                   active:scale-[0.99]"
      >
        {/* Left accent */}
        <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-primary
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10
                          border border-primary/20 flex items-center justify-center
                          text-[11px] font-bold text-primary select-none mt-0.5">
            {thread.authorName?.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {/* Row 1: author + time + menu */}
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground min-w-0">
                <span className="font-medium text-foreground/80 truncate">{thread.authorName}</span>
                <span className="shrink-0 opacity-40">·</span>
                <Clock size={10} className="opacity-40 shrink-0" />
                <span className="shrink-0">{timeAgo(thread.$createdAt)}</span>
              </div>

              {canDelete && (
                <div ref={menuRef} className="relative shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
                    className="p-1.5 rounded-lg transition-colors duration-150 -mr-1
                               text-muted-foreground hover:text-foreground hover:bg-muted
                               active:bg-muted"
                  >
                    <MoreVertical size={15} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-border
                                    bg-popover shadow-xl overflow-hidden
                                    animate-in fade-in-0 zoom-in-95 duration-100 origin-top-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setMenuOpen(false)
                          setShowConfirm(true)
                        }}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm
                                   text-destructive hover:bg-destructive/10 transition-colors">
                        <Trash2 size={13} />
                        Delete thread
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 2: title */}
            <h3 className="font-semibold text-[14px] leading-snug text-foreground
                           group-hover:text-primary transition-colors duration-200
                           line-clamp-2 mb-1.5">
              {highlightMatch(thread.title, searchQuery)}
            </h3>

            {/* Row 3: preview */}
            {thread.content && (
              <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                {highlightMatch(thread.content, searchQuery)}
              </p>
            )}

            {/* Row 4: tags + reply count */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                {thread.universityId && <Tag label={uniLabel} />}
                {thread.courseId     && <Tag label={courseLabel} />}
                {thread.branchId     && <Tag label={branchLabel} />}
              </div>
              <div className="flex items-center gap-1 text-[12px] text-muted-foreground shrink-0
                              group-hover:text-primary transition-colors duration-200">
                <MessageSquare size={12} />
                <span className="font-medium">{thread.repliesCount ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ThreadCard
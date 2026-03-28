import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { deleteThread } from "@/services/forum/threadService"
import { MessageSquare, Clock, MoreVertical, Trash2, AlertTriangle, Loader2, Link2 } from "lucide-react"
import { copyShareLink } from "@/utils/share"
import { getProgramById } from "@/services/university/programService"
import { getBranchById } from "@/services/university/branchService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { toast } from "sonner"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_COL = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

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
  if (m < 1) return "just now"
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
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

const DeleteConfirmDialog = ({ threadTitle, onConfirm, onCancel, isPending }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
    <div className="relative z-10 w-full max-w-sm bg-background border border-border
                    rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95 duration-150"
      onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-center w-11 h-11 rounded-full
                      bg-destructive/10 border border-destructive/20 mx-auto">
        <AlertTriangle size={20} className="text-destructive" />
      </div>
      <div className="text-center space-y-1.5">
        <h3 className="font-semibold text-base">Delete this thread?</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">"{threadTitle}"</span>
          {" "}and all its replies will be permanently deleted.
        </p>
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={isPending}
          className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground
                     text-sm font-semibold hover:bg-destructive/90 disabled:opacity-60
                     transition-colors flex items-center justify-center gap-2">
          {isPending ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : "Delete"}
        </button>
      </div>
    </div>
  </div>
)

const ThreadAuthorAvatar = ({ authorId, authorName }) => {
  const { data } = useQuery({
    queryKey: ["user-avatar", authorId],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, USERS_COL, [
        Query.equal("userId", authorId), Query.limit(1), Query.select(["avatarUrl", "username"]),
      ])
      return res.documents[0]
        ? { avatarUrl: res.documents[0].avatarUrl ?? null, username: res.documents[0].username ?? null }
        : null
    },
    enabled: !!authorId,
    staleTime: 1000 * 60 * 10,
    retry: false,
  })
  const avatarUrl = data?.avatarUrl ?? null
  return (
    <div className="shrink-0 w-8 h-8 rounded-full relative mt-0.5">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/10
                      border border-primary/20 flex items-center justify-center
                      text-[11px] font-bold text-primary select-none">
        {authorName?.charAt(0).toUpperCase()}
      </div>
      {avatarUrl && (
        <img src={avatarUrl} alt={authorName}
          className="absolute inset-0 w-full h-full rounded-full object-cover border border-border" />
      )}
    </div>
  )
}

const ThreadCard = ({ thread, searchQuery }) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { currentUser, role } = useAuth()
  const menuRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isOwn = currentUser?.$id === thread.authorId
  const isMod = role === "admin" || role === "moderator"
  const canDelete = isOwn || isMod
  const isAppwriteId = (id) => typeof id === "string" && id.length >= 20

  const universities = queryClient.getQueryData(["universities"]) ?? []
  const uniLabel = universities.find(u => u.$id === thread.universityId)?.name ?? thread.universityId

  const { data: programDoc } = useQuery({
    queryKey: ["program", thread.courseId],
    queryFn: () => getProgramById(thread.courseId),
    enabled: isAppwriteId(thread.courseId),
    staleTime: Infinity, retry: false,
  })
  const { data: branchDoc } = useQuery({
    queryKey: ["branch", thread.branchId],
    queryFn: () => getBranchById(thread.branchId),
    enabled: isAppwriteId(thread.branchId),
    staleTime: Infinity, retry: false,
  })
  const courseLabel = programDoc?.name ?? thread.courseId
  const branchLabel = branchDoc?.name ?? thread.branchId

  const { data: authorData } = useQuery({
    queryKey: ["user-avatar", thread.authorId],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, USERS_COL, [
        Query.equal("userId", thread.authorId), Query.limit(1), Query.select(["avatarUrl", "username"]),
      ])
      return res.documents[0]
        ? { avatarUrl: res.documents[0].avatarUrl ?? null, username: res.documents[0].username ?? null }
        : null
    },
    enabled: !!thread.authorId,
    staleTime: 1000 * 60 * 10,
    retry: false,
  })
  const profileHref = authorData?.username ? `/profile/${authorData.username}` : null

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false) }
    document.addEventListener("mousedown", handler)
    document.addEventListener("touchstart", handler, { passive: true })
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler) }
  }, [menuOpen])

  const deleteMutation = useMutation({
    mutationFn: () => deleteThread(thread.$id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["threads"] })
      const prev = queryClient.getQueryData(["threads"])
      queryClient.setQueryData(["threads"], (old = []) => old.filter(t => t.$id !== thread.$id))
      return { prev }
    },
    onSuccess: () => toast.success("Thread deleted"),
    onError: (err, _, ctx) => {
      queryClient.setQueryData(["threads"], ctx.prev)
      toast.error("Failed to delete thread")
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
      <div role="button" tabIndex={0} onClick={handleCardClick}
        onKeyDown={e => e.key === "Enter" && handleCardClick(e)}
        className="group relative bg-card border border-border rounded-2xl px-4 py-3.5
                   cursor-pointer select-none outline-none transition-all duration-200 ease-out
                   hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5
                   focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.99]">
        <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-primary
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
        <div className="flex items-start gap-3">
          {profileHref ? (
            <Link to={profileHref} onClick={e => e.stopPropagation()}>
              <ThreadAuthorAvatar authorId={thread.authorId} authorName={thread.authorName} />
            </Link>
          ) : (
            <ThreadAuthorAvatar authorId={thread.authorId} authorName={thread.authorName} />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground min-w-0">
                {profileHref ? (
                  <Link to={profileHref} onClick={e => e.stopPropagation()}
                    className="font-medium text-foreground/80 hover:text-primary transition-colors truncate">
                    {thread.authorName}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground/80 truncate">{thread.authorName}</span>
                )}
                <span className="shrink-0 opacity-40">·</span>
                <Clock size={10} className="opacity-40 shrink-0" />
                <span className="shrink-0">{timeAgo(thread.$createdAt)}</span>
              </div>

              <div ref={menuRef} className="relative shrink-0">
                <button onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
                  className="p-1.5 rounded-lg transition-colors duration-150 -mr-1
                               text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted">
                  <MoreVertical size={15} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 z-50 w-44 rounded-xl border border-border
                  bg-popover shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 origin-top-right">
                    <button
                      onClick={e => { e.stopPropagation(); copyShareLink(`/forum/${thread.$id}`); setMenuOpen(false) }}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm
                 text-foreground hover:bg-muted transition-colors">
                      <Link2 size={13} /> Share thread
                    </button>
                    {canDelete && (
                      <>
                        <div className="h-px bg-border mx-2" />
                        <button onClick={e => { e.stopPropagation(); setMenuOpen(false); setShowConfirm(true) }}
                          className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm
                     text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 size={13} /> Delete thread
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>
            <h3 className="font-semibold text-[14px] leading-snug text-foreground
                           group-hover:text-primary transition-colors duration-200 line-clamp-2 mb-1.5">
              {highlightMatch(thread.title, searchQuery)}
            </h3>
            {thread.content && (
              <p className="text-[13px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
                {highlightMatch(thread.content, searchQuery)}
              </p>
            )}
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1">
                {thread.universityId && <Tag label={uniLabel} />}
                {thread.courseId && <Tag label={courseLabel} />}
                {thread.branchId && <Tag label={branchLabel} />}
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
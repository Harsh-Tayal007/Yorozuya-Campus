import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom"
import PageWrapper from "@/components/common/layout/PageWrapper"
import Breadcrumbs from "@/components/common/navigation/Breadcrumbs"
import { useQuery } from "@tanstack/react-query"
import { fetchThreadById } from "@/services/forum/threadService"
import { getProgramById } from "@/services/university/programService"
import { getBranchById } from "@/services/university/branchService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { Loader2, Clock, ArrowLeft, Bookmark, Link2 } from "lucide-react"
import { copyShareLink } from "@/utils/share"
import { RepliesProvider } from "@/components/forum/RepliesProvider"
import RepliesSection from "@/components/forum/RepliesSection"
import useBookmarkStatus from "@/hooks/useBookmarkStatus"
import { useAuth } from "@/context/AuthContext"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_COL = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

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

const isAppwriteId = (id) => typeof id === "string" && id.length >= 20

// ── Bookmark button ───────────────────────────────────────────────────────────
const BookmarkButton = ({ threadId, threadAuthorId, bookmarkCount }) => {
  const { currentUser } = useAuth()
  const { isBookmarked, isPending, toggle } = useBookmarkStatus(threadId, threadAuthorId)

  if (!currentUser) return null

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium
                  transition-all duration-150 active:scale-95 disabled:opacity-60
                  ${isBookmarked
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"}`}
    >
      <Bookmark size={13} className={isBookmarked ? "fill-primary" : ""} />
      {bookmarkCount > 0 && <span>{bookmarkCount}</span>}
      {isBookmarked ? "Saved" : "Save"}
    </button>
  )
}

const ThreadDetail = () => {
  const { threadId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const focusReplyId = searchParams.get("focus")

  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => fetchThreadById(threadId),
    enabled: !!threadId,
  })

  const { data: uniDoc } = useQuery({
    queryKey: ["university", thread?.universityId],
    queryFn: () => import("@/services/university/universityService")
      .then(m => m.getUniversityById(thread.universityId)),
    enabled: !!thread && isAppwriteId(thread.universityId),
    staleTime: Infinity, gcTime: Infinity, retry: false,
  })

  const { data: programDoc } = useQuery({
    queryKey: ["program", thread?.courseId],
    queryFn: () => getProgramById(thread.courseId),
    enabled: !!thread && isAppwriteId(thread.courseId),
    staleTime: Infinity, gcTime: Infinity, retry: false,
  })

  const { data: branchDoc } = useQuery({
    queryKey: ["branch", thread?.branchId],
    queryFn: () => getBranchById(thread.branchId),
    enabled: !!thread && isAppwriteId(thread.branchId),
    staleTime: Infinity, gcTime: Infinity, retry: false,
  })

  const { data: authorData } = useQuery({
    queryKey: ["user-avatar", thread?.authorId],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, USERS_COL, [
        Query.equal("userId", thread.authorId),
        Query.limit(1),
        Query.select(["avatarUrl", "username"]),
      ])
      return res.documents[0]
        ? { avatarUrl: res.documents[0].avatarUrl ?? null, username: res.documents[0].username ?? null }
        : null
    },
    enabled: !!thread?.authorId,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  })

  const uniLabel = uniDoc?.name ?? thread?.universityId
  const courseLabel = programDoc?.name ?? thread?.courseId
  const branchLabel = branchDoc?.name ?? thread?.branchId
  const avatarUrl = authorData?.avatarUrl ?? null
  const authorUsername = authorData?.username ?? null
  const profileHref = authorUsername ? `/profile/${authorUsername}` : null

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/forum")
  }

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading thread...
        </div>
      </PageWrapper>
    )
  }

  if (!thread) {
    return (
      <PageWrapper>
        <p className="text-muted-foreground">Thread not found.</p>
      </PageWrapper>
    )
  }

  const AvatarEl = ({ size = "w-6 h-6", textSize = "text-[10px]" }) => (
    <div className={`${size} rounded-full relative shrink-0`}>
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-primary/10
                       border border-primary/20 flex items-center justify-center
                       ${textSize} font-bold text-primary`}>
        {thread.authorName?.charAt(0).toUpperCase()}
      </div>
      {avatarUrl && (
        <img src={avatarUrl} alt={thread.authorName}
          className="absolute inset-0 w-full h-full rounded-full object-cover border border-border" />
      )}
    </div>
  )

  return (
    <PageWrapper>
      <div className="space-y-4 animate-in fade-in-50 duration-300">

        <Breadcrumbs
          items={[
            { label: "Forum", href: "/forum" },
            thread.universityId && { label: uniLabel },
            thread.courseId && { label: courseLabel },
            thread.branchId && { label: branchLabel },
            { label: thread.title },
          ].filter(Boolean)}
        />

        <button onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground
                     hover:text-foreground transition-colors group">
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="rounded-2xl border border-border bg-card px-5 py-4 space-y-3 overflow-hidden min-w-0">

          {/* Title + bookmark */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-lg sm:text-xl font-bold leading-snug text-foreground break-words flex-1">
              {thread.title}
            </h1>
            <div className="shrink-0 pt-0.5 flex items-center gap-2">
              <button
                onClick={() => copyShareLink(`/forum/${thread.$id}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border
               text-xs font-medium text-muted-foreground transition-all duration-150
               hover:border-primary/40 hover:text-primary active:scale-95"
              >
                <Link2 size={13} />
                Share
              </button>
              <BookmarkButton
                threadId={thread.$id}
                threadAuthorId={thread.authorId}
                bookmarkCount={thread.bookmarkCount ?? 0}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {thread.universityId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px]
                               font-semibold bg-primary/10 text-primary border border-primary/20">
                {uniLabel}
              </span>
            )}
            {thread.courseId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px]
                               font-medium bg-muted text-muted-foreground border border-border/60">
                {courseLabel}
              </span>
            )}
            {thread.branchId && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px]
                               font-medium bg-muted text-muted-foreground border border-border/60">
                {branchLabel}
              </span>
            )}
          </div>

          {/* Author row */}
          <div className="flex items-center gap-2">
            {profileHref ? (
              <Link to={profileHref} onClick={e => e.stopPropagation()}>
                <AvatarEl />
              </Link>
            ) : <AvatarEl />}

            {profileHref ? (
              <Link to={profileHref}
                className="text-sm font-medium text-foreground/80 hover:text-primary transition-colors"
                onClick={e => e.stopPropagation()}>
                {thread.authorName}
              </Link>
            ) : (
              <span className="text-sm font-medium text-foreground/80">{thread.authorName}</span>
            )}

            <span className="text-muted-foreground/40 text-xs">·</span>
            <Clock size={10} className="text-muted-foreground/50 shrink-0" />
            <span className="text-xs text-muted-foreground">{timeAgo(thread.$createdAt)}</span>
          </div>

          <div className="border-t border-border/50" />

          <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/85 whitespace-pre-wrap break-words overflow-wrap-anywhere">
            {thread.content}
          </p>
        </div>

        <RepliesProvider threadId={threadId} pinnedReplyId={thread.pinnedReplyId ?? null}>
          <RepliesSection threadAuthor={thread.authorId} focusReplyId={focusReplyId} />
        </RepliesProvider>

      </div>
    </PageWrapper>
  )
}

export default ThreadDetail
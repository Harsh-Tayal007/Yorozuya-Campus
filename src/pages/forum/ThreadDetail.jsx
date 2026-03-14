import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import PageWrapper from "@/components/common/layout/PageWrapper"
import Breadcrumbs from "@/components/common/navigation/Breadcrumbs"
import { useQuery } from "@tanstack/react-query"
import { fetchThreadById } from "@/services/forum/threadService"
import { getProgramById } from "@/services/university/programService"
import { getBranchById } from "@/services/university/branchService"
import { Loader2, Clock, ArrowLeft } from "lucide-react"
import { RepliesProvider } from "@/components/forum/RepliesProvider"
import RepliesSection from "@/components/forum/RepliesSection"

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

const isAppwriteId = (id) => typeof id === "string" && id.length >= 20

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

  // Resolve university — fetch directly (same key as Forum, so cache is shared)
  const { data: uniDoc } = useQuery({
    queryKey: ["university", thread?.universityId],
    queryFn:  () => import("@/services/university/universityService")
                      .then(m => m.getUniversityById(thread.universityId)),
    enabled:  !!thread && isAppwriteId(thread.universityId),
    staleTime: Infinity,
    retry: false,
  })
  const uniLabel = uniDoc?.name ?? thread?.universityId

  const { data: programDoc } = useQuery({
    queryKey: ["program", thread?.courseId],
    queryFn:  () => getProgramById(thread.courseId),
    enabled:  !!thread && isAppwriteId(thread.courseId),
    staleTime: Infinity,
    retry: false,
  })
  const { data: branchDoc } = useQuery({
    queryKey: ["branch", thread?.branchId],
    queryFn:  () => getBranchById(thread.branchId),
    enabled:  !!thread && isAppwriteId(thread.branchId),
    staleTime: Infinity,
    retry: false,
  })

  const courseLabel = programDoc?.name ?? thread?.courseId
  const branchLabel = branchDoc?.name  ?? thread?.branchId

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

  return (
    <PageWrapper>
      <div className="space-y-4 animate-in fade-in-50 duration-300">

        <Breadcrumbs
          items={[
            { label: "Forum", href: "/forum" },
            thread.universityId && { label: uniLabel },
            thread.courseId     && { label: courseLabel },
            thread.branchId     && { label: branchLabel },
            { label: thread.title },
          ].filter(Boolean)}
        />

        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground
                     hover:text-foreground transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        {/* Thread card */}
        <div className="rounded-2xl border border-border bg-card px-5 py-4 space-y-3 overflow-hidden min-w-0">

          {/* Title */}
          <h1 className="text-lg sm:text-xl font-bold leading-snug text-foreground break-words">
            {thread.title}
          </h1>

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
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10
                            border border-primary/20 flex items-center justify-center
                            text-[10px] font-bold text-primary shrink-0">
              {thread.authorName?.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-foreground/80">{thread.authorName}</span>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <Clock size={10} className="text-muted-foreground/50 shrink-0" />
            <span className="text-xs text-muted-foreground">{timeAgo(thread.$createdAt)}</span>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50" />

          {/* Content */}
          <p className="text-sm sm:text-[15px] leading-relaxed text-foreground/85 whitespace-pre-wrap break-words overflow-wrap-anywhere">
            {thread.content}
          </p>

        </div>

        {/* Replies */}
        <RepliesProvider threadId={threadId} pinnedReplyId={thread.pinnedReplyId ?? null}>
          <RepliesSection threadAuthor={thread.authorId} focusReplyId={focusReplyId} />
        </RepliesProvider>

      </div>
    </PageWrapper>
  )
}

export default ThreadDetail
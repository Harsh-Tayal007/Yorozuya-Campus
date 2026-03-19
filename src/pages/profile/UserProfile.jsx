import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Loader2, CalendarDays, BookOpen, GraduationCap, GitBranch, FileText } from "lucide-react"
import PageWrapper from "@/components/common/layout/PageWrapper"
import { getUserByUsername } from "@/services/user/profileService"
import { getUniversityById } from "@/services/university/universityService"
import { getProgramById } from "@/services/university/programService"
import { getBranchById } from "@/services/university/branchService"
import { fetchThreads } from "@/services/forum/threadService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useAuth } from "@/context/AuthContext"
import ThreadCard from "@/components/forum/ThreadCard"

const DATABASE_ID      = import.meta.env.VITE_APPWRITE_DATABASE_ID
const REPLIES_COL      = import.meta.env.VITE_APPWRITE_REPLIES_COLLECTION_ID
const THREADS_COL      = import.meta.env.VITE_APPWRITE_THREADS_COLLECTION_ID

const isAppwriteId = (id) => typeof id === "string" && id.length >= 20

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d    = Math.floor(diff / 86400000)
  if (d < 1)   return "today"
  if (d < 7)   return `${d}d ago`
  if (d < 30)  return `${Math.floor(d / 7)}w ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}y ago`
}

const YEAR_LABELS = {
  "1": "1st Year", "2": "2nd Year", "3": "3rd Year",
  "4": "4th Year", "PG": "Post Graduate",
}

const Tag = ({ icon: Icon, label, primary }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border
                    ${primary
                      ? "bg-primary/10 text-primary border-primary/20 font-semibold"
                      : "bg-muted text-muted-foreground border-border/60"}`}>
    {Icon && <Icon size={11} />}
    {label}
  </span>
)

// ── Reddit-style reply card ───────────────────────────────────────────────────
const ReplyCard = ({ reply, threadTitle, threadId }) => {
  const navigate = useNavigate()
  // Strip HTML tags from content for plain text preview
  const plainText = reply.content
    ?.replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  return (
    <div
      className="rounded-2xl border border-border bg-card px-5 py-4 space-y-2
                 hover:border-border/80 transition-colors cursor-pointer"
      onClick={() => navigate(`/forum/${threadId}?focus=${reply.$id}`)}
    >
      {/* Context line — like Reddit's "r/sub • Post title" */}
      <p className="text-xs text-muted-foreground truncate">
        replied in{" "}
        <span
          className="font-medium text-foreground hover:text-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate(`/forum/${threadId}`) }}
        >
          {threadTitle ?? "a thread"}
        </span>
        {" · "}
        {timeAgo(reply.$createdAt)}
      </p>

      {/* Reply content */}
      {plainText && (
        <p className="text-sm text-foreground/85 leading-relaxed line-clamp-3">
          {plainText}
        </p>
      )}

      {/* GIF / image preview */}
      {(reply.gifUrl || reply.imageUrl) && (
        <img
          src={reply.gifUrl || reply.imageUrl}
          alt=""
          className="max-h-32 rounded-lg border border-border object-cover"
        />
      )}

      {/* Vote count */}
      <p className="text-xs text-muted-foreground">
        {(reply.upvotes ?? 0) - (reply.downvotes ?? 0)} points
      </p>
    </div>
  )
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card px-5 py-4 animate-pulse space-y-2.5">
    <div className="h-3 bg-muted rounded w-1/2" />
    <div className="h-3 bg-muted rounded w-full" />
    <div className="h-3 bg-muted rounded w-3/4" />
  </div>
)

// ── Main component ────────────────────────────────────────────────────────────
const UserProfile = () => {
  const { username } = useParams()
  const { currentUser } = useAuth()
  const isOwnProfile = currentUser?.username === username
  const [activeTab, setActiveTab] = useState("posts")

  // 1 fetch: user doc
  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile", username],
    queryFn:  () => getUserByUsername(username),
    staleTime: 1000 * 60 * 5,
  })

  // Resolve names — reads from TanStack cache if warm, else 1 fetch each
  const { data: uniDoc } = useQuery({
    queryKey: ["university", profile?.universityId],
    queryFn:  () => getUniversityById(profile.universityId),
    enabled:  !!profile && isAppwriteId(profile.universityId),
    staleTime: Infinity,
    retry: false,
  })
  const { data: programDoc } = useQuery({
    queryKey: ["program", profile?.programId],
    queryFn:  () => getProgramById(profile.programId),
    enabled:  !!profile && isAppwriteId(profile.programId),
    staleTime: Infinity,
    retry: false,
  })
  const { data: branchDoc } = useQuery({
    queryKey: ["branch", profile?.branchId],
    queryFn:  () => getBranchById(profile.branchId),
    enabled:  !!profile && isAppwriteId(profile.branchId),
    staleTime: Infinity,
    retry: false,
  })

  // Posts — from cached threads, 0 extra requests
  const { data: allThreads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ["threads"],
    queryFn:  fetchThreads,
    staleTime: 1000 * 60 * 5,
    enabled:  !!profile,
  })
  const userThreads = allThreads.filter(t => t.authorId === profile?.userId)

  // Replies — 1 fetch, lazy (only when tab clicked)
  const { data: userReplies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ["user-replies", profile?.userId],
    queryFn:  async () => {
      const res = await databases.listDocuments(DATABASE_ID, REPLIES_COL, [
        Query.equal("authorId", profile.userId),
        Query.equal("deleted", false),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
        Query.select([
          "$id", "threadId", "content", "gifUrl", "imageUrl",
          "upvotes", "downvotes", "parentReplyId", "$createdAt",
        ]),
      ])
      return res.documents
    },
    enabled: !!profile && activeTab === "replies",
    staleTime: 1000 * 60 * 2,
  })

  // Resolve thread titles for reply cards — uses cached threads, 0 extra requests
  const threadTitleMap = allThreads.reduce((acc, t) => {
    acc[t.$id] = t.title
    return acc
  }, {})

  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading profile...
        </div>
      </PageWrapper>
    )
  }

  if (isError || !profile) {
    return (
      <PageWrapper>
        <div className="py-20 text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">User not found</p>
          <p className="text-sm text-muted-foreground">
            No account exists with username <span className="font-mono">@{username}</span>
          </p>
          <Link to="/forum" className="text-sm text-primary hover:underline">
            Back to Forum
          </Link>
        </div>
      </PageWrapper>
    )
  }

  const uniLabel     = uniDoc?.name     ?? null
  const programLabel = programDoc?.name ?? null
  const branchLabel  = branchDoc?.name  ?? null

  const TABS = [
    { key: "posts",   label: "Posts",   count: userThreads.length },
    { key: "replies", label: "Replies", count: null },
  ]

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in-50 duration-300 pt-6">

        {/* ── Profile card ── */}
        <div className="rounded-2xl border border-border bg-card px-6 py-6 space-y-4">

          {/* Avatar + name + edit */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30
                                to-primary/10 border border-primary/20 flex items-center
                                justify-center text-2xl font-bold text-primary shrink-0">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground truncate">{profile.name}</h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
            </div>

            {isOwnProfile && (
              <Link
                to="/dashboard/settings"
                className="shrink-0 px-3 py-1.5 rounded-xl border border-border text-xs
                           font-medium text-muted-foreground hover:text-foreground
                           hover:border-primary/50 transition-colors"
              >
                Edit Profile
              </Link>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {uniLabel     && <Tag icon={GraduationCap} label={uniLabel}     primary />}
            {programLabel && <Tag icon={BookOpen}      label={programLabel} />}
            {branchLabel  && <Tag icon={GitBranch}     label={branchLabel}  />}
            {profile.yearOfStudy && (
              <Tag label={YEAR_LABELS[profile.yearOfStudy] ?? profile.yearOfStudy} />
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText size={12} />
              <span><strong className="text-foreground">{userThreads.length}</strong> posts</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays size={12} />
              Joined {timeAgo(profile.$createdAt)}
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-border">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors relative
                          ${activeTab === tab.key
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground"}`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {tab.count}
                </span>
              )}
              {/* Active underline */}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="space-y-2.5 pb-10">

          {/* Posts tab */}
          {activeTab === "posts" && (
            threadsLoading ? (
              <div className="space-y-2.5">
                {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : userThreads.length > 0 ? (
              <div className="space-y-2.5">
                {userThreads.map(thread => (
                  <ThreadCard key={thread.$id} thread={thread} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                <p className="text-sm text-muted-foreground">No posts yet.</p>
              </div>
            )
          )}

          {/* Replies tab */}
          {activeTab === "replies" && (
            repliesLoading ? (
              <div className="space-y-2.5">
                {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : userReplies.length > 0 ? (
              <div className="space-y-2.5">
                {userReplies.map(reply => (
                  <ReplyCard
                    key={reply.$id}
                    reply={reply}
                    threadId={reply.threadId}
                    threadTitle={threadTitleMap[reply.threadId] ?? null}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                <p className="text-sm text-muted-foreground">No replies yet.</p>
              </div>
            )
          )}

        </div>
      </div>
    </PageWrapper>
  )
}

export default UserProfile
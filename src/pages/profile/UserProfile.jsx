import { useParams, Link, useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import {
  Loader2, CalendarDays, BookOpen, GraduationCap, GitBranch,
  Bookmark, UserPlus, UserCheck, Loader, X, ArrowLeft, Link2
} from "lucide-react"
import { copyShareLink } from "@/utils/share"
import PageWrapper from "@/components/common/layout/PageWrapper"
import {
  getUserByUsername, getUserBookmarks,
  getFollowers, getFollowing
} from "@/services/user/profileService"
import { getUniversityById } from "@/services/university/universityService"
import { getProgramById } from "@/services/university/programService"
import { getBranchById } from "@/services/university/branchService"
import { fetchThreads, fetchThreadById } from "@/services/forum/threadService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useAuth } from "@/context/AuthContext"
import ThreadCard from "@/components/forum/ThreadCard"
import useFollowStatus from "@/hooks/useFollowStatus"
import ProfileSkeleton from "@/components/profile/ProfileSkeleton"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const REPLIES_COL = import.meta.env.VITE_APPWRITE_REPLIES_COLLECTION_ID
const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

const isAppwriteId = (id) => typeof id === "string" && id.length >= 20

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return "today"
  if (d < 7) return `${d}d ago`
  if (d < 30) return `${Math.floor(d / 7)}w ago`
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

const CardSkeleton = () => (
  <div className="rounded-2xl border border-border bg-card px-5 py-4 animate-pulse space-y-2.5">
    <div className="h-3 bg-muted rounded w-1/2" />
    <div className="h-3 bg-muted rounded w-full" />
    <div className="h-3 bg-muted rounded w-3/4" />
  </div>
)

const ReplyCard = ({ reply, threadTitle, threadId }) => {
  const navigate = useNavigate()
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
      <p className="text-xs text-muted-foreground truncate">
        replied in{" "}
        <span className="font-medium text-foreground hover:text-primary transition-colors"
          onClick={(e) => { e.stopPropagation(); navigate(`/forum/${threadId}`) }}>
          {threadTitle ?? "a thread"}
        </span>
        {" · "}{timeAgo(reply.$createdAt)}
      </p>
      {plainText && (
        <p className="text-sm text-foreground/85 leading-relaxed line-clamp-3">{plainText}</p>
      )}
      {(reply.gifUrl || reply.imageUrl) && (
        <img src={reply.gifUrl || reply.imageUrl} alt=""
          className="max-h-32 rounded-lg border border-border object-cover" />
      )}
      <p className="text-xs text-muted-foreground">
        {(reply.upvotes ?? 0) - (reply.downvotes ?? 0)} points
      </p>
    </div>
  )
}

// ── Follow button ─────────────────────────────────────────────────────────────
const FollowButton = ({ targetUserId, size = "md" }) => {
  const { isFollowing, isPending, toggle } = useFollowStatus(targetUserId)
  const { currentUser } = useAuth()
  if (!currentUser) return null

  const sizeClass = size === "sm"
    ? "px-3 py-1 text-xs gap-1"
    : "px-4 py-1.5 text-sm gap-1.5"

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`flex items-center font-semibold rounded-xl border
                  transition-all duration-150 active:scale-95 disabled:opacity-60 shrink-0
                  ${sizeClass}
                  ${isFollowing
          ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/5"
          : "border-primary bg-primary text-primary-foreground hover:bg-primary/90"}`}
    >
      {isPending
        ? <Loader size={12} className="animate-spin" />
        : isFollowing
          ? <><UserCheck size={12} /> Following</>
          : <><UserPlus size={12} /> Follow</>
      }
    </button>
  )
}

// ── Stat block ────────────────────────────────────────────────────────────────
const StatBlock = ({ value, label, onClick }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`flex flex-col items-center gap-0.5
                ${onClick ? "cursor-pointer hover:opacity-70 transition-opacity active:scale-95" : "cursor-default"}`}
  >
    <span className="text-sm font-bold text-foreground leading-tight tabular-nums">
      {value ?? 0}
    </span>
    <span className="text-[11px] text-muted-foreground whitespace-nowrap">{label}</span>
  </button>
)

// ── User list item (for followers/following modal) ────────────────────────────
const UserListItem = ({ userId, onClose }) => {
  const navigate = useNavigate()
  const { currentUser } = useAuth()

  const { data: userDoc, isLoading } = useQuery({
    queryKey: ["user-list-item", userId],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
        Query.equal("userId", userId),
        Query.limit(1),
        Query.select(["userId", "username", "name", "avatarUrl", "bio"]),
      ])
      return res.documents[0] ?? null
    },
    staleTime: 1000 * 60 * 5,
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 animate-pulse">
        <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-muted rounded w-24" />
          <div className="h-3 bg-muted rounded w-16" />
        </div>
      </div>
    )
  }

  if (!userDoc) return null

  const isOwn = currentUser?.$id === userId

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
      {/* Avatar */}
      <button
        onClick={() => { navigate(`/profile/${userDoc.username}`); onClose() }}
        className="shrink-0"
      >
        {userDoc.avatarUrl ? (
          <img src={userDoc.avatarUrl} alt={userDoc.name}
            className="w-10 h-10 rounded-full object-cover border border-border" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10
                          border border-primary/20 flex items-center justify-center
                          text-sm font-bold text-primary">
            {userDoc.name?.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {/* Name + bio */}
      <button
        className="flex-1 min-w-0 text-left"
        onClick={() => { navigate(`/profile/${userDoc.username}`); onClose() }}
      >
        <p className="text-sm font-semibold text-foreground truncate">{userDoc.name}</p>
        <p className="text-xs text-muted-foreground truncate">@{userDoc.username}</p>
        {userDoc.bio && (
          <p className="text-xs text-muted-foreground/70 truncate mt-0.5">{userDoc.bio}</p>
        )}
      </button>

      {/* Follow button - don't show on own account */}
      {!isOwn && (
        <FollowButton targetUserId={userId} size="sm" />
      )}
    </div>
  )
}

// ── Followers / Following modal ───────────────────────────────────────────────
const FollowModal = ({ isOpen, onClose, title, userIds = [], isLoading }) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col justify-end sm:justify-center sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet - slides up from bottom on mobile, centered on desktop */}
      <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl
                      border border-border shadow-2xl z-10
                      max-h-[80vh] flex flex-col
                      animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0
                      sm:fade-in-0 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border shrink-0">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center
                       text-muted-foreground hover:text-foreground hover:bg-muted
                       transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="space-y-0 divide-y divide-border/50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-muted rounded w-24" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : userIds.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No one here yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {userIds.map(id => (
                <UserListItem key={id} userId={id} onClose={onClose} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
const UserProfile = () => {
  const { username } = useParams()
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  const isOwnProfile = currentUser?.username === username
  const [activeTab, setActiveTab] = useState("posts")
  const [modal, setModal] = useState(null) // "followers" | "following" | null

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => getUserByUsername(username),
    staleTime: 1000 * 60 * 5,
  })

  if (profile?.userId) {
    queryClient.setQueryData(["profile-by-userid", profile.userId], profile)
  }

  const { data: uniDoc } = useQuery({
    queryKey: ["university", profile?.universityId],
    queryFn: () => getUniversityById(profile.universityId),
    enabled: !!profile && isAppwriteId(profile.universityId),
    staleTime: Infinity, retry: false,
  })
  const { data: programDoc } = useQuery({
    queryKey: ["program", profile?.programId],
    queryFn: () => getProgramById(profile.programId),
    enabled: !!profile && isAppwriteId(profile.programId),
    staleTime: Infinity, retry: false,
  })
  const { data: branchDoc } = useQuery({
    queryKey: ["branch", profile?.branchId],
    queryFn: () => getBranchById(profile.branchId),
    enabled: !!profile && isAppwriteId(profile.branchId),
    staleTime: Infinity, retry: false,
  })

  const { data: allThreads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
    staleTime: 1000 * 60 * 5,
    enabled: !!profile,
  })
  const userThreads = allThreads.filter(t => t.authorId === profile?.userId)

  const { data: userReplies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ["user-replies", profile?.userId],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, REPLIES_COL, [
        Query.equal("authorId", profile.userId),
        Query.equal("deleted", false),
        Query.orderDesc("$createdAt"),
        Query.limit(50),
        Query.select(["$id", "threadId", "content", "gifUrl", "imageUrl",
          "upvotes", "downvotes", "$createdAt"]),
      ])
      return res.documents
    },
    enabled: !!profile && activeTab === "replies",
    staleTime: 1000 * 60 * 2,
  })

  const { data: bookmarkDocs = [], isLoading: bookmarksLoading } = useQuery({
    queryKey: ["user-bookmarks", profile?.userId],
    queryFn: () => getUserBookmarks(profile.userId),
    enabled: !!profile && isOwnProfile && activeTab === "saved",
    staleTime: 1000 * 60 * 2,
  })

  const { data: bookmarkedThreads = [], isLoading: bmThreadsLoading } = useQuery({
    queryKey: ["bookmarked-threads", bookmarkDocs.map(b => b.threadId).join(",")],
    queryFn: async () => {
      const ids = bookmarkDocs.map(b => b.threadId)
      const results = await Promise.all(
        ids.map(id => {
          const cached = queryClient.getQueryData(["thread", id])
          return cached ?? fetchThreadById(id)
        })
      )
      return results.filter(Boolean)
    },
    enabled: bookmarkDocs.length > 0 && activeTab === "saved",
    staleTime: 1000 * 60 * 5,
  })

  // Followers / Following lists - lazy, only fetch when modal opens
  const { data: followerIds = [], isLoading: followersLoading } = useQuery({
    queryKey: ["followers-list", profile?.userId],
    queryFn: () => getFollowers(profile.userId),
    enabled: !!profile?.userId && modal === "followers",
    staleTime: 1000 * 60 * 2,
  })

  const { data: followingIds = [], isLoading: followingLoading } = useQuery({
    queryKey: ["following-list", profile?.userId],
    queryFn: () => getFollowing(profile.userId),
    enabled: !!profile?.userId && modal === "following",
    staleTime: 1000 * 60 * 2,
  })

  const threadTitleMap = allThreads.reduce((acc, t) => {
    acc[t.$id] = t.title
    return acc
  }, {})

  const cachedProfile = queryClient.getQueryData(["profile-by-userid", profile?.userId])
  const displayProfile = { ...profile, ...cachedProfile }

  if (isLoading) return <PageWrapper><ProfileSkeleton /></PageWrapper>

  if (isError || !profile) {
    return (
      <PageWrapper>
        <div className="py-20 text-center space-y-2">
          <p className="text-lg font-semibold text-foreground">User not found</p>
          <p className="text-sm text-muted-foreground">
            No account exists with username <span className="font-mono">@{username}</span>
          </p>
          <Link to="/forum" className="text-sm text-primary hover:underline">Back to Forum</Link>
        </div>
      </PageWrapper>
    )
  }

  const uniLabel = uniDoc?.name ?? null
  const programLabel = programDoc?.name ?? null
  const branchLabel = branchDoc?.name ?? null

  const TABS = [
    { key: "posts", label: "Posts", count: userThreads.length },
    { key: "replies", label: "Replies", count: null },
    ...(isOwnProfile ? [{ key: "saved", label: "Saved", count: null }] : []),
  ]

  return (
    <PageWrapper>
      <div className="max-w-xl mx-auto space-y-6 animate-in fade-in-50 duration-300 pt-6">

        {/* ── Profile card ── */}
        <div className="rounded-2xl border border-border bg-card px-4 py-5 space-y-4 overflow-hidden">

          {/* Top row: avatar + info */}
          <div className="flex items-start gap-3 sm:gap-4">

            {/* Avatar - fixed size, doesn't grow */}
            <div className="shrink-0">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/30
                                to-primary/10 border-2 border-primary/20 flex items-center justify-center
                                text-2xl sm:text-3xl font-bold text-primary">
                  {profile.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Right side - name + button + stats */}
            <div className="flex-1 min-w-0 space-y-2.5">

              {/* Name + Edit/Follow */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base font-bold text-foreground truncate leading-tight">
                    {profile.name}
                  </h1>
                  <p className="text-xs pb-1 text-muted-foreground truncate">@{profile.username}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {/* Share profile - always visible */}
                  <button
                    onClick={() => copyShareLink(`/profile/${profile.username}`)}
                    className="p-1.5 rounded-xl border border-border text-muted-foreground
               hover:border-primary/40 hover:text-primary transition-all duration-150
               active:scale-95"
                    title="Share profile"
                  >
                    <Link2 size={13} />
                  </button>

                  {isOwnProfile ? (
                    <Link to="/dashboard/settings"
                      className="px-3 py-1.5 rounded-xl border border-border text-xs
                 font-medium text-muted-foreground hover:text-foreground
                 hover:border-primary/50 transition-colors whitespace-nowrap">
                      Edit Profile
                    </Link>
                  ) : (
                    <FollowButton targetUserId={profile.userId} />
                  )}
                </div>
              </div>

              {/* Stats - evenly spaced, no overflow */}
              <div className="grid grid-cols-4 gap-1 w-full">
                <StatBlock value={userThreads.length} label="posts" />
                <StatBlock
                  value={displayProfile.followerCount ?? 0}
                  label="followers"
                  onClick={() => setModal("followers")}
                />
                <StatBlock
                  value={displayProfile.followingCount ?? 0}
                  label="following"
                  onClick={() => setModal("following")}
                />
                <StatBlock
                  value={displayProfile.karma ?? 0}
                  label="karma"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap px-1">
              {profile.bio}
            </p>
          )}

          {/* Academic tags + join date */}
          <div className="space-y-2 px-1">
            <div className="flex flex-wrap gap-1.5">
              {uniLabel && <Tag icon={GraduationCap} label={uniLabel} primary />}
              {programLabel && <Tag icon={BookOpen} label={programLabel} />}
              {branchLabel && <Tag icon={GitBranch} label={branchLabel} />}
              {profile.yearOfStudy && (
                <Tag label={YEAR_LABELS[profile.yearOfStudy] ?? profile.yearOfStudy} />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CalendarDays size={11} />
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
                <span className="ml-1.5 text-xs text-muted-foreground">{tab.count}</span>
              )}
              {activeTab === tab.key && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="space-y-2.5 pb-10">

          {activeTab === "posts" && (
            threadsLoading
              ? <div className="space-y-2.5">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
              : userThreads.length > 0
                ? <div className="space-y-2.5">{userThreads.map(t => <ThreadCard key={t.$id} thread={t} />)}</div>
                : <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <p className="text-sm text-muted-foreground">No posts yet.</p>
                </div>
          )}

          {activeTab === "replies" && (
            repliesLoading
              ? <div className="space-y-2.5">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
              : userReplies.length > 0
                ? <div className="space-y-2.5">
                  {userReplies.map(reply => (
                    <ReplyCard key={reply.$id} reply={reply}
                      threadId={reply.threadId}
                      threadTitle={threadTitleMap[reply.threadId] ?? null} />
                  ))}
                </div>
                : <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <p className="text-sm text-muted-foreground">No replies yet.</p>
                </div>
          )}

          {activeTab === "saved" && (
            bookmarksLoading || bmThreadsLoading
              ? <div className="space-y-2.5">{[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}</div>
              : bookmarkedThreads.length > 0
                ? <div className="space-y-2.5">{bookmarkedThreads.map(t => <ThreadCard key={t.$id} thread={t} />)}</div>
                : <div className="rounded-2xl border border-dashed border-border py-12 text-center">
                  <Bookmark size={20} className="mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No saved posts yet.</p>
                </div>
          )}

        </div>
      </div>

      {/* ── Followers modal ── */}
      <FollowModal
        isOpen={modal === "followers"}
        onClose={() => setModal(null)}
        title={`Followers · ${displayProfile.followerCount ?? 0}`}
        userIds={followerIds}
        isLoading={followersLoading}
      />

      {/* ── Following modal ── */}
      <FollowModal
        isOpen={modal === "following"}
        onClose={() => setModal(null)}
        title={`Following · ${displayProfile.followingCount ?? 0}`}
        userIds={followingIds}
        isLoading={followingLoading}
      />

    </PageWrapper>
  )
}

export default UserProfile
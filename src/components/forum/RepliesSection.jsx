import CreateReplyBox from "./CreateReplyBox"
import Reply from "./Reply"
import { useRepliesContext } from "./RepliesProvider"
import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Search, Flame, TrendingUp, Clock, Zap, ChevronDown, X } from "lucide-react"

const AV = 28
const AV_H = AV / 2
const GAP = 8
const GUTTER = AV + GAP
const lc = "absolute bg-border rounded-full"

const sortReplies = (ids, byId, sortBy) => {
  return [...ids].sort((a, b) => {
    const ra = byId[a]
    const rb = byId[b]


    // Pinned always floats to top, regardless of sort
    if (ra?.isPinned && !rb?.isPinned) return -1
    if (!ra?.isPinned && rb?.isPinned) return 1

    if (ra?.deleted && !rb?.deleted) return 1
    if (!ra?.deleted && rb?.deleted) return -1

    const timeA = new Date(ra?.$createdAt ?? 0)
    const timeB = new Date(rb?.$createdAt ?? 0)

    switch (sortBy) {
      case "best": {
        // Net score + recency tiebreak
        const scoreA = (ra?.upvotes ?? 0) - (ra?.downvotes ?? 0)
        const scoreB = (rb?.upvotes ?? 0) - (rb?.downvotes ?? 0)
        return scoreB !== scoreA ? scoreB - scoreA : timeB - timeA
      }
      case "top": {
        // Pure net score
        const scoreA = (ra?.upvotes ?? 0) - (ra?.downvotes ?? 0)
        const scoreB = (rb?.upvotes ?? 0) - (rb?.downvotes ?? 0)
        return scoreB - scoreA
      }
      case "new":
        return timeB - timeA

      case "controversial": {
        // Real Reddit-style controversial:
        // High total votes AND near-equal up/down split ranks highest.
        // ratio = min(up,down) / total — closer to 0.5 = more controversial
        // weighted by total so low-engagement ties don't beat high-engagement
        const upA = ra?.upvotes ?? 0
        const downA = ra?.downvotes ?? 0
        const upB = rb?.upvotes ?? 0
        const downB = rb?.downvotes ?? 0
        const totalA = upA + downA
        const totalB = upB + downB
        const ratioA = totalA === 0 ? 0 : Math.min(upA, downA) / totalA
        const ratioB = totalB === 0 ? 0 : Math.min(upB, downB) / totalB
        // controversy score = closeness to 0.5 × total engagement
        const csA = ratioA * totalA
        const csB = ratioB * totalB
        return csB - csA
      }

      default:
        return timeB - timeA
    }
  })
}

const SORT_OPTIONS = [
  { key: "best", label: "Best", icon: Flame },
  { key: "top", label: "Top", icon: TrendingUp },
  { key: "new", label: "New", icon: Clock },
  { key: "controversial", label: "Controversial", icon: Zap },
]

// loading skeleton
function ReplySkeletonItem({ depth = 0, hasChild = false }) {
  const indent = depth * (AV + 8)
  return (
    <div className="flex flex-col animate-pulse" style={{ paddingLeft: indent }}>
      <div className="flex gap-2">
        {/* Avatar */}
        <div className="shrink-0 rounded-full bg-muted" style={{ width: AV, height: AV }} />

        {/* Body */}
        <div className="flex-1 min-w-0 pb-2 space-y-2">
          {/* Meta row: name + badge + time */}
          <div className="flex items-center gap-2 mt-1">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-3 w-10 rounded bg-muted/60" />
            <div className="h-3 w-8 rounded bg-muted/40" />
          </div>

          {/* Content lines */}
          <div className="space-y-1.5">
            <div className="h-3 rounded bg-muted w-full" />
            <div className="h-3 rounded bg-muted w-4/5" />
          </div>

          {/* Action bar: upvote + score + downvote + Reply */}
          <div className="flex items-center gap-2 -ml-1 mt-1">
            <div className="h-6 w-6 rounded-lg bg-muted/50" />
            <div className="h-3 w-4 rounded bg-muted/40" />
            <div className="h-6 w-6 rounded-lg bg-muted/50" />
            <div className="h-5 w-10 rounded-lg bg-muted/40 ml-1" />
          </div>
        </div>
      </div>

      {/* Child connector line + child skeleton */}
      {hasChild && (
        <div className="flex">
          <div className="relative shrink-0 self-stretch" style={{ width: AV + 8 }}>
            <div className="absolute bg-muted/40 rounded-full" style={{ width: 2, left: AV / 2 - 1, top: 0, bottom: 0 }} />
            <div className="absolute bg-muted/40 rounded-full" style={{ height: 2, left: AV / 2 - 1, top: AV / 2 - 1, width: (AV + 8) - (AV / 2 - 1) }} />
          </div>
          <div className="flex-1 min-w-0">
            <ReplySkeletonItem depth={0} hasChild={false} />
          </div>
        </div>
      )}
    </div>
  )
}

export function RepliesSkeleton() {
  return (
    <div className="space-y-4">
      {/* "N Replies" heading placeholder */}
      <div className="h-5 w-24 rounded bg-muted animate-pulse" />

      {/* CreateReplyBox placeholder */}
      <div className="h-11 w-full rounded-xl border border-border bg-muted/30 animate-pulse" />

      {/* Sort bar placeholder */}
      <div className="flex items-center gap-2 h-9">
        <div className="h-9 w-32 rounded-full border border-border bg-muted/30 animate-pulse" />
        <div className="h-9 w-9 rounded-full border border-border bg-muted/30 animate-pulse" />
      </div>

      {/* Reply skeletons — 3 root, first one has a child */}
      <ReplySkeletonItem hasChild={true} />
      <ReplySkeletonItem hasChild={false} />
      <ReplySkeletonItem hasChild={false} />
    </div>
  )
}

export default function RepliesSection({ threadAuthor, focusReplyId }) {
  const { replies, isLoading } = useRepliesContext()
  const navigate = useNavigate()
  const { threadId } = useParams()

  const [sortBy, setSortBy] = useState("best")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [searchActive, setSearchActive] = useState(false)
  const [search, setSearch] = useState("")

  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const isFocusMode = !!focusReplyId
  const currentSort = SORT_OPTIONS.find(o => o.key === sortBy)

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [dropdownOpen])

  useEffect(() => {
    if (searchActive) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchActive])

  const rootReplies = useMemo(() => {
    const raw = replies?.children?.[null] ?? []
    const sorted = sortReplies(raw, replies.byId, sortBy)
    if (!search.trim()) return sorted
    const q = search.trim().toLowerCase()
    return sorted.filter(id => {
      const r = replies.byId[id]
      return r?.content?.toLowerCase().includes(q) || r?.authorName?.toLowerCase().includes(q)
    })
  }, [replies, sortBy, search])

  const totalCount = Object.keys(replies?.byId ?? {}).length

  const focusChildren = focusReplyId ? replies.children?.[focusReplyId] ?? [] : []

  useEffect(() => {
    if (!focusReplyId) return
    document.getElementById(`reply-${focusReplyId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [focusReplyId])

  if (isLoading) return <RepliesSkeleton />

  /* ─── FULL THREAD ─── */
  if (!isFocusMode) {
    return (
      <div className="space-y-4">

        <h2 id="replies-section" className="text-lg font-semibold">
  {totalCount} {totalCount === 1 ? "Reply" : "Replies"}
</h2>

        <CreateReplyBox threadAuthor={threadAuthor} />

        <div className="flex items-center gap-2 h-9">

          <div
            ref={dropdownRef}
            className="relative shrink-0 transition-all duration-300 ease-in-out"
            style={{
              opacity: searchActive ? 0 : 1,
              maxWidth: searchActive ? 0 : 220,
              pointerEvents: searchActive ? "none" : "auto",
            }}
          >
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-1.5 px-3 h-9 rounded-full border border-border
                         text-sm font-semibold text-muted-foreground hover:text-foreground
                         hover:border-primary/50 transition-colors bg-background whitespace-nowrap"
            >
              <currentSort.icon size={13} />
              <span>Sort: {currentSort.label}</span>
              <ChevronDown size={13} className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div
                className="absolute top-full left-0 mt-1.5 w-48 z-[9999] rounded-xl border border-border
                           bg-background shadow-xl overflow-hidden origin-top-left"
                style={{ animation: "sortDrop 120ms ease forwards" }}
              >
                <style>{`
                  @keyframes sortDrop {
                    from { opacity:0; transform:scale(.95) translateY(-6px) }
                    to   { opacity:1; transform:scale(1)   translateY(0)    }
                  }
                `}</style>
                {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => { setSortBy(key); setDropdownOpen(false) }}
                    className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm
                                transition-colors hover:bg-muted text-left
                                ${sortBy === key ? "text-primary font-semibold" : "text-foreground"}`}
                  >
                    <Icon size={15} className={sortBy === key ? "text-primary" : "text-muted-foreground"} />
                    {label}
                    {sortBy === key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div
            className="relative flex items-center transition-all duration-300 ease-in-out"
            style={{ flex: searchActive ? 1 : "0 0 36px" }}
          >
            {!searchActive ? (
              <button
                onClick={() => { setDropdownOpen(false); setSearchActive(true) }}
                className="w-9 h-9 flex items-center justify-center rounded-full border border-border
                           text-muted-foreground hover:text-foreground hover:border-primary/50
                           transition-colors bg-background"
              >
                <Search size={15} />
              </button>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    ref={searchRef}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search comments..."
                    className="w-full h-9 pl-9 pr-8 text-sm rounded-full border border-primary
                               bg-background focus:outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X size={13} />
                    </button>
                  )}
                </div>
                <button onClick={() => { setSearchActive(false); setSearch("") }} className="text-sm font-medium text-muted-foreground hover:text-foreground shrink-0">
                  Cancel
                </button>
              </div>
            )}
          </div>

        </div>

        {rootReplies.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            {search.trim() ? `No comments match "${search}"` : "No replies yet. Be the first to help 👋"}
          </div>
        ) : rootReplies.map(id => (
          <Reply key={id} replyId={id} depth={0} threadAuthor={threadAuthor} />
        ))}

      </div>
    )
  }

  /* ─── FOCUSED THREAD ─── */
  const allItems = [
    { id: focusReplyId, type: "focus" },
    ...focusChildren.map(id => ({ id, type: "child" })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-2">
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-150" onClick={() => navigate(-1)}>
          <span>←</span><span>Single comment thread</span>
        </button>
        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-150" onClick={() => navigate(`/forum/${threadId}`)}>
          <span>View full discussion</span><span>→</span>
        </button>
      </div>
      <div className="flex flex-col">
        {allItems.map(({ id, type }, i) => {
          const isLast = i === allItems.length - 1
          const isFocused = type === "focus"
          return (
            <div key={id} className="flex">
              {i > 0 && (
                <div className="relative shrink-0 self-stretch" style={{ width: GUTTER }}>
                  <div className={lc} style={{ width: 2, left: AV_H - 1, top: 0, ...(isLast ? { height: AV_H } : { bottom: 0 }) }} />
                  <div className={lc} style={{ height: 2, left: AV_H - 1, top: AV_H - 1, width: GUTTER - (AV_H - 1) }} />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className={isFocused ? "bg-primary/8 rounded-r-md" : ""}>
                  <Reply replyId={id} depth={i} threadAuthor={threadAuthor} disableChildren={type !== "child"} disableDepthLimit />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
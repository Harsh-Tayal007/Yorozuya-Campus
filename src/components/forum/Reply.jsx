// =============================================================================
// Reply.jsx - Threaded comments with mobile support
// =============================================================================

import React, { useState, useRef, useCallback, useContext } from "react"
import { ArrowBigUp, ArrowBigDown, Pin, MoreVertical, Shield, Star, Pencil as PencilIcon } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useNavigate, useParams, Link } from "react-router-dom"

import { fmt, fmtVotes, initials } from "@/utils/replyUtils"
import GlowCtx from "@/context/GlowContext"
import { useIsMobile } from "@/hooks/use-mobile"

import useReplyActions from "@/hooks/useReplyActions"

import DesktopReplyBox from "./DesktopReplyBox"
import MobileReplyModal from "./MobileReplyModal"
import OptionsMenu from "./OptionsMenu"
import useVote from "@/hooks/useVote"

import useComposeState from "@/hooks/useComposeState"
import { useRepliesContext } from "./RepliesProvider"
import ReplyMedia from "./ReplyMedia"
import { deleteCloudinaryImage } from "@/lib/deleteCloudinaryImage"
import ReplyContent from "./ReplyContent"
import TiptapEditor from "./TiptapEditor"
import useHashHighlight from "@/hooks/useHashHighlight"
import ReportModal from "@/components/forum/ReportModal"
import { logReplyDeleted } from "@/services/admin/auditLogService"

// =============================================================================
// CONSTANTS
// =============================================================================
const AV = 28
const AV_H = AV / 2
const GAP = 8
const GUTTER = AV + GAP
const MAX_DEPTH_DESKTOP = 5
const MAX_DEPTH_MOBILE = 3

// =============================================================================
// FLAIR CONFIG
// =============================================================================
const FLAIR_CONFIG = {
  admin: {
    label: "Admin",
    icon: Shield,
    className: "bg-red-500/10 text-red-500 border border-red-500/20",
  },
  moderator: {
    label: "Mod",
    icon: Star,
    className: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
  },
  editor: {
    label: "Editor",
    icon: PencilIcon,
    className: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
  },
}

function RoleFlair({ role }) {
  const config = FLAIR_CONFIG[role]
  if (!config) return null
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-px rounded-md ${config.className}`}>
      <Icon size={8} />
      {config.label}
    </span>
  )
}

// =============================================================================
// AVATAR - image or initials, optionally wrapped in a profile link
// =============================================================================
function ReplyAvatar({ authorName, avatarUrl, username, size = AV, glow, isMobile }) {
  const baseClass = `rounded-full flex items-center justify-center font-bold
                     shrink-0 z-10 select-none transition-all duration-200
                     ${glow && !isMobile ? "ring-2 ring-primary/40" : ""}`

  const inner = avatarUrl ? (
    <img
      src={avatarUrl}
      alt={authorName}
      className={`${baseClass} object-cover`}
      style={{ width: size, height: size }}
      onError={(e) => { e.currentTarget.style.display = "none" }}
    />
  ) : (
    <div
      className={`${baseClass} bg-muted text-foreground`}
      style={{ width: size, height: size, fontSize: 10 }}
    >
      {initials(authorName)}
    </div>
  )

  if (username) {
    return (
      <Link
        to={`/profile/${username}`}
        onClick={e => e.stopPropagation()}
        className="hover:opacity-80 transition-opacity"
      >
        {inner}
      </Link>
    )
  }

  return inner
}

// =============================================================================
// REPLY
// =============================================================================
const Reply = ({
  replyId,
  depth = 0,
  threadAuthor,
  disableChildren = false,
  disableDepthLimit = false
}) => {

  const { replies, pinnedReplyId, authorRoles, votesMap, updateVote } = useRepliesContext()
  const { user, hasPermission } = useAuth()
  const notifyParent = useContext(GlowCtx)
  const isMobile = useIsMobile()
  const { threadId } = useParams()
  const navigate = useNavigate()

  const [showReplyBox, setShowReplyBox] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    const r = replies?.byId?.[replyId]
    return r?.deleted === true
  })
  const [glow, setGlow] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(() => replies?.byId?.[replyId]?.content ?? "")
  const [reportTarget, setReportTarget] = useState(null)

  const dotsRef = useRef(null)

  const reply = replies?.byId?.[replyId]

  const { vote, score, handleVote } = useVote(
    replies?.byId?.[replyId]?.upvotes ?? 0,
    replies?.byId?.[replyId]?.downvotes ?? 0,
    replyId,
    votesMap?.[replyId]?.vote ?? null,
    votesMap?.[replyId]?.voteDocId ?? null,
    updateVote,
    reply?.authorId   // ← pass author for karma update
  )

  const composeState = useComposeState()
  const { createReply, deleteReply, updateReply, pinReply, unpinReply } = useReplyActions(threadId)

  const children = replies.children[replyId] ?? []

  const isDeleted = reply?.deleted === true
  const hasChildren = children.length > 0
  const isPinned = reply?.isPinned === true
  const isOwn = user?.$id === reply?.authorId
  const isOP = reply?.authorId === threadAuthor
  const canPin = (hasPermission("pin:reply") || isOP) && depth === 0

  const canAdminDelete = !isOwn && (
    hasPermission("resolve:reports") ||   // moderators
    hasPermission("manage:users")         // admins
  )

  const isHighlighted = useHashHighlight(reply.$id)

  // Author info - { role, avatarUrl, username }
  const authorInfo = authorRoles?.[reply?.authorId] ?? null
  const authorRole = authorInfo?.role ?? null
  const authorAvatar = authorInfo?.avatarUrl ?? null
  const authorUsername = authorInfo?.username ?? null
  const authorDisplayName = authorUsername ?? reply?.authorName
  const showFlair = authorRole && authorRole !== "user"

  const maxDepth = isMobile ? MAX_DEPTH_MOBILE : MAX_DEPTH_DESKTOP
  const isTooDeep = !disableDepthLimit && depth >= maxDepth
  const shouldShowChildren = hasChildren && !collapsed && !isDeleted

  const lc = `absolute rounded-full transition-colors duration-200 ${glow && !isMobile ? "bg-primary" : "bg-border"}`

  const gifMaxWidth = isMobile
    ? Math.max(140, 220 - depth * 35)
    : Math.max(220, 320 - depth * 40)

  const onEnter = useCallback(() => {
    if (isMobile || depth === 0) return
    setGlow(true); notifyParent?.(true)
  }, [isMobile, depth, notifyParent])

  const onLeave = useCallback(() => {
    if (isMobile || depth === 0) return
    setGlow(false); notifyParent?.(false)
  }, [isMobile, depth, notifyParent])

  const childGlowCb = useCallback((on) => {
    setGlow(on); notifyParent?.(on)
  }, [notifyParent])

  const handleReport = useCallback(() => {
    setShowOptions(false)   // ← add this line
    setReportTarget({
      targetType: "reply",
      targetId: reply.$id,
      targetAuthorId: reply.authorId,
      targetAuthorUsername: authorDisplayName,
      contentPreview: reply.content?.replace(/<[^>]+>/g, " ").slice(0, 200),
      threadId,
    })
  }, [reply, authorDisplayName, threadId])

  const handleSubmit = useCallback((text, gifUrl, imageUrl) => {
    if (!text.trim() && !gifUrl && !imageUrl) return
    createReply.mutate({
      threadId, content: text, gifUrl, imageUrl,
      imagePublicId: composeState.uploadedImagePublicId,
      authorId: user.$id, authorName: user.username,
      parentReplyId: reply.$id ?? reply.id,
      parentAuthorId: reply?.authorId ?? null,
      threadAuthorId: threadAuthor,
      actorAvatar: user.avatarUrl ?? null,
      actorUsername: user.username ?? null,

    })
    console.log("submit debug:", {
      parentAuthorId: reply?.authorId ?? null,
      threadAuthorId: threadAuthor,
    })
  }, [createReply, threadId, user, reply, composeState, threadAuthor])

  const handleDelete = useCallback(async () => {
    const id = reply.$id ?? reply.id
    const replyHasChildren = (replies.children?.[id] ?? []).length > 0
    await deleteCloudinaryImage(reply.imagePublicId)
    await deleteReply.mutateAsync({
      replyId: id,
      hasChildren: replyHasChildren,
      modDeleted: canAdminDelete,
    })
    // Log to activity if this was a mod/admin action on someone else's reply
    if (canAdminDelete && user) {
      logReplyDeleted({
        actor: { $id: user.$id, username: user.username },
        targetUsername: authorDisplayName,
        replyId: id,
        threadId,
      }).catch(() => { })
    }
    setShowOptions(false)
  }, [reply, deleteReply, replies.children, canAdminDelete, user, authorDisplayName, threadId])

  const handleEditSave = useCallback(() => {
    if (!editText.trim()) return
    const id = reply.$id ?? reply.id
    updateReply.mutate({ id, content: editText })
    setEditing(false)
  }, [editText, reply, updateReply])

  const handlePin = useCallback(async () => {
    const id = reply.$id ?? reply.id
    if (isPinned) {
      await unpinReply.mutateAsync({ replyId: id, threadId })
    } else {
      const scrollY = window.scrollY
      await pinReply.mutateAsync({ replyId: id, threadId, currentPinnedReplyId: pinnedReplyId })
      window.scrollTo({ top: scrollY, behavior: "instant" })
      setTimeout(() => {
        document.getElementById("replies-section")?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    }
    setShowOptions(false)
  }, [reply, isPinned, pinReply, unpinReply, threadId, pinnedReplyId])

  if (!reply) return null

  return (
    <GlowCtx.Provider value={childGlowCb}>

      {showReplyBox && isMobile && (
        <MobileReplyModal
          replyingTo={{ ...reply, authorName: authorDisplayName }}
          onSubmit={handleSubmit}
          onClose={() => setShowReplyBox(false)}
        />
      )}

      <div id={`reply-${reply.$id}`} className={`flex flex-col transition-colors duration-700
              ${isHighlighted ? "bg-primary/10 rounded-xl" : ""}`}>

        <div className="flex" style={{ gap: GAP }} onMouseEnter={onEnter} onMouseLeave={onLeave}>

          {/* AVATAR COLUMN */}
          <div className="relative shrink-0 flex flex-col items-center" style={{ width: AV }}>
            <ReplyAvatar
              authorName={authorDisplayName}
              avatarUrl={authorAvatar}
              username={authorUsername}
              size={AV}
              glow={glow}
              isMobile={isMobile}
            />

            {shouldShowChildren && (
              <button
                className="flex-1 w-full flex justify-center pt-px group/vbar cursor-pointer"
                onClick={() => setCollapsed(true)}
                title="Collapse"
                style={{ width: AV }}
              >
                <div className={`w-0.5 h-full rounded-full transition-colors duration-200
                                 ${glow && !isMobile ? "bg-primary" : "bg-border group-hover/vbar:bg-primary/50"}`} />
              </button>
            )}
          </div>

          {/* BODY */}
          <div className="flex-1 min-w-0 pb-1">

            {/* META ROW */}
            <div className="flex items-center gap-1.5 flex-wrap mb-px">

              {/* Author name - clickable to profile */}
              {authorUsername ? (
                <Link
                  to={`/profile/${authorUsername}`}
                  onClick={e => e.stopPropagation()}
                  className="font-semibold text-sm leading-snug hover:text-primary
                             hover:underline transition-colors"
                >
                  {authorDisplayName}
                </Link>
              ) : (
                <span className="font-semibold text-sm leading-snug">{authorDisplayName}</span>
              )}

              {showFlair && <RoleFlair role={authorRole} />}

              {isOP && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-px rounded-md font-semibold">
                  OP
                </span>
              )}

              {isPinned && (
                <span className="text-[10px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-px rounded-md flex items-center gap-0.5">
                  <Pin size={8} /> Pinned
                </span>
              )}

              <span className="text-muted-foreground text-[11px]">· {fmt(reply.$createdAt)}</span>
            </div>

            {/* Collapsed */}
            {collapsed ? (
              <button
                className="text-xs text-muted-foreground hover:text-primary transition-colors py-0.5"
                onClick={() => setCollapsed(false)}
              >
                {isDeleted
                  ? "deleted · tap to expand"
                  : `${children.length} ${children.length === 1 ? "reply" : "replies"} hidden · tap to expand`
                }
              </button>
            ) : (
              <>
                {editing ? (
                  <div className="mt-1 mb-1">
                    <div className="rounded-lg border border-border bg-muted/10 overflow-hidden">
                      <TiptapEditor
                        content={editText}
                        onChange={setEditText}
                        onSubmit={handleEditSave}
                        placeholder="Edit your reply…"
                        autoFocus
                      />
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <button onClick={handleEditSave}
                        className="rounded-full px-3 py-1 text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        Save
                      </button>
                      <button onClick={() => { setEditing(false); setEditText(reply.content) }}
                        className="rounded-full px-3 py-1 text-[11px] font-semibold text-muted-foreground border border-border hover:bg-muted/50 transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reply.deleted ? (
                      <p className="text-sm leading-relaxed text-foreground/85 break-words">
                        {reply.modDeleted ? "[deleted by mods]" : "[deleted]"}
                      </p>
                    ) : (
                      <>
                        {reply.content && <ReplyContent content={reply.content} />}
                        <ReplyMedia
                          gifUrl={reply.gifUrl}
                          imageUrl={reply.imageUrl}
                          deleted={reply.deleted}
                          maxWidth={gifMaxWidth}
                        />
                      </>
                    )}
                  </div>
                )}

                {showOptions && (
                  <OptionsMenu
                    reply={reply}
                    authorName={authorDisplayName}
                    isOwn={isOwn}
                    canPin={canPin}
                    canAdminDelete={canAdminDelete}   // ← ADD THIS LINE
                    onPin={handlePin}
                    anchorRef={dotsRef}
                    onCollapse={() => setCollapsed(true)}
                    onDelete={handleDelete}
                    onEdit={() => { setEditing(true); setShowOptions(false) }}
                    onClose={() => setShowOptions(false)}
                    onReport={handleReport}
                    threadId={threadId}
                  />
                )}

                {/* ACTION BAR */}
                <div className="flex items-center -ml-1 mt-px gap-x-0">
                  <div className="flex items-center gap-0.5">
                    <button
                      disabled={isDeleted}
                      onClick={() => { if (isDeleted) return; handleVote("up") }}
                      className={`relative p-1 rounded-lg transition-all duration-150 active:scale-75
                        ${isDeleted ? "text-muted-foreground/40 cursor-not-allowed"
                          : vote === "up" ? "text-red-500 bg-red-500/10"
                            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"}`}
                    >
                      <ArrowBigUp size={18} className="transition-transform duration-150"
                        style={{ fill: vote === "up" ? "currentColor" : "none" }} />
                    </button>

                    <span className={`text-xs font-bold min-w-[20px] text-center tabular-nums select-none transition-colors duration-150
                      ${vote === "up" ? "text-red-500" : vote === "down" ? "text-blue-500" : "text-muted-foreground"}`}>
                      {fmtVotes(score)}
                    </span>

                    <button
                      disabled={isDeleted}
                      onClick={() => { if (isDeleted) return; handleVote("down") }}
                      className={`relative p-1 rounded-lg transition-all duration-150 active:scale-75
                        ${isDeleted ? "text-muted-foreground/40 cursor-not-allowed"
                          : vote === "down" ? "text-blue-500 bg-blue-500/10"
                            : "text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"}`}
                    >
                      <ArrowBigDown size={18} className="transition-transform duration-150"
                        style={{ fill: vote === "down" ? "currentColor" : "none" }} />
                    </button>
                  </div>

                  <button
                    disabled={isDeleted}
                    onClick={() => { if (isDeleted) return; setShowReplyBox(v => !v) }}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg transition-colors duration-150 active:scale-95
                      ${isDeleted ? "text-muted-foreground/40 cursor-not-allowed"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    Reply
                  </button>

                  <button
                    ref={dotsRef}
                    disabled={isDeleted}
                    onClick={() => { if (isDeleted) return; setShowOptions(v => !v) }}
                    className={`p-1.5 rounded-lg transition-colors duration-150 ml-0.5 active:scale-95
                      ${isDeleted ? "text-muted-foreground/40 cursor-not-allowed"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>

                {showReplyBox && !isMobile && !isDeleted && (
                  <DesktopReplyBox
                    cs={composeState}
                    onSubmit={handleSubmit}
                    onCancel={() => setShowReplyBox(false)}
                  />
                )}
              </>
            )}
          </div>
        </div>

        {/* CHILDREN */}
        {!disableChildren && shouldShowChildren && !isTooDeep && (
          <div className="flex flex-col">
            {children.map((childId, i) => {
              const isLast = i === children.length - 1
              return (
                <div key={childId} className="flex">
                  <div className="relative shrink-0 self-stretch" style={{ width: GUTTER }}>
                    <div className={lc} style={{ width: 2, left: AV_H - 1, top: 0, ...(isLast ? { height: AV_H } : { bottom: 0 }) }} />
                    <div className={lc} style={{ height: 2, left: AV_H - 1, top: AV_H - 1, width: GUTTER - (AV_H - 1) }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Reply replyId={childId} depth={depth + 1} threadAuthor={threadAuthor} />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CONTINUE THREAD */}
        {isTooDeep && shouldShowChildren && (
          <div style={{ paddingLeft: GUTTER }}>
            <button
              className="text-xs font-semibold text-primary hover:underline mt-0.5 mb-1"
              onClick={() => navigate(`/forum/${threadId}?focus=${reply.$id}`)}
            >
              Continue this thread →
            </button>
          </div>
        )}

      </div>

      <ReportModal
        isOpen={!!reportTarget}
        onClose={() => setReportTarget(null)}
        target={reportTarget}
      />
    </GlowCtx.Provider>
  )
}

export default React.memo(Reply)

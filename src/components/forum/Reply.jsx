// =============================================================================
// Reply.jsx — Threaded comments with mobile support
// Sections: CONSTANTS → CONTEXT → HOOKS → HELPERS → COMPOSE STATE →
//           GIF PICKER → OPTIONS MENU → MOBILE MODAL → DESKTOP BOX → TOP BOX → REPLY
// =============================================================================

import React, { useState, useRef, useCallback, useContext } from "react"
import { ArrowBigUp, ArrowBigDown, Pin, MoreVertical } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useNavigate, useParams } from "react-router-dom"

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

// =============================================================================
// CONSTANTS
// Thread line geometry: AV=28, AV_H=14, GAP=8, GUTTER=36
// Bar x = AV_H-1 = 13px inside both avatar-col and child gutter → same absolute x ✓
// =============================================================================
const AV = 28
const AV_H = AV / 2
const GAP = 8
const GUTTER = AV + GAP
const MAX_DEPTH_DESKTOP = 5
const MAX_DEPTH_MOBILE = 3


// =============================================================================
// REPLY — recursive threaded comment component
// =============================================================================
const Reply = ({
  replyId,
  depth = 0,
  threadAuthor,
  disableChildren = false,
  disableDepthLimit = false
}) => {

  // ─── ALL HOOKS FIRST — no exceptions ──────────────────────────────────────
  const { replies, pinnedReplyId } = useRepliesContext()
  const { user, hasPermission } = useAuth()           // ← moved up before any use
  const notifyParent = useContext(GlowCtx)
  const isMobile = useIsMobile()
  const { threadId } = useParams()
  const navigate = useNavigate()

  const [showReplyBox, setShowReplyBox] = useState(false)
  const [collapsed, setCollapsed] = useState(() => {
    // lazy initializer — avoids depending on isDeleted before hooks
    const r = replies?.byId?.[replyId]
    return r?.deleted === true
  })
  const [glow, setGlow] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(() => replies?.byId?.[replyId]?.content ?? "")

  const dotsRef = useRef(null)

  const { vote, score, handleVote, loading } = useVote(
    replies?.byId?.[replyId]?.upvotes ?? 0,
    replies?.byId?.[replyId]?.downvotes ?? 0,
    replyId
  )
  const composeState = useComposeState()
  const { createReply, deleteReply, updateReply, pinReply, unpinReply } = useReplyActions(threadId)

  // ─── Derived values (safe — all hooks are above) ──────────────────────────
  const reply = replies?.byId?.[replyId]
  const children = replies.children[replyId] ?? []

  const isDeleted = reply?.deleted === true
  const hasChildren = children.length > 0
  const isPinned = reply?.isPinned === true
  const isOwn = user?.$id === reply?.authorId
  const isOP = reply?.authorName?.trim().toLowerCase() === threadAuthor?.trim().toLowerCase()
  const canPin = (hasPermission("pin:reply") || isOP) && depth === 0

  const maxDepth = isMobile ? MAX_DEPTH_MOBILE : MAX_DEPTH_DESKTOP
  const isTooDeep = !disableDepthLimit && depth >= maxDepth
  const shouldShowChildren = hasChildren && !collapsed && !isDeleted

  const lc = `absolute rounded-full transition-colors duration-200 ${glow && !isMobile ? "bg-primary" : "bg-border"}`

  const gifMaxWidth = isMobile
    ? Math.max(140, 220 - depth * 35)
    : Math.max(220, 320 - depth * 40)

  // ─── Callbacks ────────────────────────────────────────────────────────────
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

  const handleSubmit = useCallback((text, gifUrl, imageUrl) => {
    if (!text.trim() && !gifUrl && !imageUrl) return
    createReply.mutate({
      threadId,
      content: text,
      gifUrl,
      imageUrl,
      imagePublicId: composeState.uploadedImagePublicId,
      authorId: user.$id,
      authorName: user.username,
      parentReplyId: reply.$id ?? reply.id,
    })
  }, [createReply, threadId, user, reply, composeState])

  const handleDelete = useCallback(async () => {
    const id = reply.$id ?? reply.id
    const publicId = reply.imagePublicId
    const replyHasChildren = (replies.children?.[id] ?? []).length > 0
    await deleteCloudinaryImage(publicId)
    await deleteReply.mutateAsync({ replyId: id, hasChildren: replyHasChildren })
    setShowOptions(false)
  }, [reply, deleteReply, replies.children])

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

      // Server updated + cache invalidated + React re-rendered — now snap back
      window.scrollTo({ top: scrollY, behavior: "instant" })

      setTimeout(() => {
        document.getElementById("replies-section")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        })
      }, 100)
    }
    setShowOptions(false)
  }, [reply, isPinned, pinReply, unpinReply, threadId, pinnedReplyId])

  // ─── Guard — after all hooks ───────────────────────────────────────────────
  if (!reply) return null

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <GlowCtx.Provider value={childGlowCb}>

      {/* Mobile reply modal */}
      {showReplyBox && isMobile && (
        <MobileReplyModal
          replyingTo={reply}
          onSubmit={handleSubmit}
          onClose={() => setShowReplyBox(false)}
        />
      )}

      <div id={`reply-${reply.$id}`} className="flex flex-col">

        {/* MAIN ROW */}
        <div className="flex" style={{ gap: GAP }} onMouseEnter={onEnter} onMouseLeave={onLeave}>

          {/* AVATAR COLUMN */}
          <div className="relative shrink-0 flex flex-col items-center" style={{ width: AV }}>
            <div
              className={`rounded-full bg-muted flex items-center justify-center font-bold
                          shrink-0 z-10 select-none transition-all duration-200
                          ${glow && !isMobile ? "ring-2 ring-primary/40" : ""}`}
              style={{ width: AV, height: AV, fontSize: 10 }}
            >
              {initials(reply.authorName)}
            </div>

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

            {/* Meta */}
            <div className="flex items-center gap-1.5 flex-wrap mb-px">
              <span className="font-semibold text-sm leading-snug">{reply.authorName}</span>
              {isOP && (
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-px rounded-md">OP</span>
              )}
              {isPinned && (
                <span className="text-[10px] bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-1.5 py-px rounded-md flex items-center gap-0.5">
                  <Pin size={8} /> Pinned
                </span>
              )}
              <span className="text-muted-foreground text-[11px]">· {fmt(reply.$createdAt)}</span>
            </div>

            {/* Collapsed state */}
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
                {/* EDIT MODE */}
                {editing ? (
                  <div className="mt-1 mb-1">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full rounded-lg border border-border bg-muted/10 text-sm p-2
                                 resize-none outline-none focus:border-primary transition-colors"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button
                        onClick={handleEditSave}
                        className="rounded-full px-3 py-1 text-[11px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setEditing(false); setEditText(reply.content) }}
                        className="rounded-full px-3 py-1 text-[11px] font-semibold text-muted-foreground border border-border hover:bg-muted/50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reply.deleted ? (
                      <p className="text-sm leading-relaxed text-foreground/85 break-words">[deleted]</p>
                    ) : (
                      <>
                        {reply.content && (
                          <p className="text-sm leading-relaxed text-foreground/85 break-words">
                            {reply.content}
                          </p>
                        )}
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

                {/* OPTIONS MENU */}
                {showOptions && (
                  <OptionsMenu
                    reply={reply}
                    isOwn={isOwn}
                    canPin={canPin}
                    onPin={handlePin}
                    anchorRef={dotsRef}
                    onCollapse={() => setCollapsed(true)}
                    onDelete={handleDelete}
                    onEdit={() => { setEditing(true); setShowOptions(false) }}
                    onClose={() => setShowOptions(false)}
                  />
                )}

                {/* ACTION BAR — vote · reply · ⋮ */}
                <div className="flex items-center -ml-1 mt-px gap-x-0">
                  <div className="flex items-center gap-0.5">

                    {/* UPVOTE */}
                    <button
                      disabled={isDeleted}
                      onClick={() => { if (isDeleted) return; handleVote("up") }}
                      className={`
                        relative p-1 rounded-lg transition-all duration-150 active:scale-75
                        ${isDeleted
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : vote === "up"
                            ? "text-red-500 bg-red-500/10"
                            : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                        }
                      `}
                    >
                      <ArrowBigUp
                        size={18}
                        className="transition-transform duration-150"
                        style={{ fill: vote === "up" ? "currentColor" : "none" }}
                      />
                    </button>

                    {/* SCORE */}
                    <span className={`
                      text-xs font-bold min-w-[20px] text-center tabular-nums select-none
                      transition-colors duration-150
                      ${vote === "up" ? "text-red-500" : vote === "down" ? "text-blue-500" : "text-muted-foreground"}
                    `}>
                      {fmtVotes(score)}
                    </span>

                    {/* DOWNVOTE */}
                    <button
                      disabled={isDeleted}
                      onClick={() => { if (isDeleted) return; handleVote("down") }}
                      className={`
                        relative p-1 rounded-lg transition-all duration-150 active:scale-75
                        ${isDeleted
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : vote === "down"
                            ? "text-blue-500 bg-blue-500/10"
                            : "text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10"
                        }
                      `}
                    >
                      <ArrowBigDown
                        size={18}
                        className="transition-transform duration-150"
                        style={{ fill: vote === "down" ? "currentColor" : "none" }}
                      />
                    </button>

                  </div>

                  <button
                    disabled={isDeleted}
                    onClick={() => { if (isDeleted) return; setShowReplyBox(v => !v) }}
                    className={`
                      text-[11px] font-semibold px-2 py-1 rounded-lg
                      transition-colors duration-150 active:scale-95
                      ${isDeleted
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    Reply
                  </button>

                  <button
                    ref={dotsRef}
                    disabled={isDeleted}
                    onClick={() => { if (isDeleted) return; setShowOptions(v => !v) }}
                    className={`
                      p-1.5 rounded-lg transition-colors duration-150 ml-0.5 active:scale-95
                      ${isDeleted
                        ? "text-muted-foreground/40 cursor-not-allowed"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }
                    `}
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>

                {/* Desktop inline reply box */}
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
                    <div
                      className={lc}
                      style={{
                        width: 2,
                        left: AV_H - 1,
                        top: 0,
                        ...(isLast ? { height: AV_H } : { bottom: 0 }),
                      }}
                    />
                    <div
                      className={lc}
                      style={{
                        height: 2,
                        left: AV_H - 1,
                        top: AV_H - 1,
                        width: GUTTER - (AV_H - 1),
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Reply
                      replyId={childId}
                      depth={depth + 1}
                      threadAuthor={threadAuthor}
                    />
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
    </GlowCtx.Provider>
  )
}

export default React.memo(Reply)
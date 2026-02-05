import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowBigUp,
  ArrowBigDown,
  Image as ImageIcon,
  X,
  Pin,
} from "lucide-react"

const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

const formatVotes = (count) => {
  if (count < 1000) return count
  if (count < 1_000_000)
    return (count / 1000).toFixed(1).replace(".0", "") + "k"
  return (count / 1_000_000).toFixed(1).replace(".0", "") + "M"
}

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

const Reply = ({ reply, depth = 0, replyingTo, threadAuthor }) => {
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const isOP =
    reply.author?.trim().toLowerCase() ===
    threadAuthor?.trim().toLowerCase()

  const isPinned = reply.isPinned === true

  const [vote, setVote] = useState(null)
  const [score, setScore] = useState(reply.upvotes ?? 0)

  const hasChildren = reply.replies?.length > 0

  const handleVote = (type) => {
    if (vote === type) {
      setVote(null)
      setScore((s) => s + (type === "up" ? -1 : 1))
    } else {
      if (vote === "up") setScore((s) => s - 1)
      if (vote === "down") setScore((s) => s + 1)
      setVote(type)
      setScore((s) => s + (type === "up" ? 1 : -1))
    }
  }

  return (
    <div
      className={`relative pl-4 ${depth > 0 ? "ml-6 border-l border-border" : ""}`}
      style={{ marginLeft: Math.min(depth * 12, 48) }}
    >
      <div
        className={`
          py-3 px-3 rounded-md transition-colors hover:bg-muted/50
          ${
            isPinned
              ? "bg-yellow-50 border border-yellow-200"
              : isOP
              ? "bg-primary/5"
              : depth === 0
              ? "bg-muted/40"
              : "bg-muted/25"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          {reply.authorAvatar ? (
            <img
              src={reply.authorAvatar}
              alt={reply.author}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
              {getInitials(reply.author)}
            </div>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{reply.author}</span>

              {isOP && (
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                  OP
                </span>
              )}

              {isPinned && (
                <span className="flex items-center gap-1 rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700">
                  <Pin size={10} /> Pinned
                </span>
              )}

              <span className="text-muted-foreground text-xs">
                • {formatDateTime(reply.createdAt)}
              </span>
            </div>

            {replyingTo && (
              <span className="text-xs text-muted-foreground">
                Replying to <span className="font-medium">@{replyingTo}</span>
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
          {reply.content}
        </p>

        {/* Actions */}
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleVote("up")}
              className={`p-1 rounded hover:bg-red-100/40 ${
                vote === "up" ? "text-red-500" : ""
              }`}
            >
              <ArrowBigUp size={18} />
            </button>

            <span className="min-w-7 text-center font-medium text-sm">
              {formatVotes(score)}
            </span>

            <button
              onClick={() => handleVote("down")}
              className={`p-1 rounded hover:bg-blue-100/40 ${
                vote === "down" ? "text-blue-500" : ""
              }`}
            >
              <ArrowBigDown size={18} />
            </button>
          </div>

          <button
            onClick={() => setShowReplyBox((v) => !v)}
            className="hover:underline"
          >
            Reply
          </button>

          {hasChildren && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="hover:underline"
            >
              {expanded
                ? "Hide replies"
                : `View ${reply.replies.length} replies`}
            </button>
          )}

          {/* Future pin action (disabled) */}
          <button
            disabled
            className="cursor-not-allowed text-muted-foreground/60"
          >
            Pin
          </button>
        </div>

        {/* Reply box */}
        {showReplyBox && (
          <div className="mt-3 space-y-2">
            <Textarea placeholder="Write a reply…" rows={3} />

            <div className="flex items-center gap-3 text-muted-foreground">
              <ImageIcon size={16} />
              <button
                onClick={() => setShowGifPicker((v) => !v)}
                className="text-xs font-medium hover:text-foreground"
              >
                GIF
              </button>
            </div>

            {showGifPicker && (
              <div className="mt-2 rounded-md border bg-muted/30 p-3">
                <div className="flex justify-between mb-2 text-xs font-medium">
                  GIFs (Powered by Tenor / GIPHY)
                  <button onClick={() => setShowGifPicker(false)}>
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded bg-muted flex items-center justify-center text-xs"
                    >
                      GIF
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm">Reply</Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowReplyBox(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Nested replies */}
      {expanded && !hasChildren && (
        <div className="ml-6 mt-2 text-xs text-muted-foreground">
          No replies yet.
        </div>
      )}

      {hasChildren && (
        <div
          className={`mt-2 space-y-2 overflow-hidden transition-all duration-300 ${
            expanded ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {reply.replies.map((child) => (
            <Reply
              key={child.id}
              reply={child}
              depth={depth + 1}
              replyingTo={reply.author}
              threadAuthor={threadAuthor}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Reply

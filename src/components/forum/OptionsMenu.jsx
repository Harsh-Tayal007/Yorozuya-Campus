// =============================================================================
// OPTIONS MENU
// Desktop: small positioned dropdown (like Reddit web, Image 1)
// Mobile:  bottom sheet (like Reddit app)
// Props: reply, authorName, isOwn, canPin, canAdminDelete, onPin, anchorRef,
//        onCollapse, onDelete, onEdit, onClose, onReport, threadId
// =============================================================================

import { useIsMobile } from "@/hooks/use-mobile"
import useResolvedColors from "@/hooks/useResolvedColors"
import { ChevronsDownUp, Copy, Link2, Pencil, Trash2, Pin, PinOff, Flag, ShieldX } from "lucide-react"
import { copyShareLink } from "@/utils/share"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"


export function OptionsMenu({
  reply,
  authorName,
  isOwn,
  canPin,
  canAdminDelete,   // ← NEW: true when viewer is admin/mod but not the author
  onPin,
  anchorRef,
  onCollapse,
  onDelete,
  onEdit,
  onClose,
  onReport,
  threadId,
}) {

  const colors  = useResolvedColors()
  const isMobile = useIsMobile()
  const menuRef  = useRef(null)
  const displayAuthorName = authorName ?? reply?.authorName

  // Lock body scroll on mobile sheet
  useEffect(() => {
    if (!isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [isMobile])

  // Close on outside click (desktop)
  useEffect(() => {
    if (isMobile) return
    const handler = (e) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target) &&
        anchorRef?.current && !anchorRef.current.contains(e.target)
      ) { onClose() }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [isMobile, onClose, anchorRef])

  // Desktop: compute position from anchor button
  const [pos, setPos]     = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (isMobile || !anchorRef?.current) return
    const updatePos = () => {
      const r      = anchorRef.current.getBoundingClientRect()
      const menuW  = 230
      const menuH  = 240
      const padding = 8
      let left = r.right - menuW
      left = Math.max(padding, Math.min(left, window.innerWidth - menuW - padding))
      let top = r.bottom + 4
      if (top + menuH > window.innerHeight) top = r.top - menuH - 4
      setPos({ top, left })
      setReady(true)
    }
    updatePos()
    window.addEventListener("scroll", updatePos, true)
    window.addEventListener("resize", updatePos)
    return () => {
      window.removeEventListener("scroll", updatePos, true)
      window.removeEventListener("resize", updatePos)
    }
  }, [isMobile, anchorRef])

  if (!isMobile && (!pos || !ready)) return null

  const handleCopyText = () => {
    if (!reply?.content) return
    navigator.clipboard.writeText(reply.content)
    onClose()
  }

  // Shared Row component
  const Row = ({ icon: Icon, label, onClick, danger, highlight, subtle }) => {
    const rowStyle = isMobile
      ? {
          display: "flex", alignItems: "center", gap: 16, width: "100%", height: 52,
          background: "none", border: "none", cursor: "pointer", padding: "0 20px",
          textAlign: "left",
          color: danger ? "#ef4444" : highlight ? "#eab308" : subtle ? "#f97316" : "inherit",
          fontSize: 16,
        }
      : {
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          background: "none", border: "none", cursor: "pointer",
          padding: "9px 14px", textAlign: "left",
          color: danger ? "#ef4444" : highlight ? "#eab308" : subtle ? "#f97316" : "inherit",
          fontSize: 13,
          borderRadius: 6, transition: "background 0.1s",
        }

    return (
      <button
        onClick={() => { onClick?.() }}
        style={rowStyle}
        onMouseEnter={!isMobile ? (e) => { e.currentTarget.style.background = colors.border } : undefined}
        onMouseLeave={!isMobile ? (e) => { e.currentTarget.style.background = "none" } : undefined}
      >
        <Icon size={isMobile ? 20 : 16} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.8 }} />
        <span style={{ fontWeight: isMobile ? 500 : 400 }}>{label}</span>
      </button>
    )
  }

  // ── DESKTOP DROPDOWN ──────────────────────────────────────────────────────
  if (!isMobile) {
    return createPortal(
      <div
        ref={menuRef}
        style={{
          position: "fixed", top: pos.top, left: pos.left, zIndex: 10002,
          width: 230,
          background: colors.card || colors.bg,
          border: `1px solid ${colors.border}`,
          borderRadius: 10,
          boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
          padding: "4px", overflow: "hidden",
          transform: "scale(0.96)", opacity: 0,
          animation: "dropdown 120ms ease forwards",
        }}
      >
        <Row icon={Copy}           label="Copy text"       onClick={handleCopyText} />
        <Row icon={Link2}          label="Share comment"   onClick={() => copyShareLink(`/forum/${threadId}?focus=${reply.$id}`)} />
        <Row icon={ChevronsDownUp} label="Collapse thread" onClick={onCollapse} />

        {canPin && !reply.deleted && (
          <>
            <div style={{ height: 1, background: colors.border, margin: "4px 0" }} />
            <Row
              icon={reply.isPinned ? PinOff : Pin}
              label={reply.isPinned ? "Unpin comment" : "Pin comment"}
              onClick={onPin}
              highlight={!reply.isPinned}
            />
          </>
        )}

        <div style={{ height: 1, background: colors.border, margin: "4px 0" }} />

        {isOwn ? (
          <>
            <Row icon={Pencil} label="Edit comment"   onClick={onEdit} />
            <Row icon={Trash2} label="Delete comment" onClick={onDelete} danger />
          </>
        ) : (
          <>
            <Row icon={Flag} label="Report" onClick={onReport} danger />
            {/* Admin/mod delete - visible only when canAdminDelete and not own reply */}
            {canAdminDelete && !reply.deleted && (
              <Row
                icon={ShieldX}
                label="Remove (mod)"
                onClick={onDelete}
                subtle
              />
            )}
          </>
        )}
      </div>,
      document.body
    )
  }

  // ── MOBILE BOTTOM SHEET ───────────────────────────────────────────────────
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 10002,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", background: colors.bg,
          borderRadius: "20px 20px 0 0",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
          maxHeight: "80vh", overflowY: "auto",
        }}
      >
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: colors.border, margin: "12px auto 8px" }} />

        {/* Author + content preview */}
        <div style={{ padding: "8px 20px 12px", borderBottom: `1px solid ${colors.border}` }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{displayAuthorName}</p>
          <p style={{
            fontSize: 13, color: colors.muted, opacity: 0.75,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{reply.content?.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()}</p>
        </div>

        <Row icon={Copy}           label="Copy text"       onClick={handleCopyText} />
        <Row icon={Link2}          label="Share comment"   onClick={() => copyShareLink(`/forum/${threadId}?focus=${reply.$id}`)} />
        <Row icon={ChevronsDownUp} label="Collapse thread" onClick={onCollapse} />

        {canPin && !reply.deleted && (
          <>
            <div style={{ height: 1, background: colors.border, margin: "4px 0" }} />
            <Row
              icon={reply.isPinned ? PinOff : Pin}
              label={reply.isPinned ? "Unpin" : "Pin comment"}
              onClick={onPin}
              highlight={!reply.isPinned}
            />
          </>
        )}

        <div style={{ height: 1, background: colors.border, margin: "4px 0" }} />

        {isOwn ? (
          <>
            <Row icon={Pencil} label="Edit"   onClick={onEdit} />
            <Row icon={Trash2} label="Delete" onClick={onDelete} danger />
          </>
        ) : (
          <>
            <Row icon={Flag} label="Report" onClick={onReport} danger />
            {canAdminDelete && !reply.deleted && (
              <Row
                icon={ShieldX}
                label="Remove (mod)"
                onClick={onDelete}
                subtle
              />
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

export default OptionsMenu

// src/components/forum/MobileReplyModal.jsx
import useKeyboardOffset from "@/hooks/useKeyboardOffset"
import { ImageIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import GifPicker from "./GifPicker"
import { deleteCloudinaryImage } from "@/lib/deleteCloudinaryImage"
import useComposeState from "@/hooks/useComposeState"
import TiptapEditor from "./TiptapEditor"

const TOOLBAR_H = 52
const PRIMARY = "#3b82f6"

function MobileReplyModal({ replyingTo, onSubmit, onClose }) {
  const kbOffset = useKeyboardOffset()
  const cs = useComposeState()
  const [html, setHtml] = useState("")

  const isEmpty = !html.trim() || html === "<p></p>"
  const canPost = !isEmpty || !!cs.previewGif || !!cs.previewImage

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  const { colors } = cs

  const handlePost = async () => {
    if (!canPost) return
    onSubmit(html, cs.previewGif, cs.previewImage)
    setHtml("")
    cs.setPreviewGif(null)
    cs.setPreviewImage(null)
    cs.setGifOpen(false)
    cs.setGifSearch("")
    cs.setUploadedImagePublicId(null)
    onClose()
  }

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      display: "flex", flexDirection: "column",
      backgroundColor: colors.bg, color: "inherit",
    }}>

      {/* HEADER */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 52, flexShrink: 0,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <button onClick={onClose} style={{
          fontSize: 14, fontWeight: 500, color: colors.muted,
          background: "none", border: "none", cursor: "pointer", padding: "4px 2px",
        }}>Cancel</button>

        <span style={{ fontSize: 14, fontWeight: 700 }}>Reply</span>

        <button
          onClick={handlePost}
          disabled={!canPost}
          style={{
            fontSize: 14, fontWeight: 700,
            color: canPost ? PRIMARY : colors.muted,
            background: "none", border: "none", cursor: canPost ? "pointer" : "default",
            padding: "4px 2px", opacity: canPost ? 1 : 0.4,
          }}
        >Post</button>
      </div>

      {/* CONTEXT QUOTE */}
      {replyingTo && (
        <div style={{ padding: "8px 16px", flexShrink: 0, borderBottom: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: colors.muted, marginBottom: 2 }}>
            {replyingTo.authorName}
          </p>
          <p style={{
            fontSize: 12, color: colors.muted, opacity: 0.65,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {replyingTo.content?.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim() || ""}
          </p>
        </div>
      )}

      {/* EDITOR - scrollable */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        minHeight: 0, overflowY: "auto",
        paddingBottom: TOOLBAR_H + kbOffset + 8,
      }}>
        <TiptapEditor
          content={html}
          onChange={setHtml}
          onSubmit={handlePost}
          placeholder="Your reply…"
          autoFocus
          collapsibleToolbar
        />

        {(cs.previewGif || cs.previewImage) && (
          <div style={{ padding: "0 16px 8px", flexShrink: 0 }}>
            <div style={{ position: "relative", display: "inline-flex" }}>
              <img
                src={cs.previewGif || cs.previewImage} alt="preview"
                style={{
                  maxHeight: 80, maxWidth: 140, borderRadius: 12,
                  border: `1px solid ${colors.border}`, objectFit: "cover", display: "block",
                }}
              />
              <button
                onClick={async () => {
                  await deleteCloudinaryImage(cs.uploadedImagePublicId)
                  cs.setPreviewGif(null)
                  cs.setPreviewImage(null)
                  cs.setUploadedImagePublicId(null)
                }}
                style={{
                  position: "absolute", top: -6, right: -6,
                  width: 20, height: 20, borderRadius: "50%",
                  background: colors.bg, border: `1px solid ${colors.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, cursor: "pointer", color: colors.muted,
                }}
              >✕</button>
            </div>
          </div>
        )}

        {cs.gifOpen && (
          <GifPicker
            colors={colors}
            gifSearch={cs.gifSearch}
            setGifSearch={cs.setGifSearch}
            onClose={() => cs.setGifOpen(false)}
            onSelectGif={async (url) => {
              await deleteCloudinaryImage(cs.uploadedImagePublicId)
              cs.setPreviewGif(url)
              cs.setPreviewImage(null)
              cs.setUploadedImagePublicId(null)
              cs.setGifOpen(false)
            }}
          />
        )}
      </div>

      {/* BOTTOM TOOLBAR */}
      <div style={{
        position: "fixed", left: 0, right: 0,
        bottom: kbOffset, height: TOOLBAR_H,
        display: "flex", alignItems: "center", gap: 4, padding: "0 12px",
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.bg, zIndex: 10000,
        transition: "bottom 0.12s ease-out",
      }}>
        <button
          onClick={() => { cs.setPreviewGif(null); cs.fileRef.current?.click() }}
          style={{ padding: 8, borderRadius: "50%", background: "none", border: "none", cursor: "pointer", color: colors.muted }}
        >
          <ImageIcon size={18} />
        </button>
        <input ref={cs.fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={cs.handleImageSelect} />

        <button
          onClick={() => cs.setGifOpen(v => !v)}
          style={{
            padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: "none", cursor: "pointer",
            border: `1.5px solid ${cs.gifOpen ? PRIMARY : colors.border}`,
            color: cs.gifOpen ? PRIMARY : colors.muted,
          }}
        >GIF</button>
      </div>
    </div>,
    document.body
  )
}

export default MobileReplyModal
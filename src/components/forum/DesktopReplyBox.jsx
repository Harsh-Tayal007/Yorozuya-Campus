// src/components/forum/DesktopReplyBox.jsx
import { useRef, useState } from "react"
import { ImageIcon } from "lucide-react"
import GifPicker from "./GifPicker"
import { deleteCloudinaryImage } from "@/lib/deleteCloudinaryImage"
import TiptapEditor from "./TiptapEditor"

function DesktopReplyBox({ onSubmit, onCancel, cs }) {
  const fileRef = useRef(null)
  const [html, setHtml] = useState("")

  const isEmpty = !html.trim() || html === "<p></p>"
  const canPost = !isEmpty || !!cs.previewGif || !!cs.previewImage

  const handleSubmit = () => {
    if (!canPost) return
    onSubmit(html, cs.previewGif, cs.previewImage)
    setHtml("")
    cs.setPreviewGif(null)
    cs.setPreviewImage(null)
    cs.setGifOpen(false)
    cs.setGifSearch("")
    cs.setUploadedImagePublicId(null)
    onCancel()
  }

  return (
    <div className="mt-2 rounded-xl border border-border bg-muted/10 overflow-hidden focus-within:border-primary/60 transition-colors duration-200">

      <TiptapEditor
        content={html}
        onChange={setHtml}
        onSubmit={handleSubmit}
        placeholder="Write a reply…"
        autoFocus
      />

      {(cs.previewGif || cs.previewImage) && (
        <div className="px-3 pb-1">
          <div className="relative inline-flex">
            <img
              src={cs.previewGif || cs.previewImage}
              alt="preview"
              className="max-h-20 max-w-[140px] rounded-lg border border-border object-cover"
            />
            <button
              onClick={() => {
                cs.setPreviewGif(null)
                cs.setPreviewImage(null)
                cs.setUploadedImagePublicId(null)
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background
                         border border-border flex items-center justify-center
                         text-[9px] text-muted-foreground hover:text-destructive"
            >✕</button>
          </div>
        </div>
      )}

      {cs.gifOpen && (
        <div className="mx-3 mb-2">
          <GifPicker
            colors={cs.colors}
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
        </div>
      )}

      {/* BOTTOM TOOLBAR */}
      <div className="flex items-center gap-1.5 px-2 pb-2 pt-0.5">
        <button
          onClick={() => { cs.setPreviewGif(null); fileRef.current?.click() }}
          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold
                     text-muted-foreground border border-border hover:border-primary hover:text-primary transition-colors"
        >
          <ImageIcon size={11} /> Image
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={cs.handleImageSelect} />

        <button
          onClick={() => cs.setGifOpen(v => !v)}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors
                      ${cs.gifOpen
              ? "border-primary text-primary bg-primary/10"
              : "text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
        >GIF</button>

        <div className="flex-1" />

        <button
          onClick={onCancel}
          className="rounded-full px-3 py-1 text-[11px] font-semibold text-muted-foreground
                     border border-border hover:bg-muted/50 transition-colors"
        >Cancel</button>
        <button
          onClick={handleSubmit}
          disabled={!canPost}
          className="rounded-full px-3 py-1 text-[11px] font-bold bg-primary text-primary-foreground
                     hover:bg-primary/90 transition-colors disabled:opacity-40"
        >Reply</button>
      </div>
    </div>
  )
}

export default DesktopReplyBox
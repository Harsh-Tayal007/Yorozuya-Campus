import { useRef } from "react"
import { Textarea } from "../ui/textarea"
import { ImageIcon } from "lucide-react"
import GifPicker from "./GifPicker"
import { deleteCloudinaryImage } from "@/lib/deleteCloudinaryImage"

function DesktopReplyBox({ onSubmit, onCancel, cs }) {
  const taRef = useRef(null)
  const fileRef = useRef(null)


  const handleSubmit = () => {
    if (!cs.text.trim() && !cs.previewGif && !cs.previewImage) return

    onSubmit(cs.text, cs.previewGif, cs.previewImage)

    cs.setText("")
    cs.setPreviewGif(null)
    cs.setPreviewImage(null)
    cs.setGifOpen(false)
    cs.setGifSearch("")
    cs.setUploadedImagePublicId(null)

    onCancel()
  }

  return (
    <>
      <div className="mt-2 rounded-xl border border-border bg-muted/10 overflow-hidden focus-within:border-primary/60 transition-colors duration-200">

        <Textarea
          ref={taRef}
          autoFocus
          placeholder="Write a reply…"
          rows={3}
          value={cs.text}
          onChange={(e) => {
            cs.setText(e.target.value)
            if (cs.gifOpen) cs.setGifOpen(false)
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              handleSubmit()
            }
          }}
          className="border-0 bg-transparent resize-none text-sm focus-visible:ring-0 px-3 pt-3 pb-1 min-h-[68px]"
        />

        {(cs.previewGif || cs.previewImage) && (
          <div className="px-3 pb-1">
            <div className="relative inline-flex">
              <img src={cs.previewGif || cs.previewImage} alt="preview"
                className="max-h-20 max-w-[140px] rounded-lg border border-border object-cover" />
              <button
                onClick={() => {
                  cs.setPreviewGif(null)
                  cs.setPreviewImage(null)
                  cs.setUploadedImagePublicId(null)
                  setTimeout(() => taRef.current?.focus(), 50)
                }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-background
                           border border-border flex items-center justify-center
                           text-[9px] text-muted-foreground hover:text-destructive">✕</button>
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

                setTimeout(() => taRef.current?.focus(), 50)
              }}
            />
          </div>
        )}

        {/* TOOLBAR */}
        <div className="flex items-center gap-1.5 px-2 pb-2 pt-0.5">
          <button
            onClick={() => {
              cs.setPreviewGif(null)
               fileRef.current?.click()  
            }}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold
                       text-muted-foreground border border-border hover:border-primary hover:text-primary transition-colors"
          >
            <ImageIcon size={11} /> Image
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={cs.handleImageSelect}
          />

          <button
            onClick={() => {
              cs.setGifOpen((v) => !v)
              taRef.current?.blur()
            }}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-colors
                        ${cs.gifOpen
                ? "border-primary text-primary bg-primary/10"
                : "text-muted-foreground border-border hover:border-primary hover:text-primary"}`}
          >GIF</button>

          <div className="flex-1" />

          <button onClick={onCancel}
            className="rounded-full px-3 py-1 text-[11px] font-semibold text-muted-foreground
                       border border-border hover:bg-muted/50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!cs.canPost}
            className="rounded-full px-3 py-1 text-[11px] font-bold bg-primary text-primary-foreground
             hover:bg-primary/90 transition-colors disabled:opacity-40">
            Reply
          </button>
        </div>
      </div>
    </>
  )
}

export default DesktopReplyBox

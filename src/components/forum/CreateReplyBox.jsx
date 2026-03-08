// src/components/forum/CreateReplyBox.jsx
import { Button } from "@/components/ui/button"
import { Image as ImageIcon, Loader2 } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { useParams } from "react-router-dom"
import GifPicker from "./GifPicker"
import TiptapEditor from "./TiptapEditor"
import useComposeState from "@/hooks/useComposeState"
import { useRef, useState } from "react"
import useReplyActions from "@/hooks/useReplyActions"
import { uploadImage } from "@/lib/uploadImage"
import { functions } from "@/lib/appwrite"

const CLOUDINARY_FN = "69abd1b6003368be1e41"

export default function CreateReplyBox() {
  const [isUploading, setIsUploading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [html, setHtml] = useState("")

  const { user } = useAuth()
  const { threadId } = useParams()
  const cs = useComposeState()
  const fileRef = useRef(null)

  const { createReply } = useReplyActions(threadId)
  const isPosting = createReply.isPending

  const isEmpty = !html.trim() || html === "<p></p>"
  const canPost = !isEmpty || !!cs.previewGif || !!cs.previewImage

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!canPost) return
    await createReply.mutateAsync({
      threadId,
      content: html,
      gifUrl: cs.previewGif,
      imageUrl: cs.previewImage,
      imagePublicId: cs.uploadedImagePublicId,
      authorId: user.$id,
      authorName: user.username,
      parentReplyId: null,
    })
    setHtml("")
    cs.setPreviewGif(null)
    cs.setPreviewImage(null)
    cs.setUploadedImagePublicId(null)
    cs.setGifOpen(false)
    cs.setGifSearch("")
    setIsExpanded(false)
  }

  /* ── Reset ── */
  const resetCompose = async () => {
    setHtml("")
    cs.setPreviewGif(null)
    if (cs.uploadedImagePublicId) {
      try {
        await functions.createExecution(CLOUDINARY_FN, JSON.stringify({ publicId: cs.uploadedImagePublicId }))
      } catch (err) { console.error("Image delete failed", err) }
    }
    cs.setPreviewImage(null)
    cs.setUploadedImagePublicId(null)
    cs.setGifOpen(false)
    cs.setGifSearch("")
    setIsExpanded(false)
  }

  /* ── Image upload ── */
  const handleImageSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { alert("Image must be under 5MB"); return }
    try {
      setIsUploading(true)
      const { url, publicId } = await uploadImage(file)
      if (cs.previewGif) cs.setPreviewGif(null)
      cs.setPreviewImage(url)
      cs.setUploadedImagePublicId(publicId)
    } catch (err) {
      console.error("Upload failed", err); alert("Image upload failed")
    } finally { setIsUploading(false) }
  }

  const removeImage = async () => {
    if (cs.uploadedImagePublicId) {
      try { await functions.createExecution(CLOUDINARY_FN, JSON.stringify({ publicId: cs.uploadedImagePublicId })) }
      catch (err) { console.error("Image delete failed", err) }
    }
    cs.setPreviewImage(null)
    cs.setUploadedImagePublicId(null)
  }

  return (
    <>
      <style>{`
        @keyframes replyExpand {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .reply-expand { animation: replyExpand 180ms ease forwards; }
      `}</style>

      <div className="rounded-xl border border-border bg-muted/20 overflow-hidden">
        <input type="file" accept="image/*" ref={fileRef} hidden onChange={handleImageSelect} />

        {!isExpanded ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full text-left px-4 py-3 text-sm text-muted-foreground
                       hover:text-foreground hover:bg-muted/40 transition-colors duration-150"
          >
            Join the conversation...
          </button>
        ) : (
          <div className="reply-expand flex flex-col">

            <TiptapEditor
              content={html}
              onChange={setHtml}
              onSubmit={handleSubmit}
              placeholder="Write a reply…"
              autoFocus
            />

            {(cs.previewImage || isUploading) && (
              <div className="flex px-4 pt-3">
                <div className="relative inline-flex">
                  {isUploading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground border rounded-lg px-3 py-2">
                      <Loader2 className="animate-spin" size={14} /> Uploading image...
                    </div>
                  ) : (
                    <>
                      <img src={cs.previewImage} alt="preview" className="max-h-24 max-w-[160px] rounded-lg border border-border object-cover" />
                      <button onClick={removeImage}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-background
                                   border border-border flex items-center justify-center
                                   text-[9px] text-muted-foreground hover:text-destructive transition-colors"
                      >✕</button>
                    </>
                  )}
                </div>
              </div>
            )}

            {cs.previewGif && (
              <div className="flex px-4 pt-3">
                <div className="relative inline-flex">
                  <img src={cs.previewGif} alt="gif preview" className="max-h-24 max-w-[160px] rounded-lg border border-border object-cover" />
                  <button onClick={() => cs.setPreviewGif(null)}
                    className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-background
                               border border-border flex items-center justify-center
                               text-[9px] text-muted-foreground hover:text-destructive transition-colors"
                  >✕</button>
                </div>
              </div>
            )}

            {cs.gifOpen && (
              <div className="px-4 pt-3">
                <GifPicker
                  colors={cs.colors}
                  gifSearch={cs.gifSearch}
                  setGifSearch={cs.setGifSearch}
                  onClose={() => cs.setGifOpen(false)}
                  onSelectGif={async (url) => {
                    if (cs.uploadedImagePublicId) {
                      try { await functions.createExecution(CLOUDINARY_FN, JSON.stringify({ publicId: cs.uploadedImagePublicId })) }
                      catch (err) { console.error("Image delete failed", err) }
                      cs.setPreviewImage(null)
                      cs.setUploadedImagePublicId(null)
                    }
                    cs.setPreviewGif(url)
                    cs.setGifOpen(false)
                  }}
                />
              </div>
            )}

            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-1 text-muted-foreground">
                <button
                  disabled={isUploading || !!cs.previewGif}
                  onClick={() => { cs.setPreviewGif(null); fileRef.current.click() }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs
                             hover:bg-muted hover:text-foreground active:scale-95
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-[color,background-color,transform] duration-150"
                >
                  <ImageIcon size={14} /> Media
                </button>
                <button
                  disabled={!!cs.previewImage}
                  onClick={() => cs.setGifOpen(v => !v)}
                  className="flex items-center px-2.5 py-1.5 rounded-full text-xs font-bold
                             hover:bg-muted hover:text-foreground active:scale-95
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-[color,background-color,transform] duration-150"
                >GIF</button>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="h-7 px-3 rounded-full text-xs" onClick={resetCompose}>Cancel</Button>
                <Button
                  size="sm" className="h-7 px-3 rounded-full text-xs"
                  onClick={handleSubmit}
                  disabled={isPosting || isUploading || !canPost}
                >
                  {isPosting ? <Loader2 size={12} className="animate-spin" /> : "Post Reply"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
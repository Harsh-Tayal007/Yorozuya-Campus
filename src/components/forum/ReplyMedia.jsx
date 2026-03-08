import React, { useRef, useState } from "react"
import LazyGif from "./LazyGif"
import { downloadFileXHR } from "@/services/shared/downloadService"

const optimizeImage = (url) => {
  if (!url) return url
  return url.replace("/upload/", "/upload/f_auto,q_auto,w_600,c_limit/")
}

const blurPreview = (url) => {
  if (!url) return url
  return url.replace("/upload/", "/upload/w_40,e_blur:800,q_10/")
}

export default function ReplyMedia({ gifUrl, imageUrl, deleted, maxWidth }) {
  const [expanded, setExpanded] = useState(false)
  const [showHint, setShowHint] = useState(
    !localStorage.getItem("replyZoomHintSeen")
  )

  if (deleted) return null

  return (
    <>
      {/* IMAGE */}
      {imageUrl && (
        <>
          <div
            className="inline-block relative max-w-full cursor-zoom-in"
            onClick={() => setExpanded(true)}
          >
            <div className="relative bg-background rounded-md overflow-hidden">
              <img
                src={blurPreview(imageUrl)}
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover blur-sm scale-105 pointer-events-none"
                style={{ maxWidth: Math.min(maxWidth, 280) }}
              />
              <img
                src={optimizeImage(imageUrl)}
                alt="reply image"
                loading="lazy"
                decoding="async"
                style={{ maxWidth: Math.min(maxWidth, 280) }}
                className="relative rounded-md w-auto h-auto object-contain max-h-[200px] sm:max-h-[240px] md:max-h-[260px] transition-opacity duration-300"
              />
            </div>
          </div>

          {expanded && (
            <ExpandedViewer
              src={optimizeImage(imageUrl)}
              showHint={showHint}
              setShowHint={setShowHint}
              onClose={() => setExpanded(false)}
            />
          )}
        </>
      )}

      {/* GIF */}
      {gifUrl && (
        <div className="inline-block relative max-w-full group">
          <LazyGif
            gifSrc={gifUrl}
            previewSrc={gifUrl.replace(".gif", ".webp")}
            alt="gif"
            style={{ maxWidth }}
            className="rounded-md w-auto h-auto object-contain max-h-[200px] sm:max-h-[260px] md:max-h-[300px]"
          />
          <span className="absolute bottom-2 right-2 text-[9px] font-bold px-1.5 py-[1px] rounded bg-black/70 text-white">
            GIF
          </span>
        </div>
      )}
    </>
  )
}

function getFileNameFromUrl(url) {
  try {
    const clean = url.split("?")[0]
    const parts = clean.split("/")
    const last = parts[parts.length - 1]
    if (!last.includes(".")) return "image.jpg"
    return last
  } catch {
    return "image.jpg"
  }
}

function ExpandedViewer({ src, onClose, showHint, setShowHint }) {
  const [scale, setScale] = useState(1)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const start = useRef({ x: 0, y: 0 })

  const handleWheel = (e) => {
    if (showHint) {
      setShowHint(false)
      localStorage.setItem("replyZoomHintSeen", "1")
    }
    e.preventDefault()
    setScale(s => Math.min(Math.max(1, s - e.deltaY * 0.001), 4))
  }

  const handleMouseDown = (e) => {
    if (showHint) {
      setShowHint(false)
      localStorage.setItem("replyZoomHintSeen", "1")
    }
    dragging.current = true
    start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }

  const handleMouseMove = (e) => {
    if (!dragging.current) return
    setPos({ x: e.clientX - start.current.x, y: e.clientY - start.current.y })
  }

  const handleMouseUp = () => { dragging.current = false }

  const handleSave = (e) => {
    e.stopPropagation()
    downloadFileXHR({ url: src, fileName: getFileNameFromUrl(src) })
  }

  React.useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", esc)
    return () => window.removeEventListener("keydown", esc)
  }, [onClose])

  React.useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onWheel={handleWheel}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={onClose}
    >
      {/* ── Hint — fixed to overlay, never zooms ── */}
      {showHint && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10
                        text-xs text-white/80 bg-black/50 px-3 py-1
                        rounded-full backdrop-blur pointer-events-none">
          Scroll to zoom • Drag to move
        </div>
      )}

      {/* ── Close — fixed top-right, never zooms ── */}
      <button
        onClick={(e) => { e.stopPropagation(); onClose() }}
        className="absolute top-4 right-4 z-10
                   w-8 h-8 flex items-center justify-center
                   rounded-full
                   bg-black/40 backdrop-blur
                   text-white text-sm font-bold
                   border border-white/20
                   hover:bg-black/70
                   transition-colors"
      >
        ✕
      </button>

      {/* ── Save — fixed bottom-right, never zooms ── */}
      <button
        onClick={handleSave}
        className="absolute bottom-6 right-6 z-10
                   px-4 py-2 rounded-full text-xs font-semibold
                   bg-black/40 backdrop-blur
                   text-white border border-white/20
                   hover:bg-black/70
                   transition-colors"
      >
        Save image
      </button>

      {/* ── Zoomable image — only this transforms ── */}
      <div
        onMouseDown={handleMouseDown}
        onClick={(e) => e.stopPropagation()}
        className="relative"
      >
        <img
          src={src}
          draggable={false}
          className="object-contain select-none"
          style={{
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            maxWidth: "95vw",
            maxHeight: "90vh",
            cursor: dragging.current ? "grabbing" : "grab",
          }}
        />
      </div>
    </div>
  )
}
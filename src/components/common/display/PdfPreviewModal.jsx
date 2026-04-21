import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog"
import { FileText } from "lucide-react"
import { DialogDescription } from "@radix-ui/react-dialog"
import { useEffect, useRef, useState } from "react"
import { getFileViewUrl } from "@/services/shared/storageAdapter"

const pdfViewCache = new Map()
const PREVIEW_TIMEOUT_MS = 12_000

export default function PdfPreviewModal({
  title,
  bucketId,
  fileId,
  storageProvider,
  type,
  open,
  onClose,
}) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!open || !fileId) return

    const provider = storageProvider || "appwrite"
    const requiresBucket = provider !== "cloudflare"
    if (requiresBucket && !bucketId) {
      setPdfUrl(null)
      setLoading(false)
      setErrorMessage("Preview unavailable")
      return
    }

    const cacheBucket = provider === "cloudflare" ? "cloudflare" : bucketId || "default"
    const cacheKey = `${provider}:${cacheBucket}:${fileId}`

    setLoading(true)
    setErrorMessage("")

    const cached = pdfViewCache.get(cacheKey) || sessionStorage.getItem(cacheKey)
    if (cached) {
      pdfViewCache.set(cacheKey, cached)
      setPdfUrl(cached)
      return
    }

    try {
      const baseUrl = getFileViewUrl(fileId, storageProvider, type, bucketId)
      if (!baseUrl) throw new Error("Missing preview URL")

      const url = `${baseUrl}#zoom=page-width&toolbar=0&navpanes=0&scrollbar=0`
      pdfViewCache.set(cacheKey, url)
      sessionStorage.setItem(cacheKey, url)
      setPdfUrl(url)
    } catch (err) {
      console.error("Failed to build PDF preview URL", err)
      setPdfUrl(null)
      setLoading(false)
      setErrorMessage("Preview unavailable")
    }
  }, [open, bucketId, fileId, storageProvider, type])

  useEffect(() => {
    if (!open || !pdfUrl || errorMessage) return

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setLoading(false)
      setErrorMessage("Preview unavailable")
    }, PREVIEW_TIMEOUT_MS)

    return () => clearTimeout(timeoutRef.current)
  }, [open, pdfUrl, errorMessage])

  useEffect(() => {
    if (!open) {
      clearTimeout(timeoutRef.current)
      setPdfUrl(null)
      setLoading(true)
      setErrorMessage("")
    }
  }, [open])

  if (!open) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/40 backdrop-blur-md" />

      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-w-4xl p-0 overflow-hidden"
      >
        <DialogHeader className="flex flex-row items-center gap-2 px-6 py-4 border-b">
          <FileText className="h-5 w-5 text-red-600" />
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>

        <DialogDescription className="sr-only">PDF preview dialog</DialogDescription>

        <div className="h-[75vh] bg-background relative">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              Loading PDF...
            </div>
          )}

          {errorMessage && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              {errorMessage}. Download the file to view it.
            </div>
          )}

          {!errorMessage && pdfUrl && (
            <iframe
              src={pdfUrl}
              title={title}
              className="h-full w-full"
              style={{ border: "none", visibility: loading ? "hidden" : "visible" }}
              onLoad={() => {
                clearTimeout(timeoutRef.current)
                setLoading(false)
              }}
              onError={() => {
                clearTimeout(timeoutRef.current)
                setLoading(false)
                setErrorMessage("Preview unavailable")
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

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

const PREVIEW_TIMEOUT_MS = 12_000

export default function PyqPreviewModal({ pyq, open, onClose }) {
  const [pdfUrl, setPdfUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState("")
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!open || !pyq?.fileId) return

    setLoading(true)
    setErrorMessage("")

    try {
      const baseUrl = getFileViewUrl(pyq.fileId, pyq.storageProvider, "pyq", pyq.bucketId)
      if (!baseUrl) throw new Error("Missing preview URL")
      const url = `${baseUrl}#zoom=page-width&toolbar=0&navpanes=0&scrollbar=0`
      setPdfUrl(url)
    } catch (err) {
      console.error("Failed to load PDF preview", err)
      setPdfUrl(null)
      setLoading(false)
      setErrorMessage("Preview unavailable")
    }
  }, [open, pyq])

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

  if (!pyq) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/40 backdrop-blur-md" />

      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-w-4xl p-0 overflow-hidden"
      >
        <DialogHeader className="flex flex-row items-center justify-between gap-3 px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-red-600" />
            <DialogTitle className="text-base font-semibold">{pyq.title}</DialogTitle>
          </div>
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
              title={pyq.title}
              className="h-full w-full rounded-b-lg"
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

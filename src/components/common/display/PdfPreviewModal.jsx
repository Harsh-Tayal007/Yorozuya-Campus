import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { DialogDescription } from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { storage } from "@/lib/appwrite";

// 🔒 In-memory cache (per tab)
const pdfViewCache = new Map();

export default function PdfPreviewModal({
  title,
  bucketId,
  fileId,
  open,
  onClose,
}) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!open || !fileId || !bucketId) return;

    const cacheKey = `${bucketId}:${fileId}`;

    setLoading(true);
    setError(false);

    // 1️⃣ In-memory cache
    if (pdfViewCache.has(cacheKey)) {
      setPdfUrl(pdfViewCache.get(cacheKey));
      setLoading(false);
      return;
    }

    // 2️⃣ sessionStorage cache
    const stored = sessionStorage.getItem(cacheKey);
    if (stored) {
      pdfViewCache.set(cacheKey, stored);
      setPdfUrl(stored);
      setLoading(false);
      return;
    }

    // 3️⃣ Appwrite call (only once)
    try {
      const url = `${storage.getFileView(
        bucketId,
        fileId
      )}#zoom=page-width&toolbar=0&navpanes=0&scrollbar=0`;

      pdfViewCache.set(cacheKey, url);
      sessionStorage.setItem(cacheKey, url);

      setPdfUrl(url);
    } catch (err) {
      console.error("Failed to load PDF preview", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [open, bucketId, fileId]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay className="bg-black/40 backdrop-blur-md" />

      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="max-w-4xl p-0 overflow-hidden"
      >
        {/* Header */}
        <DialogHeader className="flex flex-row items-center gap-2 px-6 py-4 border-b">
          <FileText className="h-5 w-5 text-red-600" />
          <DialogTitle className="text-base font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>

        <DialogDescription className="sr-only">
          PDF preview dialog
        </DialogDescription>

        {/* Body */}
        <div className="h-[75vh] bg-background">
          {loading && (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading PDF…
            </div>
          )}

          {error && (
            <div className="flex h-full items-center justify-center text-sm text-destructive">
              Failed to load PDF preview
            </div>
          )}

          {!loading && !error && pdfUrl && (
            <iframe
              src={pdfUrl}
              title={title}
              className="h-full w-full"
              style={{ border: "none" }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

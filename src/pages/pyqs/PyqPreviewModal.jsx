import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogOverlay,
} from "@/components/ui/dialog"
import { FileText, X } from "lucide-react"
import { DialogDescription } from "@radix-ui/react-dialog"
import { useEffect, useState } from "react"
import { storage } from "@/lib/appwrite"



/**
 * PyqPreviewModal
 *
 * ⚠️ STATIC UI ONLY
 * - No state
 * - No services
 * - No props wiring yet
 * - Hardcoded data for layout validation
 */
export default function PyqPreviewModal({ pyq, open, onClose }) {
    const [pdfUrl, setPdfUrl] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (!pyq) return   // ⛔ guard INSIDE effect

        setLoading(true)
        setError(false)

        try {
            const url = `${storage.getFileView(
                pyq.bucketId,
                pyq.fileId
            )}#zoom=page-width&toolbar=0&navpanes=0&scrollbar=0`
            setPdfUrl(url)
        } catch (err) {
            console.error("Failed to load PDF preview", err)
            setError(true)
        } finally {
            setLoading(false)
        }
    }, [pyq])



    // ⛔ Guard clause — must be BEFORE JSX
    if (!pyq) return null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogOverlay className="bg-black/40 backdrop-blur-md" />

            <DialogContent
                onOpenAutoFocus={(e) => e.preventDefault()}
                className="max-w-4xl p-0 overflow-hidden"
            >
                {/* Header */}
                <DialogHeader className="flex flex-row items-center justify-between gap-3 px-6 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-red-600" />
                        <DialogTitle className="text-base font-semibold">
                            {pyq.title}
                        </DialogTitle>
                    </div>
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
                            title={pyq.title}
                            className="h-full w-full rounded-b-lg"
                            style={{ border: "none" }}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

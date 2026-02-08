import { useParams, Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { storage } from "@/lib/appwrite"
import { FileTypeBadge } from "@/components"
import { formatFileSize } from "@/utils/formatFileSize"
import PyqPreviewModal from "./PyqPreviewModal"

import {
    getPyqsForSubject,
} from "@/services/pyqService"


const PyqSubjectList = () => {
    const {
        programId,
        branchName,
        semester,
        subjectId,
    } = useParams()

    const [pyqs, setPyqs] = useState([])
    const [loading, setLoading] = useState(true)

    const [previewPyq, setPreviewPyq] = useState(null)

    const decodedBranch = decodeURIComponent(branchName)

    useEffect(() => {
        const fetchPyqs = async () => {
            try {
                const data = await getPyqsForSubject({
                    programId,
                    semester,
                    subjectId,
                })
                setPyqs(data)
            } catch (err) {
                console.error("Failed to fetch PYQs", err)
            } finally {
                setLoading(false)
            }
        }

        fetchPyqs()
    }, [programId, semester, subjectId])

    // handlers
    const handleView = (pyq) => {
        setPreviewPyq(pyq)
    }

    const handleDownload = (pyq) => {
        const url = storage.getFileDownload(pyq.bucketId, pyq.fileId)
        window.open(url, "_blank")
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

            {/* 🔗 Temporary Breadcrumb */}
            <div className="text-sm text-muted-foreground">
                <Link
                    to={`/programs/${programId}`}
                    className="hover:underline"
                >
                    Program
                </Link>

                {" → "}
                <Link
                    to={`/programs/${programId}/branches/${branchName}`}
                    className="hover:underline"
                >
                    {decodedBranch}
                </Link>
                {" → "}
                <Link
                    to={`/programs/${programId}/branches/${branchName}/pyqs`}
                    className="hover:underline"
                >
                    PYQs
                </Link>
                {" → "}
                <Link
                    to={`/programs/${programId}/branches/${branchName}/pyqs/semester/${semester}`}
                    className="hover:underline"
                >
                    Semester {semester}
                </Link>
                {" → "}
                <span className="text-foreground font-medium">
                    Subject
                </span>
            </div>

            {/* 📝 Page Header */}
            <div>
                <h1 className="text-2xl font-bold">PYQs</h1>
                <p className="text-muted-foreground">
                    Computer Science Engineering
                </p>
            </div>

            {/* 📄 PYQ List */}
            {loading ? (
                <p className="text-muted-foreground">Loading PYQs...</p>
            ) : pyqs.length === 0 ? (
                <p className="text-muted-foreground">
                    No PYQs uploaded for this subject yet.
                </p>
            ) : (
                <div className="space-y-4">
                    {pyqs.map((pyq) => (
                        <Card
                            key={pyq.$id}
                            className="
        p-4
        flex flex-col gap-4
        md:flex-row md:items-center md:justify-between
    "
                        >
                            {/* Left */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-3">
                                    <FileTypeBadge
                                        fileType={pyq.fileType}
                                        onPreview={() => handleView(pyq)}
                                    />

                                    <p className="font-medium">{pyq.title}</p>
                                </div>

                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                    {pyq.unit && (
                                        <Badge variant="secondary">
                                            Unit {pyq.unit.order}: {pyq.unit.title}
                                        </Badge>
                                    )}

                                    {pyq.fileSize && (
                                        <span>{formatFileSize(pyq.fileSize)}</span>
                                    )}
                                </div>
                            </div>


                            {/* Right */}
                            <div className="flex gap-2 md:shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleView(pyq)}
                                >
                                    View
                                </Button>

                                <Button
                                    size="sm"
                                    onClick={() => handleDownload(pyq)}
                                >
                                    Download
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
            <PyqPreviewModal
                pyq={previewPyq}
                open={!!previewPyq}
                onClose={() => setPreviewPyq(null)}
            />

        </div>
    )
}

export default PyqSubjectList

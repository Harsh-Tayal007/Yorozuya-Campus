import { useEffect, useState } from "react"
import { databases, storage } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useNavigate } from "react-router-dom"

import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
    DATABASE_ID,
    PYQS_COLLECTION_ID,
} from "@/config/appwrite"

export default function PyqList({
    limit = 6,
    showViewMore = false,
}) {
    const [pyqs, setPyqs] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchPyqs = async () => {
            try {
                const res = await databases.listDocuments(
                    DATABASE_ID,
                    PYQS_COLLECTION_ID,
                    [
                        Query.orderDesc("$createdAt"),
                        Query.limit(limit),
                    ]
                )
                setPyqs(res.documents)
            } catch (err) {
                console.error("Failed to fetch PYQs", err)
            } finally {
                setLoading(false)
            }
        }

        fetchPyqs()
    }, [limit])

    const handleDelete = async (pyq) => {
        if (!confirm("Delete this PYQ?")) return

        try {
            await databases.deleteDocument(
                DATABASE_ID,
                PYQS_COLLECTION_ID,
                pyq.$id
            )

            await storage.deleteFile(pyq.bucketId, pyq.fileId)

            setPyqs((prev) => prev.filter(p => p.$id !== pyq.$id))
        } catch (err) {
            console.error("Delete failed", err)
            alert("Failed to delete PYQ")
        }
    }

    if (loading) {
        return <p className="text-sm text-muted-foreground">Loading PYQs…</p>
    }

    if (!loading && pyqs.length === 0) {
        return <p className="text-sm text-muted-foreground">No PYQs uploaded yet</p>
    }

    return (
        <div className="space-y-4">
            {pyqs.map((pyq) => (
                <Card key={pyq.$id}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium">{pyq.title}</p>
                            <p className="text-xs text-muted-foreground">
                                Semester {pyq.semester} • {pyq.year}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const url = storage.getFileView(
                                        pyq.bucketId,
                                        pyq.fileId
                                    )
                                    window.open(url, "_blank")
                                }}
                            >
                                View
                            </Button>

                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(pyq)}
                            >
                                Delete
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ))}

            {showViewMore && (
                <div className="pt-2 text-center">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/admin/pyqs")}
                    >
                        View more →
                    </Button>
                </div>
            )}
        </div>
    )
}

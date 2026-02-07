import { useEffect, useState } from "react"
import { databases, storage } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useNavigate } from "react-router-dom"
import { FileText, Link as LinkIcon } from "lucide-react"

import {
    Card,
    CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import {
    DATABASE_ID,
    PYQS_COLLECTION_ID,
    SYLLABUS_COLLECTION_ID,
    UNITS_COLLECTION_ID,
    PROGRAMS_COLLECTION_ID
} from "@/config/appwrite"
import { getSubjectsByIds } from "@/services/subjectService"

export default function PyqList({
    limit = 6,
    refreshKey,
    filters = {},
    searchTerm = "",
    showViewMore = false,
    onEdit,
}) {
    const [pyqs, setPyqs] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const [subjectMap, setSubjectMap] = useState({})
    const [syllabusMap, setSyllabusMap] = useState({})
    const [unitMap, setUnitMap] = useState({})
    const [programMap, setProgramMap] = useState({})

    const highlight = (text, query) => {
        if (!query) return text

        const regex = new RegExp(`(${query})`, "gi")
        return text.split(regex).map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span
                    key={i}
                    className="bg-yellow-300/30 text-yellow-300 px-1 rounded"
                >
                    {part}
                </span>
            ) : (
                part
            )
        )
    }



    useEffect(() => {
        const fetchPyqs = async () => {
            try {
                const queries = [
                    Query.orderDesc("$createdAt"),
                    Query.limit(limit),
                ]

                // Program
                if (filters.programId && filters.programId !== "all") {
                    queries.push(Query.equal("programId", filters.programId))
                }

                // Semester
                if (filters.semester && filters.semester !== "all") {
                    queries.push(Query.equal("semester", String(filters.semester)))
                }

                // Subject (direct)
                if (filters.subjectId && filters.subjectId !== "all") {
                    queries.push(Query.equal("subjectId", filters.subjectId))
                }

                // Subject (derived from branch)
                if (
                    (!filters.subjectId || filters.subjectId === "all") &&
                    filters.subjectIds?.length
                ) {
                    queries.push(Query.equal("subjectId", filters.subjectIds))
                }

                // Unit
                if (filters.unitId && filters.unitId !== "all") {
                    queries.push(Query.equal("unitId", filters.unitId))
                }


                const res = await databases.listDocuments(
                    DATABASE_ID,
                    PYQS_COLLECTION_ID,
                    queries
                )

                let docs = res.documents

                // 🔍 Search by title (case-insensitive)
                if (searchTerm.trim()) {
                    const q = searchTerm.toLowerCase()
                    docs = docs.filter(p =>
                        p.title?.toLowerCase().includes(q)
                    )
                }

                setPyqs(docs)

                const subjectIds = [
                    ...new Set(res.documents.map(p => p.subjectId).filter(Boolean))
                ]

                if (subjectIds.length) {
                    const subjects = await getSubjectsByIds(subjectIds)
                    const map = {}
                    subjects.forEach(s => {
                        map[s.$id] = s
                    })
                    setSubjectMap(map)

                    const unitIds = [
                        ...new Set(res.documents.map(p => p.unitId).filter(Boolean))
                    ]

                    if (unitIds.length) {
                        const unitRes = await databases.listDocuments(
                            DATABASE_ID,
                            UNITS_COLLECTION_ID,
                            [Query.equal("$id", unitIds)]
                        )

                        const map = {}
                        unitRes.documents.forEach(u => {
                            map[u.$id] = u
                        })

                        setUnitMap(map)
                    }

                    const syllabusIds = [
                        ...new Set(
                            subjects.map(s => s.syllabusId).filter(Boolean)
                        )
                    ]

                    if (syllabusIds.length) {
                        const res = await databases.listDocuments(
                            DATABASE_ID,
                            SYLLABUS_COLLECTION_ID,
                            [Query.equal("$id", syllabusIds)]
                        )

                        const map = {}
                        res.documents.forEach(s => {
                            map[s.$id] = s
                        })
                        setSyllabusMap(map)
                    }
                }

                const programIds = [
                    ...new Set(res.documents.map(p => p.programId).filter(Boolean))
                ]

                if (programIds.length) {
                    const programRes = await databases.listDocuments(
                        DATABASE_ID,
                        PROGRAMS_COLLECTION_ID,
                        [Query.equal("$id", programIds)]
                    )

                    const map = {}
                    programRes.documents.forEach(p => {
                        map[p.$id] = p
                    })

                    setProgramMap(map)
                }
            } catch (err) {
                console.error("Failed to fetch PYQs", err)
            } finally {
                setLoading(false)
            }
        }

        fetchPyqs()
    }, [limit, refreshKey, filters, searchTerm])

    // useEffect(() => {
    //     fetchPyqs()
    // }, [limit, refreshKey, filters, searchTerm])


    const handleDelete = async (pyq) => {
        if (!confirm("Delete this PYQ?")) return

        try {
            await databases.deleteDocument(
                DATABASE_ID,
                PYQS_COLLECTION_ID,
                pyq.$id
            )

            if (pyq.fileId && pyq.bucketId) {
                await storage.deleteFile(pyq.bucketId, pyq.fileId)
            }

            setPyqs(prev => prev.filter(p => p.$id !== pyq.$id))
        } catch (err) {
            console.error("Delete failed", err)
            alert("Failed to delete PYQ")
        }
    }

    const handleEdit = (pyq) => {
        onEdit?.(pyq)
    }



    if (loading) {
        return <p className="text-sm text-muted-foreground">Loading PYQs…</p>
    }

    if (!loading && pyqs.length === 0) {
        return <p className="text-sm text-muted-foreground">No PYQs uploaded yet</p>
    }

    return (
        <div className="space-y-4">
            {pyqs.map((pyq) => {
                const FileIcon =
                    pyq.fileType === "pdf"
                        ? FileText
                        : pyq.fileType === "link"
                            ? LinkIcon
                            : FileText

                return (
                    <Card key={pyq.$id} className="relative">

                        {/* Actions */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const url = storage.getFileView(pyq.bucketId, pyq.fileId)
                                    window.open(url, "_blank")
                                }}
                            >
                                View
                            </Button>

                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleEdit(pyq)}
                            >
                                Edit
                            </Button>

                            <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(pyq)}
                            >
                                Delete
                            </Button>
                        </div>

                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="space-y-2 pr-28">
                                <h3 className="text-lg font-semibold leading-tight">
                                    {highlight(pyq.title, searchTerm)}
                                </h3>

                                {/* File type */}
                                <div className="flex items-center gap-2 text-xs uppercase text-muted-foreground">
                                    <FileIcon className="w-4 h-4" />
                                    <span>{pyq.fileType}</span>
                                </div>

                                {/* Metadata (Resources-style) */}
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p>
                                        <strong>Program:</strong>{" "}
                                        {programMap?.[pyq.programId]?.name || "—"}
                                    </p>

                                    <p>
                                        <strong>Semester:</strong> {pyq.semester}
                                    </p>

                                    <p>
                                        <strong>Branch:</strong>{" "}
                                        {syllabusMap[
                                            subjectMap[pyq.subjectId]?.syllabusId
                                        ]?.branch || "—"}
                                    </p>

                                    <p>
                                        <strong>Subject:</strong>{" "}
                                        {subjectMap[pyq.subjectId]?.subjectName || "—"}
                                    </p>

                                    {pyq.unitId && (
                                        <p>
                                            <strong>Unit:</strong>{" "}
                                            {unitMap?.[pyq.unitId]?.title || "—"}
                                        </p>
                                    )}

                                    <p>
                                        <strong>Year:</strong> {pyq.year}
                                    </p>
                                </div>

                                {/* Description */}
                                {pyq.description && (
                                    <p className="text-sm text-muted-foreground pt-2">
                                        {pyq.description}
                                    </p>
                                )}
                            </div>




                        </CardContent>
                    </Card>
                )
            })}

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

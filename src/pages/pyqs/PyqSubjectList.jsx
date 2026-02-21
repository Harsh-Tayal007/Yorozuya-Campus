import { useParams, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { databases, storage } from "@/lib/appwrite"
import { BackButton, Breadcrumbs, ErrorState, FileTypeBadge, LoadingCard, SyllabusListSkeleton } from "@/components"
import { formatFileSize } from "@/utils/formatFileSize"
import PyqPreviewModal from "./PyqPreviewModal"

import {
    getPyqsForSubject,
} from "@/services/pyqService"
import { DATABASE_ID, SUBJECTS_COLLECTION_ID } from "@/config/appwrite"
import { isMobileDevice } from "@/utils/isMobileDevice"
import { useQuery } from "@tanstack/react-query"


const PyqSubjectList = ({
    programId: propProgramId,
    branchName: propBranchName,
    isDashboard
}) => {
    const params = useParams()

    const programId = propProgramId ?? params.programId
    const branchName = propBranchName ?? params.branchName
    const semester = params.semester
    const subjectId = params.subjectId

    const [pyqs, setPyqs] = useState([])
    const [loading, setLoading] = useState(true)

    const [previewPyq, setPreviewPyq] = useState(null)

    const [error, setError] = useState(null)

    const location = useLocation()
    const initialSubjectName = location.state?.subjectName

    const [currentSubject, setCurrentSubject] = useState(
        initialSubjectName ? { subjectName: initialSubjectName } : null
    )



    useEffect(() => {
        if (!subjectId || initialSubjectName) return

        const fetchSubject = async () => {

            const res = await databases.getDocument(
                DATABASE_ID,
                SUBJECTS_COLLECTION_ID,
                subjectId
            )
            console.log("Fetched subject:", res)
            setCurrentSubject(res)

        }

        fetchSubject()
    }, [subjectId, initialSubjectName])


    const decodedBranch = branchName
        ? decodeURIComponent(branchName)
        : null

    const programBase = `/programs/${programId}/branches/${branchName}`
    const dashboardBase = "/dashboard/pyqs"

    const basePyqPath = isDashboard
        ? dashboardBase
        : `${programBase}/pyqs`

    const branchBasePath = isDashboard
        ? "/dashboard"
        : programBase

    const {
        data: program
    } = useQuery({
        queryKey: ["program", programId],
        queryFn: () => getProgramById(programId),
        enabled: !!programId,
    })


    useEffect(() => {
        const fetchPyqs = async () => {
            try {
                const data = await getPyqsForSubject({
                    programId,
                    semester: Number(semester),
                    subjectId,
                })
                setPyqs(data)
            } catch (err) {
                setError(true)
            } finally {
                setLoading(false)
            }
        }


        fetchPyqs()
    }, [programId, semester, subjectId])

    // handlers
    const handleView = (pyq) => {
        if (isMobileDevice()) {
            const url = storage.getFileView(pyq.bucketId, pyq.fileId)
            window.open(url, "_blank")
            return
        }

        setPreviewPyq(pyq)
    }


    const handleDownload = (pyq) => {
        const url = storage.getFileDownload(pyq.bucketId, pyq.fileId)
        window.open(url, "_blank")
    }


    return (
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

            <BackButton
                to={`${basePyqPath}/semester/${semester}`}
                label={`Semester ${semester}`}
            />

            <Breadcrumbs
  overrides={{
    ...(program?.name && {
      [programId]: program.name,
    }),
    ...(currentSubject?.subjectName && {
      [subjectId]: currentSubject.subjectName,
    }),
  }}
/>

            {/* 📝 Page Header */}
            <div>
                <h1 className="text-2xl font-bold">PYQs</h1>
                <p className="text-muted-foreground">
                    Computer Science Engineering
                </p>
            </div>

            {/* 📄 PYQ List */}
            {loading ? (
                <SyllabusListSkeleton count={4} />
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

    cursor-default
    transition-all duration-200
    hover:bg-muted/40
    hover:shadow-lg
    hover:-translate-y-[2px]
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

                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {pyq.unit && (
                                        <Badge variant="secondary">
                                            Unit {pyq.unit.order}: {pyq.unit.title}
                                        </Badge>
                                    )}

                                    {pyq.fileSize && (
                                        <Badge
                                            variant="secondary"
                                            className="text-xs font-normal opacity-80"
                                        >
                                            {formatFileSize(pyq.fileSize)}
                                        </Badge>
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
            {!isMobileDevice() && (
                <PyqPreviewModal
                    pyq={previewPyq}
                    open={!!previewPyq}
                    onClose={() => setPreviewPyq(null)}
                />
            )}

        </div>
    )
}

export default PyqSubjectList

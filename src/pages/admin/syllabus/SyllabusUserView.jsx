import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getSyllabusByContext } from "@/services/syllabusService"

import { getPdfViewUrl } from "@/services/storageService"

import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { BackButton, Breadcrumbs } from "@/components"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileTypeBadge } from "@/components";
import { formatFileSize } from "@/utils/formatFileSize"
import { PdfPreviewModal } from "@/components";
import { storage } from "@/lib/appwrite";
import { STORAGE_BUCKET_ID, SUBJECTS_COLLECTION_ID, SYLLABUS_COLLECTION_ID } from "@/config/appwrite";
import { buildSyllabusFilename } from "@/utils/filenameUtils";
import { downloadFileXHR } from "@/services/downloadService";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";




const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SYLLABUS_COLLECTION = SYLLABUS_COLLECTION_ID;
const SUBJECTS_COLLECTION = SUBJECTS_COLLECTION_ID;
const SYLLABUS_BUCKET_ID = STORAGE_BUCKET_ID


export default function SyllabusUserView() {

    const { programId, branchName, semester } = useParams()

    const decodedBranch = decodeURIComponent(branchName)

    const [previewFile, setPreviewFile] = useState(null)

    const {
        data: syllabus = null,
        isLoading: loadingSyllabus,
        error: syllabusError,
    } = useQuery({
        queryKey: ["syllabus", programId, decodedBranch, semester],
        queryFn: () =>
            getSyllabusByContext({
                programId,
                branch: decodedBranch,
                semester: Number(semester),
            }),
        enabled: !!programId && !!decodedBranch && !!semester,
    });

    const {
        data: subjects = [],
        isLoading: loadingSubjects,
        error: subjectsError,
    } = useQuery({
        queryKey: ["syllabus-subjects", programId, decodedBranch, semester],
        queryFn: () =>
            getSubjectsBySemesterContext({
                programId,
                branch: decodedBranch,
                semester: Number(semester),
            }),
        enabled: !!programId && !!decodedBranch && !!semester,
    });

    const {
        data: fileSizes = {},
    } = useQuery({
        queryKey: ["syllabus-file-sizes", subjects],
        queryFn: async () => {
            const sizes = {};

            await Promise.all(
                subjects.map(async (subject) => {
                    if (!subject.pdfFileId) return;

                    const file = await storage.getFile(
                        SYLLABUS_BUCKET_ID,
                        subject.pdfFileId
                    );

                    sizes[subject.pdfFileId] = file.sizeOriginal;
                })
            );

            return sizes;
        },
        enabled: subjects.length > 0,
    });


    // 🔒 In-memory download cache
    const downloadCache = new Map();

    // helper function
    const isMobileDevice = () =>
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

    const handleView = (subject) => {
        if (isMobileDevice()) {
            // Mobile → open directly
            const url = storage.getFileView(
                SYLLABUS_BUCKET_ID,
                subject.pdfFileId
            )
            window.open(url, "_blank")
            return
        }

        // Desktop → modal preview
        setPreviewFile({
            fileId: subject.pdfFileId,
            bucketId: SYLLABUS_BUCKET_ID,
            title: subject.subjectName,
        })
    }


    const handleDownload = (subject) => {
        downloadFileXHR({
            url: getPdfViewUrl(subject.pdfFileId),

            fileName: buildSyllabusFilename({
                subjectName: subject.subjectName,
                semester,
            }),

            onError: () => {
                console.error("Failed to download syllabus")
            },
        })
    }

    const triggerDownload = (url, filename) => {
        const link = document.createElement("a")
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }


    async function getSyllabus(programId, branch, semester) {
        const res = await databases.listDocuments(
            DATABASE_ID,
            SYLLABUS_COLLECTION,
            [
                Query.equal("programId", programId),
                Query.equal("branch", branch),
                Query.equal("semester", Number(semester)),
                Query.limit(1),
            ]
        );


        return res.documents[0];
    }

    async function getSubjectsBySyllabusId(syllabusId) {
        const res = await databases.listDocuments(
            DATABASE_ID,
            SUBJECTS_COLLECTION,
            [
                Query.equal("syllabusId", syllabusId),
                Query.orderAsc("subjectName"),
            ]
        );

        return res.documents;
    }

    async function getSubjectsBySemesterContext({ programId, branch, semester }) {
        // 1️⃣ Get all syllabi for this semester
        const syllabusRes = await databases.listDocuments(
            DATABASE_ID,
            SYLLABUS_COLLECTION,
            [
                Query.equal("programId", programId),
                Query.equal("branch", branch),
                Query.equal("semester", Number(semester)),
            ]
        );

        const syllabusIds = syllabusRes.documents.map(doc => doc.$id);

        if (!syllabusIds.length) return [];

        // 2️⃣ Get subjects belonging to ANY of these syllabi
        const subjectsRes = await databases.listDocuments(
            DATABASE_ID,
            SUBJECTS_COLLECTION,
            [
                Query.equal("syllabusId", syllabusIds),
                Query.orderAsc("subjectName"),
            ]
        );

        return subjectsRes.documents;
    }

    /* 🌀 Loading */
    if (loadingSyllabus || loadingSubjects) {
        return <p className="p-6 text-muted-foreground">Loading syllabus…</p>
    }

    /* ❌ Error */
    if (syllabusError || subjectsError) {
        return <p className="p-6 text-destructive">{error}</p>
    }

    /* ⚠️ Empty */
    if (!syllabus) {
        return <p className="p-6">No syllabus available.</p>
    }


    const breadcrumbItems = [
        { label: "B.Tech", href: "/" },
        {
            label: decodedBranch,
            href: `/programs/${programId}/branches/${branchName}`,
        },
        {
            label: "Syllabus",
            href: `/programs/${programId}/branches/${branchName}/syllabus`,
        },
        {
            label: `Semester ${semester}`,
        },
    ]



    return (
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
            <div className="flex items-center gap-4">
                <BackButton
                    to={`/programs/${programId}/branches/${branchName}/syllabus`}
                    label="Syllabus"
                />
            </div>

            <Breadcrumbs items={breadcrumbItems} />

            {/* 🧾 Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold">
                    Syllabus
                </h1>

                <p className="text-muted-foreground">
                    {decodedBranch}
                </p>

            </div>


            {/* 📘 Syllabus Subjects */}
            {loadingSyllabus || loadingSubjects ? (
                <p className="text-muted-foreground">Loading syllabus...</p>
            ) : subjects.length === 0 ? (
                <p className="text-muted-foreground">
                    No subjects uploaded for this semester yet.
                </p>
            ) : (
                <div className="space-y-4">
                    {subjects.map((subject) => (
                        <Card
                            key={subject.$id}
                            className="
    p-4
    flex flex-col gap-4
    md:flex-row md:items-center md:justify-between

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
                                        fileType="pdf"
                                        onPreview={() => handleView(subject)}
                                    />

                                    <p className="font-medium">
                                        {subject.subjectName}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    {subject.description && (
                                        <span>{subject.description}</span>
                                    )}

                                    {subject.description && fileSizes[subject.pdfFileId] && (
                                        <span className="opacity-60">•</span>
                                    )}

                                    {fileSizes[subject.pdfFileId] && (
                                        <Badge variant="secondary" className="text-xs font-normal">
                                            {formatFileSize(fileSizes[subject.pdfFileId])}
                                        </Badge>
                                    )}

                                </div>
                            </div>

                            {/* Right */}
                            <div className="flex gap-2 md:shrink-0">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleView(subject)}
                                >
                                    View
                                </Button>

                                <Button
                                    size="sm"
                                    onClick={() => handleDownload(subject)}
                                >
                                    Download
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {!isMobileDevice() && (
                <PdfPreviewModal
                    open={!!previewFile}
                    fileId={previewFile?.fileId}
                    bucketId={previewFile?.bucketId}
                    title={previewFile?.title}
                    onClose={() => setPreviewFile(null)}
                />
            )}

        </div>
    )

}

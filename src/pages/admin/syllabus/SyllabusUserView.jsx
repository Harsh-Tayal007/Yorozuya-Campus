import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { getSyllabusByContext } from "@/services/syllabusService"
import { getSubjectsBySyllabusIds } from "@/services/subjectService"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getPdfViewUrl } from "@/services/storageService"

import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SYLLABUS_COLLECTION = "syllabus";
const SUBJECTS_COLLECTION = "subjects";


export default function SyllabusUserView() {
    const [syllabus, setSyllabus] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const [subjects, setSubjects] = useState([]);
    const { programId, branchName, semester } = useParams()

    const decodedBranch = decodeURIComponent(branchName)

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



    useEffect(() => {
        const fetchSyllabusAndSubjects = async () => {
            try {
                setLoading(true)

                const syllabusRes = await getSyllabusByContext({
                    programId,
                    branch: decodedBranch,
                    semester: Number(semester),
                })

                setSyllabus(syllabusRes)

                const subjectDocs = await getSubjectsBySemesterContext({
                    programId,
                    branch: decodedBranch,
                    semester: Number(semester),
                });

                setSubjects(subjectDocs);


            } catch (err) {
                console.error(err)
                setError("Syllabus not found")
            } finally {
                setLoading(false)
            }
        }

        if (programId && decodedBranch && semester) {
            fetchSyllabusAndSubjects()
        }

    }, [programId, decodedBranch, semester])


    /* 🌀 Loading */
    if (loading) {
        return <p className="p-6 text-muted-foreground">Loading syllabus…</p>
    }

    /* ❌ Error */
    if (error) {
        return <p className="p-6 text-destructive">{error}</p>
    }

    /* ⚠️ Empty */
    if (!syllabus) {
        return <p className="p-6">No syllabus available.</p>
    }

    return (
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
            {/* 🧭 Breadcrumb */}
            <p className="text-sm text-muted-foreground">
                B.Tech → {decodedBranch} → Semester {semester}
            </p>

            {/* 🧾 Header */}
            <div className="space-y-1">
                <h1 className="text-3xl font-bold">
                    {decodedBranch}
                </h1>
                <p className="text-muted-foreground">
                    Semester {semester} · B.Tech ·{" "}
                    {semester <= 2
                        ? "1st Year"
                        : semester <= 4
                            ? "2nd Year"
                            : semester <= 6
                                ? "3rd Year"
                                : "4th Year"}
                </p>
            </div>

            {/* 📘 Subjects */}
            {subjects.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    No subjects uploaded for this semester yet.
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {subjects.map((subject, index) => (
                        <Card
                            key={index}
                            className="cursor-pointer hover:shadow-lg transition"
                            onClick={() =>
                                window.open(
                                    getPdfViewUrl(subject.pdfFileId),
                                    "_blank"
                                )
                            }
                        >
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    📄 {subject.subjectName}
                                </CardTitle>

                                {subject.description && (
                                    <CardDescription>
                                        {subject.description}
                                    </CardDescription>
                                )}
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

}

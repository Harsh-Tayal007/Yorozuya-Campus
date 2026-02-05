import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "@/components/ui/select"

import { databases, storage } from "@/lib/appwrite"
import { Query, ID } from "appwrite"

import { useAuth } from "@/context/AuthContext"
import {
    ACTIVITIES_COLLECTION_ID,
} from "@/config/appwrite"
import PyqList from "./PyqList"


const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const PROGRAMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROGRAMS_COLLECTION_ID
const SYLLABUS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SYLLABUS_COLLECTION_ID
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID
const PYQS_COLLECTION_ID =
    import.meta.env.VITE_APPWRITE_PYQS_COLLECTION_ID

const STORAGE_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID





const PyqUpload = () => {

    const { currentUser } = useAuth()

    const [form, setForm] = useState({
        programId: "",
        semester: "",
        subjectId: "",
        unitId: "",
        title: "",
        description: "",
        fileType: "",
        file: null,
    })

    const [programs, setPrograms] = useState([])
    const [loadingPrograms, setLoadingPrograms] = useState(false)
    const [semesters, setSemesters] = useState([])
    const [subjects, setSubjects] = useState([])
    const [loadingSubjects, setLoadingSubjects] = useState(false)
    const [units, setUnits] = useState([])
    const [loadingUnits, setLoadingUnits] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    const validateForm = () => {
        if (!form.programId) return "Program is required"
        if (!form.semester) return "Semester is required"
        if (!form.subjectId) return "Subject is required"
        if (!form.title.trim()) return "Title is required"
        if (!form.fileType) return "File type is required"
        if (!form.file) return "File is required"

        return null
    }

    const handleUpload = async () => {
        if (isUploading) return

        const error = validateForm()
        if (error) {
            alert(error)
            return
        }

        setIsUploading(true)

        const fileId = ID.unique()
        const docId = ID.unique()
        const year = new Date().getFullYear()

        try {
            const prefixedFile = new File(
                [form.file],
                `pyq_${Date.now()}_${form.file.name}`,
                { type: form.file.type }
            )

            await storage.createFile(
                STORAGE_BUCKET_ID,
                fileId,
                prefixedFile
            )

            await databases.createDocument(
                DATABASE_ID,
                PYQS_COLLECTION_ID,
                docId,
                {
                    title: form.title,
                    description: form.description || null,

                    programId: form.programId,
                    semester: String(form.semester), // ✅ FIX
                    subjectId: form.subjectId,
                    unitId: form.unitId || null,
                    year,

                    fileId,
                    bucketId: STORAGE_BUCKET_ID,
                    fileType: form.fileType,
                }
            )

            await databases.createDocument(
                DATABASE_ID,
                ACTIVITIES_COLLECTION_ID,
                ID.unique(),
                {
                    actorId: currentUser.$id,
                    actorName: currentUser.username || currentUser.name || "Admin",

                    action: "uploaded PYQ",
                    entityType: "PYQ",
                    entityId: docId,
                    entityName: form.title,
                }
            )



            alert("PYQ uploaded successfully 🎉")

            setForm({
                programId: "",
                semester: "",
                subjectId: "",
                unitId: "",
                title: "",
                description: "",
                fileType: "",
                file: null,
            })
        } catch (err) {
            console.error("Upload failed", err)

            try {
                await storage.deleteFile(STORAGE_BUCKET_ID, fileId)
            } catch (_) { }

            alert("Upload failed. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }




    useEffect(() => {
        if (!form.subjectId) return

        const fetchUnits = async () => {
            try {
                setLoadingUnits(true)

                const res = await databases.listDocuments(
                    DATABASE_ID,
                    UNITS_COLLECTION_ID,
                    [
                        Query.equal("subjectId", form.subjectId),
                        Query.orderAsc("order"),
                    ]
                )

                setUnits(res.documents)
            } catch (err) {
                console.error("Failed to fetch units", err)
                setUnits([])
            } finally {
                setLoadingUnits(false)
            }
        }

        fetchUnits()
    }, [form.subjectId])



    useEffect(() => {
        if (!form.programId || !form.semester) return

        const fetchSubjects = async () => {
            try {
                setLoadingSubjects(true)

                const res = await databases.listDocuments(
                    DATABASE_ID,
                    SYLLABUS_COLLECTION_ID,
                    [
                        Query.equal("programId", form.programId),
                        Query.equal("semester", form.semester),
                        Query.orderAsc("title"),
                    ]
                )

                setSubjects(res.documents)
            } catch (err) {
                console.error("Failed to fetch subjects (syllabus)", err)
                setSubjects([])
            } finally {
                setLoadingSubjects(false)
            }
        }

        fetchSubjects()
    }, [form.programId, form.semester])



    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                setLoadingPrograms(true)
                const res = await databases.listDocuments(
                    DATABASE_ID,
                    PROGRAMS_COLLECTION_ID,
                    [Query.orderAsc("name")]
                )
                setPrograms(res.documents)
            } catch (err) {
                console.error("Failed to fetch programs", err)
            } finally {
                setLoadingPrograms(false)
            }
        }

        fetchPrograms()
    }, [])

    const MOCK_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

    useEffect(() => {
        if (!form.programId) return

        setSemesters(MOCK_SEMESTERS)
    }, [form.programId])



    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }

    const selectedProgram = programs.find(
        (p) => p.$id === form.programId
    )



    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Upload PYQ</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Academic Scope */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Academic Scope</h3>

                        <Select
                            value={form.programId}
                            onValueChange={(value) => {
                                updateField("programId", value)
                                updateField("semester", "")
                                updateField("subjectId", "")
                                updateField("unitId", "")
                            }}
                        >

                            <SelectTrigger>
                                <SelectValue placeholder="Select Program" />
                            </SelectTrigger>
                            <SelectContent>
                                {loadingPrograms && (
                                    <SelectItem value="loading" disabled>
                                        Loading...
                                    </SelectItem>
                                )}

                                {!loadingPrograms && programs.length === 0 && (
                                    <SelectItem value="empty" disabled>
                                        No programs found
                                    </SelectItem>
                                )}

                                {programs.map((program) => (
                                    <SelectItem key={program.$id} value={program.$id}>
                                        {program.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>

                        </Select>

                        <Select
                            value={form.semester}
                            disabled={!form.programId}
                            onValueChange={(value) => {
                                updateField("semester", value)
                                updateField("subjectId", "")
                                updateField("unitId", "")
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Semester" />
                            </SelectTrigger>

                            <SelectContent>
                                {!form.programId && (
                                    <SelectItem value="disabled" disabled>
                                        Select program first
                                    </SelectItem>
                                )}

                                {semesters.map((sem) => (
                                    <SelectItem key={sem} value={sem}>
                                        Semester {sem}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>



                        <Select
                            value={form.subjectId}
                            disabled={!form.programId || !form.semester}
                            onValueChange={(value) => {
                                updateField("subjectId", value)
                                updateField("unitId", "")
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Subject" />
                            </SelectTrigger>

                            <SelectContent>
                                {loadingSubjects && (
                                    <SelectItem value="loading" disabled>
                                        Loading...
                                    </SelectItem>
                                )}

                                {!loadingSubjects && subjects.length === 0 && (
                                    <SelectItem value="empty" disabled>
                                        No subjects found
                                    </SelectItem>
                                )}

                                {subjects.map((subject) => (
                                    <SelectItem key={subject.$id} value={subject.$id}>
                                        {subject.title}
                                    </SelectItem>
                                ))}

                            </SelectContent>
                        </Select>


                        <Select
                            value={form.unitId}
                            disabled={!form.subjectId}
                            onValueChange={(value) => updateField("unitId", value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Unit (optional)" />
                            </SelectTrigger>

                            <SelectContent>
                                {loadingUnits && (
                                    <SelectItem value="loading" disabled>
                                        Loading...
                                    </SelectItem>
                                )}

                                {!loadingUnits && units.length === 0 && (
                                    <SelectItem value="empty" disabled>
                                        No units found
                                    </SelectItem>
                                )}

                                {units.map((unit) => (
                                    <SelectItem key={unit.$id} value={unit.$id}>
                                        {unit.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>


                    </div>

                    {/* File Metadata */}
                    <div className="space-y-4">
                        <h3 className="font-medium">File Details</h3>

                        <Input
                            placeholder="Title"
                            value={form.title}
                            onChange={(e) => updateField("title", e.target.value)}
                        />


                        <Textarea
                            placeholder="Description (optional)"
                            value={form.description}
                            onChange={(e) => updateField("description", e.target.value)}
                        />


                        <Select
                            value={form.fileType}
                            onValueChange={(value) => updateField("fileType", value)}
                        >

                            <SelectTrigger>
                                <SelectValue placeholder="Select File Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pdf">PDF</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="zip">ZIP</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-2">
                        <h3 className="font-medium">Upload File</h3>
                        <Input
                            type="file"
                            onChange={(e) => updateField("file", e.target.files[0])}
                        />
                    </div>

                    {/* Action */}
                    <div className="pt-4">
                        <Button
                            className="w-full"
                            onClick={handleUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? "Uploading..." : "Upload"}
                        </Button>

                    </div>
                </CardContent>
            </Card>

            <div className="mt-10">
                <h2 className="text-lg font-semibold mb-3">Recent PYQs</h2>
                <PyqList limit={5} showViewMore />
            </div>
        </div>


    )
}

export default PyqUpload

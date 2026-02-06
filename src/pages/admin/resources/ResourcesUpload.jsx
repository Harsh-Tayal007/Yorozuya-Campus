import { useEffect, useRef, useState } from "react"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUnitsBySubject } from "@/services/unitService"
import { getSyllabusByProgram } from "@/services/syllabusService"
import { getPrograms } from "@/services/programService"
import { createResource, updateResource } from "@/services/resourceService"
import { Loader2 } from "lucide-react"
import ResourcesList from "./ResourcesList"
import { databases } from "@/lib/appwrite"
import { DATABASE_ID, RESOURCES_COLLECTION_ID } from "@/config/appwrite"

import { useAuth } from "@/context/AuthContext"
import { getSubjectsBySyllabusIds } from "@/services/subjectService"


export default function ResourcesUpload() {

    // selection states
    const [programId, setProgramId] = useState("")
    const [semester, setSemester] = useState("")
    const [branch, setBranch] = useState("")
    const [subjectId, setSubjectId] = useState("")
    const [unitId, setUnitId] = useState("")

    const [syllabusList, setSyllabusList] = useState([])
    const [units, setUnits] = useState([])
    const [resourceType, setResourceType] = useState("")

    // resource data
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [file, setFile] = useState(null)
    const [url, setUrl] = useState("")

    // dropdown data
    const [programs, setPrograms] = useState([])
    const [semesters, setSemesters] = useState([])

    const [isUploading, setIsUploading] = useState(false)

    const [resources, setResources] = useState([])

    const [editingResource, setEditingResource] = useState(null)
    const isEditMode = Boolean(editingResource)

    const fileInputRef = useRef(null)

    const { user, role } = useAuth()
    const canUpload = role === "admin" || role === "mod"

    const [subjects, setSubjects] = useState([])
    const [syllabusIds, setSyllabusIds] = useState([])


    useEffect(() => {
        if (!syllabusIds.length) {
            setSubjects([])
            setSubjectId("")
            return
        }

        const fetchSubjects = async () => {
            try {
                const list = await getSubjectsBySyllabusIds(syllabusIds)
                setSubjects(list)
            } catch (err) {
                console.error("Failed to load subjects", err)
            }
        }

        fetchSubjects()
    }, [syllabusIds])




    useEffect(() => {
        if (!programId || !semester) {
            setSyllabusList([])
            return
        }

        const fetchSyllabus = async () => {
            try {
                const list = await getSyllabusByProgram(programId)

                // filter by semester
                const filtered = list.filter(
                    (s) => Number(s.semester) === Number(semester)
                )

                setSyllabusList(filtered)

                const ids = filtered.map(s => s.$id)
                setSyllabusIds(ids)

            } catch (err) {
                console.error("Failed to load syllabus", err)
            }
        }

        fetchSyllabus()
    }, [programId, semester])

    const availableBranches = Array.from(
        new Set(syllabusList.map((s) => s.branch).filter(Boolean))
    )




    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const list = await getPrograms()
                setPrograms(list)
            } catch (err) {
                console.error("Failed to load programs", err)
            }
        }

        fetchPrograms()
    }, [])



    const MOCK_SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

    useEffect(() => {
        if (!programId) return

        setSemesters(MOCK_SEMESTERS)
    }, [programId])

    useEffect(() => {
        if (!subjectId) {
            setUnits([])
            return
        }

        const fetchUnits = async () => {
            try {
                const list = await getUnitsBySubject(subjectId)
                setUnits(list || [])
            } catch (err) {
                console.error("Failed to load units", err)
                setUnits([])
            }
        }

        fetchUnits()
    }, [subjectId])


    // useEffect(() => {
    //     console.log("units updated:", units)
    // }, [units])


    useEffect(() => {
        setSemester("")
        setBranch("")
        setSubjectId("")
        setUnitId("")
        setUnits([])
    }, [programId])

    useEffect(() => {
        setBranch("")
        setSubjectId("")
        setUnitId("")
        setUnits([])
    }, [semester])

    useEffect(() => {
        setSubjectId("")
        setUnitId("")
        setUnits([])
    }, [branch])

    const resetForm = () => {
        setProgramId("")
        setSemester("")
        setBranch("")
        setSubjectId("")
        setUnitId("")
        setResourceType("")
        setTitle("")
        setDescription("")
        setFile(null)
        setUrl("")
        setEditingResource(null)

        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }

    }

    const handleSubmit = async () => {
        if (!canUpload || isUploading) return

        try {
            setIsUploading(true)

            // basic validation
            if (
                !programId ||
                !semester ||
                !branch ||
                !subjectId ||
                !unitId ||
                !resourceType ||
                !title
            ) {
                alert("Please fill all required fields")
                return
            }

            if (resourceType === "link" && !url) {
                alert("Please provide a URL")
                return
            }

            if (resourceType !== "link" && !file && !isEditMode) {
                alert("Please select a file")
                return
            }

            if (isEditMode) {
                // 🔵 STEP 5 — UPDATE
                const updated = await updateResource(editingResource.$id, {
                    programId,
                    semester,
                    branch,
                    subjectId,
                    unitId,
                    title,
                    description,
                    type: resourceType,
                    url,
                }, user)

                setResources(prev =>
                    prev.map(r =>
                        r.$id === updated.$id ? updated : r
                    )
                )

                // 🔵 STEP 6 — EXIT EDIT MODE
                // setEditingResource(null)
                window.scrollTo({ top: 0, behavior: "smooth" })

                resetForm()
                alert("Resource updated successfully")
            } else {
                // 🟢 CREATE (your existing logic)
                const created = await createResource({
                    programId,
                    semester,
                    branch,
                    subjectId,
                    unitId,
                    title,
                    description,
                    resourceType,
                    file,
                    url,
                }, user)

                setResources(prev => [created, ...prev])
                alert("Resource uploaded successfully")

                resetForm()
            }

            // reset form (shared)
            setTitle("")
            setDescription("")
            setFile(null)
            setUrl("")
            setResourceType("")

            setEditingResource(null)
        } catch (err) {
            console.error(err)
            alert("Failed to save resource")
        } finally {
            setIsUploading(false)
        }
    }


    useEffect(() => {
        const fetchResources = async () => {
            try {
                const res = await databases.listDocuments(
                    DATABASE_ID,
                    RESOURCES_COLLECTION_ID
                )
                setResources(res.documents || [])
            } catch (err) {
                console.error(err)
            }
        }

        fetchResources()
    }, [])

    useEffect(() => {
        if (!editingResource) return

        setProgramId(editingResource.programId)

        setTitle(editingResource.title)
        setDescription(editingResource.description || "")
        setResourceType(editingResource.type)
        setUrl(editingResource.url || "")
    }, [editingResource])

    useEffect(() => {
        if (!editingResource) return
        if (!programId) return

        setSemester(String(editingResource.semester))
    }, [programId, editingResource])


    useEffect(() => {
        if (!editingResource) return
        if (syllabusList.length === 0) return

        setBranch(editingResource.branch)

    }, [syllabusList, editingResource])

    useEffect(() => {
        if (!editingResource) return
        if (!branch) return

        const subjectExists = subjects.some(
            (s) => s.$id === editingResource.subjectId
        )

        if (subjectExists) {
            setSubjectId(editingResource.subjectId)
        }
    }, [branch, subjects, editingResource])


    useEffect(() => {
        if (!editingResource) return
        if (units.length === 0) return

        setUnitId(editingResource.unitId)

    }, [units, editingResource])

    const handleCancelEdit = () => {
        setEditingResource(null)

        // clear selection states
        setProgramId("")
        setSemester("")
        setBranch("")
        setSubjectId("")
        setUnitId("")
        setUnits([])
        setSyllabusList([])

        // clear resource fields
        setTitle("")
        setDescription("")
        setFile(null)
        setUrl("")
        setResourceType("")

        // optional: scroll back to upload card top
        window.scrollTo({ top: 0, behavior: "smooth" })
    }



    return (
        <div className="min-h-screen bg-background pt-20 px-4">
            <div className="space-y-10">

                {/* Upload Form */}
                {canUpload && (
                    <Card className="max-w-3xl mx-auto">
                        <CardHeader>
                            <CardTitle>{isEditMode ? "Edit Resource" : "Upload Resource"}</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            {/* 🔽 EVERYTHING YOU ALREADY HAVE STAYS EXACTLY THE SAME */}

                            {/* Program */}
                            <Select modal={false} value={programId} onValueChange={setProgramId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Program" />
                                </SelectTrigger>
                                <SelectContent>
                                    {programs.map((prog) => (
                                        <SelectItem key={prog.$id} value={prog.$id}>
                                            {prog.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Semester */}
                            <Select modal={false} value={semester} onValueChange={setSemester}>
                                <SelectTrigger
                                    className={!programId ? "opacity-50 pointer-events-none" : ""}
                                >
                                    <SelectValue placeholder="Select Semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    {semesters.map((sem) => (
                                        <SelectItem key={sem} value={String(sem)}>
                                            Semester {sem}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Branch */}
                            <Select
                                modal={false}
                                value={branch}
                                onValueChange={setBranch}
                                disabled={!syllabusList.length}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Branch" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableBranches.map((b) => (
                                        <SelectItem key={b} value={b}>
                                            {b}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Subject */}
                            <Select
                                modal={false}
                                value={subjectId}
                                onValueChange={setSubjectId}
                                disabled={!subjects.length}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {subjects.map((sub) => (
                                        <SelectItem key={sub.$id} value={sub.$id}>
                                            {sub.subjectName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Unit */}
                            <Select
                                modal={false}
                                value={unitId}
                                onValueChange={setUnitId}
                                disabled={!subjectId || units.length === 0}
                            >
                                <SelectTrigger
                                    className={
                                        !subjectId || units.length === 0
                                            ? "opacity-50 pointer-events-none"
                                            : ""
                                    }
                                >
                                    <SelectValue
                                        placeholder={
                                            !subjectId
                                                ? "Select Subject first"
                                                : units.length === 0
                                                    ? "No units added yet"
                                                    : "Select Unit"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {units
                                        .sort((a, b) => a.order - b.order)
                                        .map((unit) => (
                                            <SelectItem key={unit.$id} value={unit.$id}>
                                                Unit {unit.order}: {unit.title}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>

                            {/* Resource Type */}
                            <Select modal={false} value={resourceType} onValueChange={setResourceType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Resource Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                    <SelectItem value="video">Video</SelectItem>
                                    <SelectItem value="link">Link</SelectItem>
                                    <SelectItem value="notes">Notes</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Title */}
                            <Input
                                placeholder="Resource Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />

                            {/* Description */}
                            <Textarea
                                placeholder="Description (optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />

                            {/* File / URL */}
                            <Input
                                type="file"
                                ref={fileInputRef}
                                disabled={resourceType === "link"}
                                onChange={(e) => setFile(e.target.files[0] || null)}
                            />

                            <Input
                                placeholder="Or paste URL"
                                disabled={resourceType !== "link"}
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />

                            <div className="flex gap-3">
                                <Button
                                    className="flex-1"
                                    onClick={handleSubmit}
                                    disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {editingResource ? "Updating..." : "Uploading..."}
                                        </span>
                                    ) : (
                                        editingResource ? "Update Resource" : "Upload Resource"
                                    )}
                                </Button>

                                {editingResource && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCancelEdit}
                                        disabled={isUploading}
                                    >
                                        Cancel
                                    </Button>
                                )}
                            </div>


                        </CardContent>
                    </Card>)}

                {/* 🔽 Resources List (below upload) */}
                <div className="max-w-3xl mx-auto">
                    <ResourcesList
                        resources={resources}
                        setResources={setResources}
                        onEdit={canUpload ? setEditingResource : null}
                    />

                </div>

            </div>
        </div>
    )

}

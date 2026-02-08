import { useState, useEffect, useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Search } from "lucide-react"

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
import { getSubjectsBySyllabusIds } from "@/services/subjectService"


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

    const [branch, setBranch] = useState("")
    const [syllabusList, setSyllabusList] = useState([])
    const [syllabusIds, setSyllabusIds] = useState([])

    const [editingPyq, setEditingPyq] = useState(null)

    const [refreshKey, setRefreshKey] = useState(0)

    const [pyqFilters, setPyqFilters] = useState({
        programId: "all",
        branch: "all",
        semester: "all",
        subjectId: "all",
        unitId: "all",
    })

    const [filterSyllabusList, setFilterSyllabusList] = useState([])

    const [filterSubjects, setFilterSubjects] = useState([])
    const [loadingFilterSubjects, setLoadingFilterSubjects] = useState(false)

    const [filterUnits, setFilterUnits] = useState([])
    const [loadingFilterUnits, setLoadingFilterUnits] = useState(false)

    const [searchTerm, setSearchTerm] = useState("")


    const isProgramSelected = pyqFilters.programId !== "all"
    const isBranchSelected = pyqFilters.branch !== "all"
    const isSemesterSelected = pyqFilters.semester !== "all"
    const isSubjectSelected = pyqFilters.subjectId !== "all"

    const uploadBranches = Array.from(
        new Set(syllabusList.map(s => s.branch).filter(Boolean))
    )


    const filterBranches = Array.from(
        new Set(filterSyllabusList.map(s => s.branch).filter(Boolean))
    )




    const fileInputRef = useRef(null)

    const isEditMode = Boolean(editingPyq)


    // Helper functions

    const updatePyqFilter = (key, value) => {
        setPyqFilters(prev => ({
            ...prev,
            [key]: value,
        }))
    }

    const resetDependentPyqFilters = (keys) => {
        setPyqFilters(prev => {
            const updated = { ...prev }
            keys.forEach(k => (updated[k] = "all"))
            return updated
        })
    }


    const validateForm = () => {
        if (!form.programId) return "Program is required"
        if (!form.semester) return "Semester is required"
        if (!form.subjectId) return "Subject is required"
        if (!form.title.trim()) return "Title is required"
        if (!editingPyq && !form.file) {
            return "File is required"
        }
        if (!isEditMode && !form.file) {
            return "File is required"
        }


        return null
    }

    const resetForm = () => {
        setEditingPyq(null)
        setBranch("")
        setSyllabusList([])
        setSyllabusIds([])
        setSubjects([])
        setUnits([])

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

        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }

    }


    const handleUpload = async () => {
        const isEditMode = Boolean(editingPyq)
        if (isUploading) return

        const error = validateForm(isEditMode)
        if (error) {
            alert(error)
            return
        }

        setIsUploading(true)

        try {
            let fileId = editingPyq?.fileId || null
            let bucketId = editingPyq?.bucketId || STORAGE_BUCKET_ID

            // ─────────────────────────────
            // FILE HANDLING
            // ─────────────────────────────
            if (form.file) {
                const newFileId = ID.unique()

                const prefixedFile = new File(
                    [form.file],
                    `pyq_${Date.now()}_${form.file.name}`,
                    { type: form.file.type }
                )

                // 1️⃣ Upload new file
                await storage.createFile(
                    STORAGE_BUCKET_ID,
                    newFileId,
                    prefixedFile
                )

                // 2️⃣ Delete old file (edit mode only)
                if (editingPyq?.fileId && editingPyq?.bucketId) {
                    await storage.deleteFile(
                        editingPyq.bucketId,
                        editingPyq.fileId
                    )
                }

                fileId = newFileId
                bucketId = STORAGE_BUCKET_ID
            }

            // ─────────────────────────────
            // DATABASE WRITE
            // ─────────────────────────────
            let pyqId

            if (isEditMode) {
                pyqId = editingPyq.$id

                await databases.updateDocument(
                    DATABASE_ID,
                    PYQS_COLLECTION_ID,
                    pyqId,
                    {
                        title: form.title,
                        description: form.description || null,
                        programId: form.programId,
                        semester: String(form.semester),
                        subjectId: form.subjectId,
                        unitId: form.unitId || null,
                        fileId,
                        bucketId,
                        fileType: form.fileType,
                    }
                )
            } else {
                pyqId = ID.unique()

                await databases.createDocument(
                    DATABASE_ID,
                    PYQS_COLLECTION_ID,
                    pyqId,
                    {
                        title: form.title,
                        description: form.description || null,
                        programId: form.programId,
                        semester: String(form.semester),
                        subjectId: form.subjectId,
                        unitId: form.unitId || null,
                        year: new Date().getFullYear(),
                        fileId,
                        bucketId,
                        fileType: form.fileType,
                    }
                )
            }

            // ─────────────────────────────
            // ACTIVITY LOG
            // ─────────────────────────────
            await databases.createDocument(
                DATABASE_ID,
                ACTIVITIES_COLLECTION_ID,
                ID.unique(),
                {
                    actorId: currentUser.$id,
                    actorName:
                        currentUser.username ||
                        currentUser.name ||
                        "Admin",

                    action: isEditMode ? "updated PYQ" : "uploaded PYQ",
                    entityType: "PYQ",
                    entityId: pyqId,
                    entityName: form.title,
                }
            )

            // ─────────────────────────────
            // UI SYNC
            // ─────────────────────────────
            setRefreshKey(prev => prev + 1)

            resetForm()
            window.scrollTo({ top: 0, behavior: "smooth" })
        } catch (err) {
            console.error(err)
            alert("Something went wrong while saving PYQ")
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
        if (!syllabusIds.length) {
            setSubjects([])
            updateField("subjectId", "")
            return
        }

        getSubjectsBySyllabusIds(syllabusIds)
            .then(setSubjects)
            .catch(console.error)
    }, [syllabusIds])



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

    useEffect(() => {
        if (
            !pyqFilters.programId ||
            pyqFilters.programId === "all"
        ) {
            setFilterSyllabusList([])
            return
        }

        databases
            .listDocuments(
                DATABASE_ID,
                SYLLABUS_COLLECTION_ID,
                [Query.equal("programId", pyqFilters.programId)]
            )
            .then(res => setFilterSyllabusList(res.documents))
            .catch(() => setFilterSyllabusList([]))
    }, [pyqFilters.programId])


    // Effect A
    useEffect(() => {
        if (!editingPyq) return
        if (!semesters.length) return

        setForm(prev => ({
            ...prev,
            semester: Number(editingPyq.semester),
        }))
    }, [semesters, editingPyq])



    const updateField = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }))
    }


    useEffect(() => {
        if (!branch || !form.semester) {
            setSyllabusIds([])
            return
        }

        const filtered = syllabusList.filter(
            s =>
                s.branch === branch &&
                Number(s.semester) === Number(form.semester)
        )

        setSyllabusIds(filtered.map(s => s.$id))
    }, [branch, form.semester, syllabusList])


    useEffect(() => {
        if (!form.programId) {
            setSyllabusList([])
            return
        }

        databases
            .listDocuments(
                DATABASE_ID,
                SYLLABUS_COLLECTION_ID,
                [Query.equal("programId", form.programId)]
            )
            .then(res => setSyllabusList(res.documents))
            .catch(console.error)
    }, [form.programId])

    useEffect(() => {
        if (pyqFilters.programId === "all") {
            setFilterSubjects([])
            return
        }

        let relevantSyllabus = filterSyllabusList

        if (pyqFilters.branch !== "all") {
            relevantSyllabus = relevantSyllabus.filter(
                s => s.branch === pyqFilters.branch
            )
        }

        if (pyqFilters.semester !== "all") {
            relevantSyllabus = relevantSyllabus.filter(
                s => Number(s.semester) === Number(pyqFilters.semester)
            )
        }

        const syllabusIds = relevantSyllabus.map(s => s.$id)

        if (!syllabusIds.length) {
            setFilterSubjects([])
            return
        }

        setLoadingFilterSubjects(true)

        getSubjectsBySyllabusIds(syllabusIds)
            .then(setFilterSubjects)
            .catch(() => setFilterSubjects([]))
            .finally(() => setLoadingFilterSubjects(false))
    }, [
        pyqFilters.programId,
        pyqFilters.branch,
        pyqFilters.semester,
        filterSyllabusList,
    ])


    useEffect(() => {
        if (
            !pyqFilters.subjectId ||
            pyqFilters.subjectId === "all"
        ) {
            setFilterUnits([])
            return
        }

        setLoadingFilterUnits(true)

        databases
            .listDocuments(
                DATABASE_ID,
                UNITS_COLLECTION_ID,
                [Query.equal("subjectId", pyqFilters.subjectId)]
            )
            .then(res => setFilterUnits(res.documents))
            .catch(() => setFilterUnits([]))
            .finally(() => setLoadingFilterUnits(false))
    }, [pyqFilters.subjectId])

    useEffect(() => {
        if (!editingPyq) return

        // STEP 1: only set independent fields
        setForm(prev => ({
            ...prev,
            programId: editingPyq.programId,
            title: editingPyq.title,
            description: editingPyq.description || "",
            fileType: editingPyq.fileType,
            file: null,
        }))
    }, [editingPyq])

    // effect B

    useEffect(() => {
        if (!editingPyq) return
        if (!syllabusList.length) return

        setBranch(
            syllabusList.find(
                s =>
                    s.programId === editingPyq.programId &&
                    s.semester === Number(editingPyq.semester)
            )?.branch || ""
        )
    }, [syllabusList, editingPyq])

    useEffect(() => {
        if (
            !pyqFilters.branch ||
            pyqFilters.branch === 'all'
        ) {
            updatePyqFilter("subjectIds", [])
            return
        }

        const filteredSyllabusIds = syllabusList
            .filter(
                s =>
                    s.programId === pyqFilters.programId &&
                    s.branch === pyqFilters.branch &&
                    Number(s.semester) === Number(pyqFilters.semester)
            )
            .map(s => s.$id)

        if (!filteredSyllabusIds.length) {
            updatePyqFilter("subjectIds", [])
            return
        }

        getSubjectsBySyllabusIds(filteredSyllabusIds)
            .then(subjects => {
                updatePyqFilter(
                    "subjectIds",
                    subjects.map(s => s.$id)
                )
            })
            .catch(() => {
                updatePyqFilter("subjectIds", [])
            })
    }, [
        pyqFilters.branch,
        pyqFilters.programId,
        pyqFilters.semester,
        syllabusList,
    ])
    useEffect(() => {
        if (
            pyqFilters.programId === "all" ||
            pyqFilters.branch === "all" ||
            pyqFilters.semester === "all"
        ) {
            updatePyqFilter("subjectIds", [])
            return
        }

        const filteredSyllabusIds = filterSyllabusList
            .filter(
                s =>
                    s.programId === pyqFilters.programId &&
                    s.branch === pyqFilters.branch &&
                    Number(s.semester) === Number(pyqFilters.semester)
            )
            .map(s => s.$id)

        if (!filteredSyllabusIds.length) {
            updatePyqFilter("subjectIds", [])
            return
        }

        getSubjectsBySyllabusIds(filteredSyllabusIds)
            .then(subjects => {
                updatePyqFilter(
                    "subjectIds",
                    subjects.map(s => s.$id)
                )
            })
            .catch(() => {
                updatePyqFilter("subjectIds", [])
            })
    }, [
        pyqFilters.programId,
        pyqFilters.branch,
        pyqFilters.semester,
        filterSyllabusList,
    ])

    useEffect(() => {
        if (!editingPyq) return
        if (!subjects.length) return

        const subjectExists = subjects.some(
            s => s.$id === editingPyq.subjectId
        )

        if (subjectExists) {
            setForm(prev => ({
                ...prev,
                subjectId: editingPyq.subjectId,
                unitId: editingPyq.unitId || "",
            }))
        }
    }, [subjects, editingPyq])



    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>{isEditMode ? "Update PYQ" : "Upload PYQ"}</CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Academic Scope */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Academic Scope</h3>

                        <Select
                            modal={false}
                            value={form.programId}
                            onValueChange={(value) => {
                                updateField("programId", value)
                                updateField("semester", "")
                                updateField("subjectId", "")
                                updateField("unitId", "")
                                setBranch("")               // 🔥 REQUIRED
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
                            value={branch}
                            disabled={!uploadBranches.length}
                            onValueChange={(value) => {
                                setBranch(value)
                                updateField("subjectId", "")
                                updateField("unitId", "")
                            }}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Branch" />
                            </SelectTrigger>
                            <SelectContent>
                                {uploadBranches.map((b) => (
                                    <SelectItem key={b} value={b}>
                                        {b}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>



                        <Select
                            modal={false}
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
                            modal={false}
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
                                        {subject.subjectName}
                                    </SelectItem>
                                ))}

                            </SelectContent>
                        </Select>


                        <Select
                            modal={false}
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
                            modal={false}
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
                            // key={fileInputKey}     // 🔥 forces remount
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) =>
                                updateField("file", e.target.files?.[0] || null)
                            }
                        />

                    </div>

                    {/* Action */}
                    <div className="pt-4 flex gap-3">
                        <Button
                            className="flex-1"
                            onClick={handleUpload}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {isEditMode ? "Updating..." : "Uploading..."}
                                </span>
                            ) : (
                                isEditMode ? "Update PYQ" : "Upload"
                            )}
                        </Button>

                        {isEditMode && (
                            <Button
                                type="button"
                                variant="outline"
                                // size="sm"
                                disabled={isUploading}
                                onClick={() => {
                                    setEditingPyq(null)
                                    setBranch("")
                                    setSyllabusList([])
                                    setSyllabusIds([])
                                    setSubjects([])
                                    setUnits([])
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
                                    window.scrollTo({ top: 0, behavior: "smooth" })
                                }}
                            >
                                Cancel
                            </Button>
                        )}
                    </div>

                </CardContent>
            </Card>

            <div className="space-y-4">
                {/* Search */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search PYQs by title..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-10"
                    />
                </div>

                {/* Filters */}
                <Card className="mb-8">
                    <CardContent className="pt-0">
                        <h3 className="mb-3 text-sm font-medium text-muted-foreground">
                            Filter PYQs
                        </h3>

                        <div className="space-y-4">
                            {/* Row 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Program */}
                                {/* Filter by Program */}
                                <Select
                                    modal={false}
                                    value={pyqFilters.programId}
                                    onValueChange={(value) => {
                                        updatePyqFilter(
                                            "programId",
                                            value
                                        )

                                        resetDependentPyqFilters([
                                            "branch",
                                            "semester",
                                            "subjectId",
                                            "unitId",
                                        ])
                                    }}
                                >
                                    <SelectTrigger className="pl-9 h-10 w-full focus-visible:ring-2 focus-visible:ring-ring">
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">All Programs</SelectItem>
                                        {programs.map(program => (
                                            <SelectItem key={program.$id} value={program.$id}>
                                                {program.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Filter by Brach */}
                                <Select
                                    value={pyqFilters.branch}
                                    disabled={!isProgramSelected}
                                    onValueChange={(value) => {
                                        updatePyqFilter("branch", value)
                                        resetDependentPyqFilters(["semester", "subjectId", "unitId"])
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">All Branches</SelectItem>

                                        {filterBranches.map((b) => (
                                            <SelectItem key={b} value={b}>
                                                {b}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Filter by Semester */}
                                <Select
                                    modal={false}
                                    value={pyqFilters.semester}
                                    disabled={!isProgramSelected}
                                    onValueChange={(value) => {
                                        updatePyqFilter("semester", value)
                                        resetDependentPyqFilters(["subjectId", "unitId"])
                                    }}
                                >
                                    <SelectTrigger className="pl-9 h-10 w-full focus-visible:ring-2 focus-visible:ring-ring">
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">All Semesters</SelectItem>

                                        {MOCK_SEMESTERS.map(sem => (
                                            <SelectItem key={sem} value={String(sem)}>
                                                Semester {sem}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Row 2 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Filter by Subjects */}
                                <Select
                                    modal={false}
                                    value={pyqFilters.subjectId}
                                    disabled={!isProgramSelected || (!isBranchSelected && !isSemesterSelected)}
                                    onValueChange={(value) => {
                                        updatePyqFilter("subjectId", value)
                                        resetDependentPyqFilters(["unitId"])
                                    }}
                                >

                                    <SelectTrigger className="pl-9 h-10 w-full focus-visible:ring-2 focus-visible:ring-ring">
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">All Subjects</SelectItem>

                                        {loadingFilterSubjects && (
                                            <SelectItem value="loading" disabled>
                                                Loading...
                                            </SelectItem>
                                        )}

                                        {!loadingFilterSubjects && filterSubjects.length === 0 && (
                                            <SelectItem value="empty" disabled>
                                                No subjects found
                                            </SelectItem>
                                        )}

                                        {filterSubjects.map(subject => (
                                            <SelectItem key={subject.$id} value={subject.$id}>
                                                {subject.subjectName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Filter by Units */}
                                <Select
                                    modal={false}
                                    value={pyqFilters.unitId}
                                    disabled={!isSubjectSelected}
                                    onValueChange={(value) => {
                                        updatePyqFilter("unitId", value)
                                    }}
                                >
                                    <SelectTrigger className="pl-9 h-10 w-full focus-visible:ring-2 focus-visible:ring-ring">
                                        <SelectValue />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="all">All Units</SelectItem>

                                        {loadingFilterUnits && (
                                            <SelectItem value="loading" disabled>
                                                Loading...
                                            </SelectItem>
                                        )}

                                        {!loadingFilterUnits && filterUnits.length === 0 && (
                                            <SelectItem value="empty" disabled>
                                                No units found
                                            </SelectItem>
                                        )}

                                        {filterUnits.map(unit => (
                                            <SelectItem key={unit.$id} value={unit.$id}>
                                                {unit.title}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                        </div>

                    </CardContent>
                </Card>
            </div>


            <div className="mt-10">
                <h2 className="text-lg font-semibold mb-3">Recent PYQs</h2>
                <PyqList
                    limit={5}
                    refreshKey={refreshKey}
                    filters={pyqFilters}
                    searchTerm={searchTerm}
                    showViewMore
                    onEdit={(pyq) => {
                        setEditingPyq(pyq)
                        window.scrollTo({ top: 0, behavior: "smooth" })
                    }}
                />
            </div>
        </div>


    )
}

export default PyqUpload

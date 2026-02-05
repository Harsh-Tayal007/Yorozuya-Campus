import { useEffect, useState } from "react"

import { getUniversities } from "@/services/universityService"
import { getProgramsByUniversity } from "@/services/programService"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

import SyllabusForm from "./syllabusForm"
import SyllabusCard from "./syllabusCard"

import {
    createSyllabus,
    getSyllabusByProgram,
    updateSyllabus,
    deleteSyllabus,
} from "@/services/syllabusService"

import { getSubjectsBySyllabusIds } from "@/services/subjectService"

import { useAuth } from "@/context/AuthContext"


const SyllabusAdmin = () => {
    const [universities, setUniversities] = useState([])
    const [programs, setPrograms] = useState([])

    const [selectedUniversity, setSelectedUniversity] = useState("")
    const [selectedProgram, setSelectedProgram] = useState("")

    const [loading, setLoading] = useState(false)

    const [syllabusList, setSyllabusList] = useState([])
    const [editingSyllabus, setEditingSyllabus] = useState(null)

    const [statusMessage, setStatusMessage] = useState("")

    const [filterBranch, setFilterBranch] = useState("ALL")
    const [filterSemester, setFilterSemester] = useState("ALL")
    const [filterSubject, setFilterSubject] = useState("ALL")

    const [allSubjects, setAllSubjects] = useState([])



    const { user, role } = useAuth()

    const isAdmin = role === "admin"
    const isMod = role === "mod"

    const canCreateOrEdit = isAdmin || isMod
    const canDelete = isAdmin

    const [refreshKey, setRefreshKey] = useState(0)

    const reload = () => setRefreshKey(prev => prev + 1)

    const fetchSyllabus = async () => {
        if (!selectedProgram) return

        try {
            const list = await getSyllabusByProgram(selectedProgram)
            setSyllabusList(list)
        } catch (err) {
            console.error("Failed to load syllabus", err)
        }
    }


    useEffect(() => {
        fetchSyllabus()
    }, [refreshKey, selectedProgram])


    useEffect(() => {
        if (!syllabusList.length) {
            setAllSubjects([])
            return
        }

        const syllabusIds = syllabusList.map(s => s.$id)

        const loadSubjects = async () => {
            const subjects = await getSubjectsBySyllabusIds(syllabusIds)
            setAllSubjects(subjects)
        }

        loadSubjects()
    }, [syllabusList])




    /* ------------------ Fetch Universities ------------------ */
    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const list = await getUniversities()
                setUniversities(list)
            } catch (err) {
                console.error("Failed to load universities", err)
            }
        }

        fetchUniversities()
    }, [])

    /* ------------------ Fetch Programs (on University change) ------------------ */
    useEffect(() => {
        if (!selectedUniversity) {
            setPrograms([])
            setSelectedProgram("")
            return
        }

        const fetchPrograms = async () => {
            setLoading(true)
            try {
                const list = await getProgramsByUniversity(selectedUniversity)
                setPrograms(list)

            } catch (err) {
                console.error("Failed to load programs", err)
            } finally {
                setLoading(false)
            }
        }

        fetchPrograms()
    }, [selectedUniversity])


    /* ------------------ Fetch syllabus (on program change) ------------------ */

    useEffect(() => {
        if (!selectedProgram) {
            setSyllabusList([])
            setEditingSyllabus(null)
            return
        }

        fetchSyllabus()
        setEditingSyllabus(null)
    }, [selectedProgram])



    useEffect(() => {
        if (!statusMessage) return

        const timer = setTimeout(() => {
            setStatusMessage("")
        }, 3000)

        return () => clearTimeout(timer)
    }, [statusMessage])


    /* ------------------ Handlers ------------------ */

    const handleCreate = async (data) => {
        if (!canCreateOrEdit) return

        const syllabus = await createSyllabus({
            title: data.title,
            semester: data.semester,
            branch: data.branch,
            programId: selectedProgram,
            description: data.description,
        })

        setEditingSyllabus(null)
        setStatusMessage("Syllabus added successfully.")
        reload()

        return syllabus
    }

    const handleUpdate = async (data) => {
        if (!canCreateOrEdit) return

        try {
            await updateSyllabus(editingSyllabus.$id, data, user)
            setEditingSyllabus(null)
            setStatusMessage("Syllabus updated successfully.")
            reload()
        } catch (err) {
            console.error(err)
        }
    }



    const handleDelete = async (syllabus) => {
        if (!canDelete || !confirm("Delete this syllabus?")) return

        try {
            await deleteSyllabus(syllabus.$id, user, syllabus?.title)
            setStatusMessage("Syllabus deleted successfully.")
            reload()
        } catch (err) {
            console.error(err)
        }
    }


    const filteredSyllabus = syllabusList.filter(syllabus => {
        if (filterSubject === "ALL") return true

        return allSubjects.some(
            subj =>
                subj.syllabusId === syllabus.$id &&
                subj.subjectName === filterSubject
        )
    })



    const availableBranches = Array.from(
        new Set(
            syllabusList
                .map((s) => s.branch)
                .filter(Boolean)
        )
    )

    const availableSubjects = Array.from(
        new Set(allSubjects.map(s => s.subjectName))
    )




    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-semibold">Manage Syllabus</h1>
                <p className="text-sm text-muted-foreground">
                    University → Program → Syllabus
                </p>
            </div>

            {/* Context Selection */}
            <div className="space-y-2">
                <h2 className="text-lg font-medium">Selected Context</h2>

                <Card>

                    <CardHeader>
                        <CardTitle>Select Context</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        {/* University Select */}
                        <Select
                            value={selectedUniversity}
                            onValueChange={setSelectedUniversity}
                            disabled={!!editingSyllabus}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select University" />
                            </SelectTrigger>
                            <SelectContent>
                                {universities.map((uni) => (
                                    <SelectItem key={uni.$id} value={uni.$id}>
                                        {uni.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Program Select */}
                        <Select
                            value={selectedProgram}
                            onValueChange={setSelectedProgram}
                            disabled={!selectedUniversity || loading || !!editingSyllabus}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        !selectedUniversity
                                            ? "Select university first"
                                            : "Select Program"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {programs.map((prog) => (
                                    <SelectItem key={prog.$id} value={prog.$id}>
                                        {prog.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>


            <Separator />

            {/* Selected Hierarchy Context */}
            {selectedUniversity && selectedProgram && (
                <Card className="bg-muted/40 border-dashed">
                    <CardContent className="py-3 space-y-1">
                        <p className="text-sm">
                            <span className="font-medium">University:</span>{" "}
                            {universities.find(u => u.$id === selectedUniversity)?.name}
                        </p>
                        <p className="text-sm">
                            <span className="font-medium">Program:</span>{" "}
                            {programs.find(p => p.$id === selectedProgram)?.name}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Empty Hint */}
            {!selectedProgram && (
                <p className="text-sm text-muted-foreground">
                    Select a program to manage syllabus.
                </p>
            )}

            {/* Syllabus Form + List */}

            {statusMessage && (
                <p className="text-sm text-green-600 font-medium">
                    {statusMessage}
                </p>
            )}

            {selectedProgram && (
                <div className="space-y-6">
                    <h2 className="text-lg font-medium">
                        Add / Edit Syllabus
                    </h2>

                    {canCreateOrEdit && (
                        <SyllabusForm

                            programId={selectedProgram}
                            editingSyllabus={editingSyllabus}
                            onCancelEdit={() => setEditingSyllabus(null)}
                            onSubmit={editingSyllabus ? handleUpdate : handleCreate}
                            onSuccess={reload}
                        />
                    )}
                    {/* Filters */}
                    <Card className="bg-muted/30">
                        <CardContent className="py-4 space-y-4">
                            <h3 className="text-sm font-medium">Filter Syllabus</h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Branch Filter */}
                                <Select
                                    value={filterBranch}
                                    onValueChange={setFilterBranch}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by Branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Branches</SelectItem>

                                        {availableBranches.map((branch) => (
                                            <SelectItem key={branch} value={branch}>
                                                {branch}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>

                                </Select>

                                {/* Semester Filter */}
                                <Select
                                    value={filterSemester}
                                    onValueChange={setFilterSemester}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by Semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">All Semesters</SelectItem>
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                                            <SelectItem key={sem} value={String(sem)}>
                                                Semester {sem}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                {/* Subject Filter */}
                                <Select value={filterSubject} onValueChange={setFilterSubject}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Filter by Subject" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        <SelectItem value="ALL">All Subjects</SelectItem>

                                        {availableSubjects.map(subject => (
                                            <SelectItem key={subject} value={subject}>
                                                {subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                            </div>
                        </CardContent>
                    </Card>


                    <div className="space-y-3">
                        {/* List Header */}
                        <h2 className="text-lg font-medium">
                            Syllabus List{" "}
                            <span className="text-sm text-muted-foreground">
                                ({syllabusList.length})
                            </span>
                        </h2>

                        {filteredSyllabus.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No syllabus matches the selected filters.
                            </p>
                        ) : (
                            filteredSyllabus.map((syllabus) => (
                                <SyllabusCard
                                    key={syllabus.$id}
                                    syllabus={syllabus}
                                    onEdit={canCreateOrEdit ? setEditingSyllabus : null}
                                    onDelete={canDelete ? handleDelete : null}
                                    onView={(s) => navigate(`/admin/syllabus/${s.$id}`)}
                                />
                            ))
                        )}

                    </div>

                </div>
            )}
        </div>
    )

}

export default SyllabusAdmin

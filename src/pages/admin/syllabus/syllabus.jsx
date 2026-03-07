import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

import { useEffect, useMemo, useState } from "react"

import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"

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
} from "@/services/syllabus/syllabusService"

import { getSubjectsBySyllabusIds } from "@/services/syllabus/subjectService"

import { useAuth } from "@/context/AuthContext"
import { useNavigate } from "react-router-dom"


const SyllabusAdmin = () => {

    const [selectedUniversity, setSelectedUniversity] = useState("")
    const [selectedProgram, setSelectedProgram] = useState("")

    const [editingSyllabus, setEditingSyllabus] = useState(null)

    const [statusMessage, setStatusMessage] = useState("")

    const [filterBranch, setFilterBranch] = useState("ALL")
    const [filterSemester, setFilterSemester] = useState("ALL")
    const [filterSubject, setFilterSubject] = useState("ALL")

    const queryClient = useQueryClient()

    const navigate = useNavigate()

    const { user, role } = useAuth()

    const isAdmin = role === "admin"
    const isMod = role === "mod"

    const canCreateOrEdit = isAdmin || isMod
    const canDelete = isAdmin


    /* ------------------ Fetch Universities ------------------ */
    const { data: universities = [], error: uniError } = useQuery({
        queryKey: ["universities"],
        queryFn: getUniversities,
        staleTime: 1000 * 60 * 10, // 10 mins
        gcTime: 1000 * 60 * 30,
    })

    useEffect(() => {
        setSelectedProgram("")
        setEditingSyllabus(null)
        setFilterBranch("ALL")
        setFilterSemester("ALL")
        setFilterSubject("ALL")
        setStatusMessage("")
    }, [selectedUniversity])


    /* ------------------ Fetch Programs (on University change) ------------------ */
    const {
        data: programs = [],
        isLoading: programsLoading
    } = useQuery({
        queryKey: ["programs", selectedUniversity],
        queryFn: () => getProgramsByUniversity(selectedUniversity),
        enabled: !!selectedUniversity,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 20,
    })


    /* ------------------ Fetch syllabus (on program change) ------------------ */

    const {
        data: syllabusList = [],
        isLoading: syllabusLoading,
        isFetching: syllabusFetching,
    } = useQuery({
        queryKey: ["syllabus", selectedProgram],
        queryFn: () => getSyllabusByProgram(selectedProgram),
        enabled: !!selectedProgram,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 20,
    })
    
  // both false means refecth not happening, caching working
    // console.log("loading:", syllabusLoading)
    // console.log("fetching:", syllabusFetching)

    // Fetch Subjects
    const syllabusIds = useMemo(
        () => syllabusList.map((s) => s.$id).sort(),
        [syllabusList]
    )

    const { data: allSubjects = [] } = useQuery({
        queryKey: ["subjects", syllabusIds],
        queryFn: () => getSubjectsBySyllabusIds(syllabusIds),
        enabled: syllabusIds.length > 0,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 20,
    })

    /* ------------------ Handlers ------------------ */

    const createMutation = useMutation({
        mutationFn: createSyllabus,
        onSuccess: () => {
            queryClient.invalidateQueries(["syllabus", selectedProgram])
            setStatusMessage("Syllabus added successfully.")
            setEditingSyllabus(null)
        },
    })

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => updateSyllabus(id, data, user),
        onSuccess: () => {
            queryClient.invalidateQueries(["syllabus", selectedProgram])
            setStatusMessage("Syllabus updated successfully.")
            setEditingSyllabus(null)
        },
    })

    useEffect(() => {
        setEditingSyllabus(null)
    }, [selectedProgram])



    const deleteMutation = useMutation({
        mutationFn: (syllabus) =>
            deleteSyllabus(syllabus.$id, user, syllabus?.title),
        onSuccess: () => {
            queryClient.invalidateQueries(["syllabus", selectedProgram])
            setStatusMessage("Syllabus deleted successfully.")
        },
    })

    // For O(1) complexity instead of O(nXm)
    const subjectsMap = useMemo(() => {
        const map = {}

        allSubjects.forEach((subj) => {
            if (!map[subj.syllabusId]) {
                map[subj.syllabusId] = []
            }
            map[subj.syllabusId].push(subj)
        })

        return map
    }, [allSubjects])


    const filteredSyllabus = useMemo(() => {
        return syllabusList.filter((syllabus) => {
            const branchMatch =
                filterBranch === "ALL" || syllabus.branch === filterBranch

            const semesterMatch =
                filterSemester === "ALL" ||
                String(syllabus.semester) === filterSemester

            const subjectMatch =
                filterSubject === "ALL" ||
                allSubjects.some(
                    (subj) =>
                        subj.syllabusId === syllabus.$id &&
                        subj.subjectName === filterSubject
                )

            return branchMatch && semesterMatch && subjectMatch
        })
    }, [syllabusList, allSubjects, filterBranch, filterSemester, filterSubject])


    const availableBranches = useMemo(
        () =>
            Array.from(
                new Set(
                    syllabusList.map((s) => s.branch).filter(Boolean)
                )
            ),
        [syllabusList]
    )

    const availableSubjects = useMemo(
        () =>
            Array.from(
                new Set(allSubjects.map((s) => s.subjectName))
            ),
        [allSubjects]
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

                        {uniError && (
                            <p className="text-sm text-red-500">
                                {uniError.message || "Failed to load universities."}
                            </p>
                        )}

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
                            disabled={!selectedUniversity || programsLoading || !!editingSyllabus}
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
                            onSubmit={(data) => {
                                if (editingSyllabus) {
                                    updateMutation.mutate({
                                        id: editingSyllabus.$id,
                                        data,
                                    })
                                } else {
                                    createMutation.mutate({
                                        title: data.title,
                                        semester: data.semester,
                                        branch: data.branch,
                                        programId: selectedProgram,
                                        description: data.description,
                                    })
                                }
                            }}
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

                        {syllabusLoading && !syllabusList.length ? (
                            <p className="text-sm text-muted-foreground">
                                Loading syllabus...
                            </p>
                        ) : filteredSyllabus.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No syllabus matches the selected filters.
                            </p>
                        ) : (
                            filteredSyllabus.map((syllabus) => (
                                <SyllabusCard
                                    key={syllabus.$id}
                                    syllabus={syllabus}
                                    subjects={subjectsMap[syllabus.$id] || []}
                                    onEdit={
                                        canCreateOrEdit
                                            ? (syllabus) => setEditingSyllabus(syllabus)
                                            : null
                                    }
                                    onDelete={
                                        canDelete
                                            ? (syllabus) => deleteMutation.mutate(syllabus)
                                            : null
                                    }
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

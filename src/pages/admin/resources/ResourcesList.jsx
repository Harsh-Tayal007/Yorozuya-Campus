import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

import { getPrograms } from "@/services/programService"
import { getSyllabusByProgram } from "@/services/syllabusService"
import { getUnitsBySubject } from "@/services/unitService"

import { deleteResource } from "@/services/resourceService"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

import { Search } from "lucide-react"

import { useAuth } from "@/context/AuthContext"

export default function ResourcesList({ resources, setResources, onEdit }) {

    const [programMap, setProgramMap] = useState({})
    const [subjectMap, setSubjectMap] = useState({})
    const [unitMap, setUnitMap] = useState({})

    const [filterProgram, setFilterProgram] = useState("all")
    const [filterSemester, setFilterSemester] = useState("all")

    const [filterSubject, setFilterSubject] = useState("all")

    const [filterUnit, setFilterUnit] = useState("all")

    const [searchTerm, setSearchTerm] = useState("")
    const [debouncedSearch, setDebouncedSearch] = useState("")

    const { user, role } = useAuth()

    const canEdit = role === "admin" || role === "mod"
    const canDelete = role === "admin"



    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim().toLowerCase())
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm])



    useEffect(() => {
        setFilterUnit("all")
    }, [filterSubject])


    const openResource = (r) => {
        if (r.type === "link") {
            window.open(r.url, "_blank")
            return
        }

        // file-based resource (pdf / notes / video)
        const fileUrl = `${import.meta.env.VITE_APPWRITE_ENDPOINT}/storage/buckets/${import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID}/files/${r.fileId}/view?project=${import.meta.env.VITE_APPWRITE_PROJECT_ID}`

        window.open(fileUrl, "_blank")
    }

    const handleDelete = async (resource) => {
        const confirmed = window.confirm(
            `Delete resource "${resource.title}"?`
        )

        if (!canDelete || !confirmed) return

        try {
            await deleteResource(resource, user)
            setResources((prev) =>
                prev.filter((r) => r.$id !== resource.$id)
            )
        } catch (err) {
            console.error(err)
            alert("Failed to delete resource")
        }
    }


    useEffect(() => {
        const loadPrograms = async () => {
            const list = await getPrograms()
            const map = {}

            list.forEach(p => {
                map[p.$id] = p.name
            })

            setProgramMap(map)
        }

        loadPrograms()
    }, [])





    useEffect(() => {
        if (!resources.length) return

        const loadSubjectsAndUnits = async () => {
            const subjectMapTemp = {}
            const unitMapTemp = {}

            // 1️⃣ Get unique programIds & subjectIds from resources
            const programIds = [...new Set(resources.map(r => r.programId))]
            const subjectIds = [...new Set(resources.map(r => r.subjectId))]

            // 2️⃣ Fetch subjects per program
            for (const programId of programIds) {
                try {
                    const subjects = await getSyllabusByProgram(programId)
                    subjects.forEach(sub => {
                        subjectMapTemp[sub.$id] = sub.title
                    })
                } catch (err) {
                    console.error("Failed to load subjects", err)
                }
            }

            // 3️⃣ Fetch units per subject
            for (const subjectId of subjectIds) {
                try {
                    const units = await getUnitsBySubject(subjectId)
                    units.forEach(unit => {
                        unitMapTemp[unit.$id] = unit.title
                    })
                } catch (err) {
                    console.error("Failed to load units", err)
                }
            }

            setSubjectMap(subjectMapTemp)
            setUnitMap(unitMapTemp)
        }

        loadSubjectsAndUnits()
    }, [resources])

    if (!resources || resources.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                No resources added yet
            </p>
        )
    }
    const filteredResources = resources.filter(r => {
        if (filterProgram !== "all" && r.programId !== filterProgram) return false
        if (filterSemester !== "all" && String(r.semester) !== filterSemester) return false
        if (filterSubject !== "all" && r.subjectId !== filterSubject) return false
        if (filterUnit !== "all" && r.unitId !== filterUnit) return false
        if (
            debouncedSearch &&
            !r.title.toLowerCase().includes(debouncedSearch)
        ) {
            return false
        }

        return true
    })


    const subjectIds = [
        ...new Set(resources.map(r => r.subjectId).filter(Boolean))
    ]

    const unitIds = [
        ...new Set(
            resources
                .filter(r => filterSubject === "all" || r.subjectId === filterSubject)
                .map(r => r.unitId)
                .filter(Boolean)
        )
    ]

    const highlightMatch = (text, query) => {
        if (!query) return text

        const regex = new RegExp(`(${query})`, "ig")
        return text.split(regex).map((part, i) =>
            part.toLowerCase() === query.toLowerCase() ? (
                <span key={i} className="bg-yellow-200 text-black px-0.5 rounded">
                    {part}
                </span>
            ) : (
                part
            )
        )
    }


    return (

        <div className="space-y-3">
            <div className="relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search resources by title..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>

            <div className="flex flex-wrap gap-4 mb-4">

                {/* Program Filter */}
                <Select
                    value={filterProgram}
                    onValueChange={setFilterProgram}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Programs" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>

                        {[...new Set(resources.map(r => r.programId))].map(id => (
                            <SelectItem key={id} value={id}>
                                {programMap[id] || id}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Semester Filter */}
                <Select
                    value={filterSemester}
                    onValueChange={setFilterSemester}
                >
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="All Semesters" />
                    </SelectTrigger>

                    <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>

                        {[...new Set(resources.map(r => String(r.semester)))].map(sem => (
                            <SelectItem key={sem} value={sem}>
                                Semester {sem}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex flex-wrap gap-4">

                    {/* Subject Filter */}
                    <Select
                        value={filterSubject}
                        onValueChange={setFilterSubject}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">All Subjects</SelectItem>

                            {subjectIds.map(id => (
                                <SelectItem key={id} value={id}>
                                    {subjectMap[id] || id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Unit Filter */}
                    <Select
                        value={filterUnit}
                        onValueChange={setFilterUnit}
                    >
                        <SelectTrigger className="w-48">
                            <SelectValue placeholder="All Units" />
                        </SelectTrigger>

                        <SelectContent>
                            <SelectItem value="all">All Units</SelectItem>

                            {unitIds.map(id => (
                                <SelectItem key={id} value={id}>
                                    {unitMap[id] || id}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                </div>

            </div>

            <div className="space-y-4 pb-8">
                {filteredResources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No resources match your filters or search.
                    </p>
                ) : (
                    filteredResources.map((r) => (
                        // existing card JSX
                        <div
                            key={r.$id}
                            className="border rounded-lg p-4 space-y-2 bg-card"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold">
                                        {highlightMatch(r.title, searchTerm)}
                                    </h3>

                                    <span className="text-xs uppercase text-muted-foreground">
                                        {r.type}
                                    </span>
                                </div>

                                {/* Right: Actions */}

                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => openResource(r)}
                                    >
                                        View
                                    </Button>

                                    {canEdit && (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                onEdit(r)
                                                window.scrollTo({ top: 0, behavior: "smooth" })
                                            }}
                                        >
                                            Edit
                                        </Button>
                                    )}

                                    {canDelete && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(r)}
                                        >
                                            Delete
                                        </Button>
                                    )}
                                </div>
                            </div>


                            {/* Context info */}
                            <div className="text-sm text-muted-foreground space-y-1">
                                <div>
                                    <strong>Program:</strong>{" "}
                                    {programMap[r.programId] || "—"}
                                </div>
                                <div>
                                    <strong>Semester:</strong> {r.semester}
                                </div>
                                <div>
                                    <strong>Branch:</strong> {r.branch}
                                </div>
                                <div>
                                    <strong>Subject:</strong>{" "}
                                    {subjectMap[r.subjectId] || "—"}
                                </div>
                                <div>
                                    <strong>Unit:</strong>{" "}
                                    {unitMap[r.unitId] || "—"}
                                </div>
                            </div>


                            {/* Description (optional) */}
                            {r.description && (
                                <p className="text-sm text-muted-foreground">
                                    {r.description}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>



        </div>
    )
}

import { useEffect, useState } from "react"
import { getSyllabusByProgram } from "@/services/syllabusService"
import {
    createUnit,
    getUnitsBySubject,
    deleteUnit,
    updateUnit
} from "@/services/unitService"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

import { getPrograms } from "@/services/programService"

import { useAuth } from "@/context/AuthContext"

import { getSubjectsBySyllabusIds } from "@/services/subjectService"


export default function UnitsAdmin() {
    const [programId, setProgramId] = useState("")
    const [syllabus, setSyllabus] = useState([])
    const [subjects, setSubjects] = useState([])

    const [subjectId, setSubjectId] = useState("")
    const [units, setUnits] = useState([])

    const [title, setTitle] = useState("")
    const [order, setOrder] = useState("")

    const [programs, setPrograms] = useState([])
    const [semester, setSemester] = useState("")
    const [branch, setBranch] = useState("")

    const [editingUnit, setEditingUnit] = useState(null)

    const { user, role } = useAuth()

    const isAdmin = role === "admin"
    const isMod = role === "mod"

    const canCreateOrEdit = isAdmin || isMod
    const canDelete = isAdmin


    const availableBranches = [
        ...new Set(syllabus.map(s => s.branch).filter(Boolean))
    ]


    const filteredSubjects = subjects.filter(
        s => !branch || s.branch === branch
    )



    useEffect(() => {
        getPrograms()
            .then(res => setPrograms(res))
            .catch(err => console.error(err))
    }, [])


    useEffect(() => {
        if (!programId || !semester) {
            setSubjects([])
            setBranch("") // ← ADD THIS
            return
        }

        getSyllabusByProgram(programId)
            .then(list => {
                const filtered = list.filter(
                    s => Number(s.semester) === Number(semester)
                )
                setSyllabus(filtered)
                setBranch("") // ← ADD THIS
            })
            .catch(err => console.error(err))
    }, [programId, semester])

    const filteredSyllabus = branch
        ? syllabus.filter(s => s.branch === branch)
        : syllabus


    useEffect(() => {
        if (!syllabus.length) {
            setSubjects([])
            return
        }

        const syllabusIds = filteredSyllabus.map(s => s.$id)

        getSubjectsBySyllabusIds(syllabusIds)
            .then(res => {
                setSubjects(res)
            })
            .catch(err => console.error(err))
    }, [syllabus])


    useEffect(() => {
        if (!subjectId) {
            setUnits([])
            setEditingUnit(null) // ← ADD
            setTitle("")         // ← ADD
            setOrder("")         // ← ADD
            return
        }

        getUnitsBySubject(subjectId)
            .then(res => setUnits(res))
            .catch(err => console.error(err))
    }, [subjectId])

    const handleSaveUnit = async () => {
        if (!canCreateOrEdit) return
        if (!subjectId || !title || !order) {
            alert("Subject, title and order are required")
            return
        }

        try {
            if (editingUnit) {
                // UPDATE
                await updateUnit(editingUnit.$id, {
                    title,
                    order: Number(order),
                }, user)
            } else {
                // CREATE
                await createUnit({
                    subjectId,
                    title,
                    order: Number(order),
                }, user)
            }

            // refresh list
            const refreshed = await getUnitsBySubject(subjectId)
            setUnits(refreshed)

            // reset form
            setTitle("")
            setOrder("")
            setEditingUnit(null)
        } catch (err) {
            console.error("Failed to save unit", err)
        }
    }


    const handleDeleteUnit = async (unit) => {
        if (!canDelete) return
        if (!confirm("Delete this unit?")) return

        try {
            await deleteUnit(unit.$id, user, unit.title)
            setUnits(await getUnitsBySubject(subjectId))
        } catch (err) {
            console.error("Failed to delete unit", err)
        }
    }




    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-2xl font-semibold">Manage Units</h1>

            {/* program select */}

            <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                </SelectTrigger>

                <SelectContent>
                    {programs.map(p => (
                        <SelectItem key={p.$id} value={p.$id}>
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* semester select */}
            <Select
                value={semester}
                onValueChange={setSemester}
                disabled={!programId}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select Semester" />
                </SelectTrigger>

                <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <SelectItem key={sem} value={String(sem)}>
                            Semester {sem}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select
                value={branch}
                onValueChange={setBranch}
                disabled={!availableBranches.length}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Select Branch" />
                </SelectTrigger>

                <SelectContent>
                    {availableBranches.map(b => (
                        <SelectItem key={b} value={b}>
                            {b}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>


            {/* subject select */}

            <Card>
                <CardHeader>
                    <CardTitle>Select Subject</CardTitle>
                </CardHeader>

                <CardContent className="space-y-4">

                    <Select value={subjectId} onValueChange={setSubjectId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Subject" />
                        </SelectTrigger>

                        <SelectContent>
                            {subjects.map((s) => (
                                <SelectItem key={s.$id} value={s.$id}>
                                    {s.subjectName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                </CardContent>
            </Card>

            {canCreateOrEdit && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add Unit</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Input
                            placeholder="Unit title (e.g. Unit 1: Arrays)"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <Input
                            placeholder="Order (1, 2, 3...)"
                            type="number"
                            value={order}
                            onChange={(e) => setOrder(e.target.value)}
                        />

                        <Button
                            disabled={!subjectId || !title || !order}
                            onClick={handleSaveUnit}
                        >
                            {editingUnit ? "Update Unit" : "Add Unit"}
                        </Button>
                        {editingUnit && (
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setEditingUnit(null)
                                    setTitle("")
                                    setOrder("")
                                }}
                            >
                                Cancel Edit
                            </Button>
                        )}

                    </CardContent>
                </Card>)}
            <Card>
                <CardHeader>
                    <CardTitle>Units</CardTitle>
                </CardHeader>

                <CardContent className="space-y-3">
                    {units.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No units added yet.
                        </p>
                    ) : (
                        units
                            .sort((a, b) => a.order - b.order)
                            .map((unit) => (
                                <div
                                    key={unit.$id}
                                    className="flex justify-between items-center border rounded p-3"
                                >
                                    <div>
                                        <p className="font-medium">
                                            Unit {unit.order}: {unit.title}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {canCreateOrEdit && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingUnit(unit)
                                                    setTitle(unit.title)
                                                    setOrder(String(unit.order))
                                                }}
                                            >
                                                Edit
                                            </Button>
                                        )}

                                        {canDelete && (
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDeleteUnit(unit)}
                                            >
                                                Delete
                                            </Button>
                                        )}

                                    </div>

                                </div>
                            ))
                    )}
                </CardContent>
            </Card>


        </div>
    )
}

import { useEffect, useState } from "react"
import {
    createProgram,
    getPrograms,
    updateProgram,
    deleteProgram,
} from "@/services/programService"
import { getUniversities } from "@/services/universityService"
import { useAuth } from "@/context/AuthContext"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import ProgramCard from "../../components/university/ProgramCard"

const Programs = () => {
    const { user, role } = useAuth()

    const isAdmin = role === "admin"
    const isMod = role === "mod"
    const canCreateOrEdit = isAdmin || isMod
    const canDelete = isAdmin

    const [universities, setUniversities] = useState([])
    const [programs, setPrograms] = useState([])
    const [loading, setLoading] = useState(false)
    const [loadingList, setLoadingList] = useState(true)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [editingProgram, setEditingProgram] = useState(null)
    const [selectedUniversity, setSelectedUniversity] = useState("all")

    const [form, setForm] = useState({
        name: "",
        slug: "",
        universityId: "",
        degreeType: "",
        duration: "",
    })

    /* ---------- helpers ---------- */
    const generateSlug = (value) =>
        value
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")

    const updateForm = (key, value) => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
            ...(key === "name" && { slug: generateSlug(value) }),
        }))
    }

    /* ---------- fetch ---------- */
    useEffect(() => {
        const load = async () => {
            try {
                const [uniRes, progRes] = await Promise.all([
                    getUniversities(),
                    getPrograms(),
                ])
                setUniversities(uniRes)
                setPrograms(progRes)
            } finally {
                setLoadingList(false)
            }
        }
        load()
    }, [])

    /* ---------- submit ---------- */
    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!canCreateOrEdit) return

        setError("")
        setSuccess("")

        if (!form.name || !form.universityId) {
            setError("Program name and university are required.")
            return
        }

        try {
            setLoading(true)

            if (editingProgram) {
                await updateProgram(editingProgram.$id, form, user)

                setPrograms((prev) =>
                    prev.map((p) =>
                        p.$id === editingProgram.$id ? { ...p, ...form } : p
                    )
                )

                setSuccess("Program updated successfully.")
                setEditingProgram(null)
            } else {
                await createProgram(form, user)

                const updated = await getPrograms()
                setPrograms(updated)

                setSuccess("Program created successfully.")
            }

            setForm({
                name: "",
                slug: "",
                universityId: "",
                degreeType: "",
                duration: "",
            })
        } catch (err) {
            setError(err.message || "Operation failed.")
        } finally {
            setLoading(false)
        }
    }

    /* ---------- edit ---------- */
    const handleEdit = (program) => {
        if (!canCreateOrEdit) return

        setEditingProgram(program)
        setForm({
            name: program.name,
            slug: program.slug,
            universityId: program.universityId,
            degreeType: program.degreeType,
            duration: program.duration,
        })
    }

    /* ---------- delete ---------- */
    const handleDelete = async (program) => {
        if (!canDelete) return
        if (!confirm("Are you sure you want to delete this program?")) return

        setPrograms((prev) => prev.filter((p) => p.$id !== program.$id))

        try {
            await deleteProgram(program.$id, user, program.name)
            setSuccess("Program deleted successfully.")
        } catch {
            const refreshed = await getPrograms()
            setPrograms(refreshed)
            setError("Delete failed. List refreshed.")
        }
    }

    useEffect(() => {
        if (!success && !error) return
        const t = setTimeout(() => {
            setSuccess("")
            setError("")
        }, 3000)
        return () => clearTimeout(t)
    }, [success, error])

    const visiblePrograms =
        selectedUniversity === "all"
            ? programs
            : programs.filter((p) => p.universityId === selectedUniversity)

    /* ---------- UI ---------- */
    return (
        <div className="max-w-6xl mx-auto p-6">
            {canCreateOrEdit && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editingProgram ? "Edit Program" : "Create Program"}
                        </CardTitle>
                    </CardHeader>

                    <CardContent>
                        <form className="space-y-4" onSubmit={handleSubmit}>
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            {success && <p className="text-sm text-green-600">{success}</p>}

                            <Input
                                placeholder="Program name"
                                value={form.name}
                                onChange={(e) => updateForm("name", e.target.value)}
                            />

                            <Input
                                placeholder="Slug"
                                value={form.slug}
                                onChange={(e) => updateForm("slug", e.target.value)}
                            />

                            <Select
                                value={form.universityId}
                                onValueChange={(v) => updateForm("universityId", v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select university" />
                                </SelectTrigger>
                                <SelectContent>
                                    {universities.map((u) => (
                                        <SelectItem key={u.$id} value={u.$id}>
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Input
                                placeholder="Degree type"
                                value={form.degreeType}
                                onChange={(e) =>
                                    updateForm("degreeType", e.target.value)
                                }
                            />

                            <Input
                                placeholder="Duration"
                                value={form.duration}
                                onChange={(e) =>
                                    updateForm("duration", e.target.value)
                                }
                            />

                            <Button className="w-full" disabled={loading}>
                                {editingProgram ? "Update Program" : "Create Program"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visiblePrograms.map((program) => (
                    <ProgramCard
                        key={program.$id}
                        program={program}
                        onEdit={canCreateOrEdit ? handleEdit : null}
                        onDelete={canDelete ? () => handleDelete(program) : null}
                    />
                ))}
            </div>
        </div>
    )
}

export default Programs

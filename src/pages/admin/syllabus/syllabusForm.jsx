import { useEffect, useState } from "react"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { getBranchesByProgram } from "@/services/branchService";

import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"

import { BTECH_BRANCHES } from "@/constants/branches"

import { ID, storage } from "@/lib/appwrite"

const SYLLABUS_BUCKET_ID =
    import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID

import {
    createSubject,
    getSubjectsBySyllabus,
    updateSubjectPdf
} from "@/services/subjectService"
import { updateSyllabus } from "@/services/syllabusService"


const initialState = {
    title: "",
    semester: "",
    description: "",
    branch: "",
    subjects: [],
}

const SyllabusForm = ({
    programId,
    onSubmit,
    editingSyllabus,
    onCancelEdit,
    onSuccess, // 🔥 parent refresh callback (optional but recommended)
    user,
}) => {

    const [formData, setFormData] = useState(initialState)

    const [subjectDraft, setSubjectDraft] = useState({
        name: "",
        description: "",
        pdfFile: null,
    })

    const [existingSubjects, setExistingSubjects] = useState([])

    const [loading, setLoading] = useState(false)

    const [branches, setBranches] = useState([]);
    const [branchesLoading, setBranchesLoading] = useState(false);



    // Fetch When programId Changes
    useEffect(() => {
        if (!programId) return;

        const fetchBranches = async () => {
            try {
                setBranchesLoading(true);
                const data = await getBranchesByProgram(programId);
                setBranches(data);
            } catch (error) {
                console.error("Failed to fetch branches", error);
            } finally {
                setBranchesLoading(false);
            }
        };

        fetchBranches();
    }, [programId]);


    /* ----------------------------- HELPERS ----------------------------- */

    const refreshSubjects = async (id) => {
        if (!id) return
        const data = await getSubjectsBySyllabus(id)
        setExistingSubjects(data)
    }


    /* ----------------------- PREFILL WHEN EDITING ---------------------- */

    useEffect(() => {
        if (!editingSyllabus) {
            setFormData(initialState)
            setExistingSubjects([])
            return
        }

        setFormData({
            title: editingSyllabus.title || "",
            semester: editingSyllabus.semester || "",
            description: editingSyllabus.description || "",
            branch: editingSyllabus.branch || "",
            subjects: [],
        })

        refreshSubjects(editingSyllabus.$id)

    }, [editingSyllabus])


    /* ----------------------------- SUBJECTS ---------------------------- */

    const addSubject = () => {
        if (!subjectDraft.name || !subjectDraft.pdfFile) {
            alert("Subject name and PDF are required")
            return
        }

        setFormData(prev => ({
            ...prev,
            subjects: [...prev.subjects, subjectDraft]
        }))

        setSubjectDraft({ name: "", description: "", pdfFile: null })
    }

    const removeSubject = (index) => {
        setFormData(prev => ({
            ...prev,
            subjects: prev.subjects.filter((_, i) => i !== index)
        }))
    }


    /* ------------------------------ FORM ------------------------------ */

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }


    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.branch) return alert("Please select a branch")
        if (!editingSyllabus && formData.subjects.length === 0)
            return alert("Add at least one subject")

        setLoading(true)

        try {

            const syllabus = await onSubmit({
                title: formData.title || `Semester ${formData.semester}`,
                semester: Number(formData.semester),
                branch: formData.branch,
                programId,
                description: formData.description,
            })

            const syllabusId = editingSyllabus
                ? editingSyllabus.$id
                : syllabus.$id


            /* ---------- CREATE MODE ---------- */
            if (!editingSyllabus) {
                for (const subject of formData.subjects) {

                    const file = await storage.createFile(
                        SYLLABUS_BUCKET_ID,
                        ID.unique(),
                        subject.pdfFile
                    )

                    await createSubject({
                        syllabusId,
                        subjectName: subject.name,
                        description: subject.description,
                        pdfFileId: file.$id,
                    })

                    // 🔥 ALSO UPDATE SYLLABUS
                    const subjectNames = formData.subjects.map(s => s.name)

                    await updateSyllabus(
                        syllabusId,
                        {
                            subjects: subjectNames,
                            subjectsCount: subjectNames.length,
                        },
                        user
                    )
                }

                setFormData(initialState) // clear form
            }

            /* ---------- REFRESH SUBJECTS ALWAYS ---------- */
            await refreshSubjects(syllabusId)

            /* ---------- REFRESH PARENT LIST ---------- */
            onSuccess?.()

        } catch (err) {
            console.error(err)
        }

        setLoading(false)

    }



    /* ------------------------------ UI ------------------------------ */

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    {editingSyllabus ? "Edit Syllabus" : "Add New Syllabus"}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">

                    <Input
                        name="title"
                        placeholder="Syllabus Title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                    />


                    {/* ---------------- SUBJECT SECTION ---------------- */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Add Subjects (PDF)</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-4">

                            {!editingSyllabus && (
                                <>
                                    <Input
                                        placeholder="Subject name"
                                        value={subjectDraft.name}
                                        onChange={(e) =>
                                            setSubjectDraft(p => ({ ...p, name: e.target.value }))
                                        }
                                    />

                                    <Textarea
                                        placeholder="Description"
                                        value={subjectDraft.description}
                                        onChange={(e) =>
                                            setSubjectDraft(p => ({ ...p, description: e.target.value }))
                                        }
                                    />

                                    <Input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={(e) =>
                                            setSubjectDraft(p => ({
                                                ...p,
                                                pdfFile: e.target.files[0],
                                            }))
                                        }
                                    />

                                    <Button type="button" onClick={addSubject}>
                                        Add Subject
                                    </Button>

                                    {/* Preview newly added subjects (CREATE MODE) */}
                                    {!editingSyllabus && formData.subjects.length > 0 && (
                                        <div className="space-y-2 pt-3">
                                            <p className="text-sm font-medium">Added Subjects</p>

                                            {formData.subjects.map((s, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between rounded border px-3 py-2 text-sm bg-muted/40"
                                                >
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">
                                                            📄 {s.pdfFile?.name}
                                                        </p>

                                                        <p className="font-medium">{s.name}</p>
                                                        {s.description && (
                                                            <p className="text-xs text-muted-foreground">
                                                                {s.description}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => removeSubject(i)}
                                                    >
                                                        Remove
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                </>
                            )}

                            {/* Existing subjects (edit mode) */}
                            {existingSubjects.map(s => (
                                <div key={s.$id} className="space-y-2">
                                    <p className="text-sm font-medium">{s.subjectName}</p>
                                    <Input
                                        type="file"
                                        accept="application/pdf"
                                        onChange={async (e) => {
                                            await updateSubjectPdf(s.$id, e.target.files[0])
                                            refreshSubjects(editingSyllabus.$id)
                                        }}
                                    />
                                </div>
                            ))}

                        </CardContent>
                    </Card>


                    {/* ---------------- META ---------------- */}
                    <Select
                        value={formData.branch}
                        onValueChange={(v) =>
                            setFormData(prev => ({ ...prev, branch: v }))
                        }
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>

                        <SelectContent>
                            {branches.map(branch => (
                                <SelectItem key={branch.$id} value={branch.name}>
                                    {branch.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Input
                        type="number"
                        name="semester"
                        placeholder="Semester"
                        value={formData.semester}
                        onChange={handleChange}
                    />

                    <Textarea
                        name="description"
                        placeholder="Short description"
                        value={formData.description}
                        onChange={handleChange}
                    />

                    <div className="flex gap-3">
                        <Button type="submit" disabled={loading}>
                            {editingSyllabus ? "Update" : "Add"}
                        </Button>

                        {editingSyllabus && (
                            <Button type="button" variant="outline" onClick={onCancelEdit}>
                                Cancel
                            </Button>
                        )}
                    </div>

                </form>
            </CardContent>
        </Card>
    )
}

export default SyllabusForm

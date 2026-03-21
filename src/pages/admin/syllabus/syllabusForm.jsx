// src/pages/admin/syllabus/syllabusForm.jsx
import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Plus, X, FileText, Loader2, Check, Upload, Pencil,
} from "lucide-react"

import { getBranchesByProgram } from "@/services/university/branchService"
import { ID, storage } from "@/lib/appwrite"
import {
  createSubject, getSubjectsBySyllabus, updateSubjectPdf,
} from "@/services/syllabus/subjectService"
import { updateSyllabus } from "@/services/syllabus/syllabusService"
import { CustomSelect, GlassCard, SectionLabel } from "@/components/admin/CustomSelect"

const SYLLABUS_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID

const initialState = {
  title: "", semester: "", description: "", branch: "", subjects: [],
}

// ── Styled input ──────────────────────────────────────────────────────────────
function Field({ placeholder, value, onChange, type = "text", name, required, className = "" }) {
  return (
    <input
      type={type} name={name} value={value} onChange={onChange}
      placeholder={placeholder} required={required}
      className={`w-full h-10 px-3.5 rounded-xl text-sm border border-border/60 bg-card/80
                  text-foreground placeholder:text-muted-foreground/50
                  focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500/60
                  hover:border-border transition-all duration-150 ${className}`}
    />
  )
}

// ── Styled textarea ───────────────────────────────────────────────────────────
function TextArea({ placeholder, value, onChange, name, rows = 3 }) {
  return (
    <textarea
      name={name} value={value} onChange={onChange}
      placeholder={placeholder} rows={rows}
      className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-border/60 bg-card/80
                 text-foreground placeholder:text-muted-foreground/50
                 focus:outline-none focus:ring-2 focus:ring-cyan-500/25 focus:border-cyan-500/60
                 hover:border-border transition-all duration-150 resize-none"
    />
  )
}

// ── File pick zone ─────────────────────────────────────────────────────────────
function FilePick({ value, onChange, placeholder = "Click to select PDF", accept = "application/pdf" }) {
  const inputRef = useState(null)[1]
  const ref = { current: null }

  return (
    <div
      onClick={() => ref.current?.click()}
      className={[
        "flex items-center gap-2.5 rounded-xl border-2 border-dashed px-3.5 py-3",
        "cursor-pointer transition-all duration-200",
        value
          ? "border-emerald-500/40 bg-emerald-500/5"
          : "border-border/40 hover:border-cyan-500/40 hover:bg-cyan-500/5",
      ].join(" ")}
    >
      <input ref={r => ref.current = r} type="file" accept={accept}
        onChange={onChange} className="hidden" />
      {value ? (
        <>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Check size={13} className="text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-emerald-500 truncate">{value.name}</p>
            <p className="text-[11px] text-muted-foreground">{(value.size / 1024).toFixed(0)} KB</p>
          </div>
        </>
      ) : (
        <>
          <div className="w-7 h-7 rounded-lg bg-muted/40 border border-border/50 flex items-center justify-center shrink-0">
            <Upload size={12} className="text-muted-foreground" />
          </div>
          <span className="text-xs text-muted-foreground">{placeholder}</span>
        </>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const SyllabusForm = ({
  programId,
  onSubmit,
  editingSyllabus,
  onCancelEdit,
  onSuccess,
  user,
}) => {
  const [formData,         setFormData]         = useState(initialState)
  const [subjectDraft,     setSubjectDraft]     = useState({ name: "", description: "", pdfFile: null })
  const [existingSubjects, setExistingSubjects] = useState([])
  const [loading,          setLoading]          = useState(false)
  const [branches,         setBranches]         = useState([])
  const [branchesLoading,  setBranchesLoading]  = useState(false)

  // Load branches when programId changes
  useEffect(() => {
    if (!programId) return
    setBranchesLoading(true)
    getBranchesByProgram(programId)
      .then(setBranches)
      .catch(console.error)
      .finally(() => setBranchesLoading(false))
  }, [programId])

  // Prefill when editing
  useEffect(() => {
    if (!editingSyllabus) { setFormData(initialState); setExistingSubjects([]); return }
    setFormData({
      title: editingSyllabus.title || "",
      semester: editingSyllabus.semester || "",
      description: editingSyllabus.description || "",
      branch: editingSyllabus.branch || "",
      subjects: [],
    })
    getSubjectsBySyllabus(editingSyllabus.$id).then(setExistingSubjects).catch(console.error)
  }, [editingSyllabus])

  const refreshSubjects = async (id) => {
    if (!id) return
    const data = await getSubjectsBySyllabus(id)
    setExistingSubjects(data)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const addSubject = () => {
    if (!subjectDraft.name || !subjectDraft.pdfFile) {
      toast.error("Subject name and PDF are required"); return
    }
    setFormData(prev => ({ ...prev, subjects: [...prev.subjects, subjectDraft] }))
    setSubjectDraft({ name: "", description: "", pdfFile: null })
  }

  const removeSubject = (index) =>
    setFormData(prev => ({ ...prev, subjects: prev.subjects.filter((_, i) => i !== index) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.branch) { toast.error("Please select a branch"); return }
    if (!editingSyllabus && formData.subjects.length === 0) { toast.error("Add at least one subject"); return }
    setLoading(true)
    try {
      const syllabus = await onSubmit({
        title: formData.title || `Semester ${formData.semester}`,
        semester: Number(formData.semester),
        branch: formData.branch,
        programId,
        description: formData.description,
      })
      const syllabusId = editingSyllabus ? editingSyllabus.$id : syllabus.$id
      if (!editingSyllabus) {
        for (const subject of formData.subjects) {
          const file = await storage.createFile(SYLLABUS_BUCKET_ID, ID.unique(), subject.pdfFile)
          await createSubject({ syllabusId, subjectName: subject.name, description: subject.description, pdfFileId: file.$id })
          await updateSyllabus(syllabusId, {
            subjects: formData.subjects.map(s => s.name),
            subjectsCount: formData.subjects.length,
          }, user)
        }
        setFormData(initialState)
      }
      await refreshSubjects(syllabusId)
      onSuccess?.()
      toast.success(editingSyllabus ? "Syllabus updated" : "Syllabus created")
    } catch (err) {
      console.error(err); toast.error("Failed to save syllabus")
    } finally { setLoading(false) }
  }

  return (
    <GlassCard>
      <SectionLabel>{editingSyllabus ? "Edit Syllabus" : "Add Syllabus"}</SectionLabel>

      <form onSubmit={handleSubmit} className="space-y-3">

        {/* Title */}
        <Field name="title" placeholder="Syllabus title *" value={formData.title}
          onChange={handleChange} required />

        {/* Branch + Semester row */}
        <div className="grid grid-cols-2 gap-2.5">
          <CustomSelect
            value={formData.branch}
            onChange={v => setFormData(prev => ({ ...prev, branch: v }))}
            placeholder={branchesLoading ? "Loading…" : "Select Branch *"}
            disabled={branchesLoading || !branches.length}
            options={branches.map(b => ({ value: b.name, label: b.name }))}
          />
          <Field type="number" name="semester" placeholder="Semester *"
            value={formData.semester} onChange={handleChange} />
        </div>

        {/* Description */}
        <TextArea name="description" placeholder="Short description (optional)"
          value={formData.description} onChange={handleChange} rows={2} />

        {/* ── Subjects section ── */}
        <div className="pt-1">
          <div className="rounded-xl border border-border/50 bg-muted/10 overflow-hidden">
            <div className="px-4 py-3 border-b border-border/40">
              <p className="text-xs font-semibold text-foreground">
                {editingSyllabus ? "Subjects (update PDFs)" : "Subjects"}
              </p>
            </div>

            <div className="p-4 space-y-3">
              {/* Create mode: add new subjects */}
              {!editingSyllabus && (
                <>
                  <Field placeholder="Subject name *" value={subjectDraft.name}
                    onChange={e => setSubjectDraft(p => ({ ...p, name: e.target.value }))} />
                  <TextArea placeholder="Subject description (optional)"
                    value={subjectDraft.description} rows={2}
                    onChange={e => setSubjectDraft(p => ({ ...p, description: e.target.value }))} />
                  <FilePick
                    value={subjectDraft.pdfFile}
                    onChange={e => setSubjectDraft(p => ({ ...p, pdfFile: e.target.files[0] }))}
                    placeholder="Click to attach subject PDF *"
                  />
                  <button type="button" onClick={addSubject}
                    className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium
                               border border-cyan-500/40 bg-cyan-500/5 text-cyan-500
                               hover:bg-cyan-500/10 hover:border-cyan-500/60 transition-all duration-150 active:scale-95">
                    <Plus size={12} /> Add Subject
                  </button>

                  {/* Pending subjects list */}
                  <AnimatePresence>
                    {formData.subjects.length > 0 && (
                      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Queued ({formData.subjects.length})
                        </p>
                        {formData.subjects.map((s, i) => (
                          <motion.div key={i} layout
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="flex items-center gap-2.5 rounded-xl border border-emerald-500/30
                                       bg-emerald-500/5 px-3 py-2.5"
                          >
                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                              <FileText size={11} className="text-emerald-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-foreground truncate">{s.name}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{s.pdfFile?.name}</p>
                            </div>
                            <button type="button" onClick={() => removeSubject(i)}
                              className="p-1 rounded-lg text-muted-foreground hover:text-destructive transition-colors shrink-0">
                              <X size={12} />
                            </button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}

              {/* Edit mode: update PDFs for existing subjects */}
              {editingSyllabus && existingSubjects.length === 0 && (
                <p className="text-xs text-muted-foreground">No subjects yet</p>
              )}
              {editingSyllabus && existingSubjects.map(s => (
                <div key={s.$id} className="rounded-xl border border-border/50 bg-card/40 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Pencil size={11} className="text-muted-foreground shrink-0" />
                    <p className="text-xs font-semibold text-foreground">{s.subjectName}</p>
                  </div>
                  <FilePick
                    value={null}
                    onChange={async (e) => {
                      try {
                        await updateSubjectPdf(s.$id, e.target.files[0])
                        await refreshSubjects(editingSyllabus.$id)
                        toast.success(`PDF updated for ${s.subjectName}`)
                      } catch { toast.error("Failed to update PDF") }
                    }}
                    placeholder="Replace PDF (optional)"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-2 pt-1">
          {editingSyllabus && (
            <button type="button" onClick={onCancelEdit}
              className="h-10 px-4 rounded-xl border border-border/60 text-sm text-muted-foreground
                         hover:border-border hover:text-foreground transition-colors flex items-center gap-1.5">
              <X size={13} /> Cancel
            </button>
          )}
          <button type="submit" disabled={loading}
            className="flex-1 h-10 rounded-xl text-sm font-semibold text-white
                       flex items-center justify-center gap-2 transition-all duration-200
                       active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #0891b2 0%, #0e7490 100%)",
              boxShadow: loading ? "none" : "0 4px 16px rgba(8,145,178,0.35)",
            }}
          >
            {loading
              ? <><Loader2 size={14} className="animate-spin" />{editingSyllabus ? "Updating…" : "Creating…"}</>
              : <><Check size={14} />{editingSyllabus ? "Update Syllabus" : "Add Syllabus"}</>
            }
          </button>
        </div>
      </form>
    </GlassCard>
  )
}

export default SyllabusForm
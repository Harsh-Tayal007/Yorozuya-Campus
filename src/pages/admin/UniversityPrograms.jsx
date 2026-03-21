// src/pages/admin/UniversityPrograms.jsx
import { useMemo, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { BookOpen, Plus, Pencil, Trash2, X, Loader2, AlertTriangle, ArrowLeft } from "lucide-react"

import { getProgramsByUniversity, createProgram, updateProgram, deleteProgram } from "@/services/university/programService"
import { getUniversities } from "@/services/university/universityService"
import { useAuth } from "@/context/AuthContext"
import { CustomSelect, GlassCard, SectionLabel } from "@/components/admin/CustomSelect"

const DEGREE_TYPES = ["B.Tech", "M.Tech", "BCA", "MCA", "B.Sc", "M.Sc", "MBA", "BBA", "Ph.D", "Diploma"]
const generateSlug = (v) => v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

function DeleteConfirm({ name, onConfirm, onCancel, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm bg-background border border-border
                      rounded-2xl shadow-2xl p-6 space-y-4 animate-in fade-in-0 zoom-in-95 duration-150"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center w-11 h-11 rounded-full
                        bg-destructive/10 border border-destructive/20 mx-auto">
          <AlertTriangle size={20} className="text-destructive" />
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="font-semibold">Delete program?</h3>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">"{name}"</span> will be permanently deleted.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={isPending}
            className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold
                       hover:bg-destructive/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {isPending && <Loader2 size={14} className="animate-spin" />} Delete
          </button>
        </div>
      </div>
    </div>
  )
}

function ProgramCard({ program, onEdit, onDelete }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}
      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-4
                 hover:border-border hover:bg-card/80 transition-all duration-200 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)" }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 border border-violet-500/25
                          flex items-center justify-center shrink-0">
            <BookOpen size={14} className="text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{program.name}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {[program.degreeType, program.duration && (String(program.duration).includes("year") ? program.duration : `${program.duration} years`)].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(program)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5
                         border border-transparent hover:border-primary/20 transition-all duration-150 active:scale-95">
              <Pencil size={13} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(program)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5
                         border border-transparent hover:border-destructive/20 transition-all duration-150 active:scale-95">
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const UniversityPrograms = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, role } = useAuth()
  const queryClient = useQueryClient()
  const canCreateOrEdit = role === "admin" || role === "mod"
  const canDelete = role === "admin"

  const [form, setForm] = useState({ name: "", slug: "", universityId: id, degreeType: "", duration: "" })
  const [editingProgram, setEditingProgram] = useState(null)
  const [deleteTarget,   setDeleteTarget]   = useState(null)

  const updateForm = (key, value) =>
    setForm(prev => ({ ...prev, [key]: value, ...(key === "name" && { slug: generateSlug(value) }) }))

  const { data: universities = [] } = useQuery({
    queryKey: ["universities"],
    queryFn: getUniversities,
    staleTime: 1000 * 60 * 10,
  })

  const university = useMemo(() => universities.find(u => u.$id === id), [universities, id])

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["programs", id],
    queryFn: () => getProgramsByUniversity(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })

  const createMutation = useMutation({
    mutationFn: (data) => createProgram(data, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs", id] })
      queryClient.invalidateQueries({ queryKey: ["programs-all"] })
      resetForm(); toast.success("Program created")
    },
    onError: (err) => toast.error(err.message || "Failed to create"),
  })

  const updateMutation = useMutation({
    mutationFn: ({ pid, data }) => updateProgram(pid, data, user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs", id] })
      queryClient.invalidateQueries({ queryKey: ["programs-all"] })
      resetForm(); toast.success("Program updated")
    },
    onError: (err) => toast.error(err.message || "Failed to update"),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ pid, name }) => deleteProgram(pid, user, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs", id] })
      queryClient.invalidateQueries({ queryKey: ["programs-all"] })
      setDeleteTarget(null); toast.success("Program deleted")
    },
    onError: () => { toast.error("Delete failed"); setDeleteTarget(null) },
  })

  const resetForm = () => {
    setForm({ name: "", slug: "", universityId: id, degreeType: "", duration: "" })
    setEditingProgram(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name) { toast.error("Program name is required"); return }
    if (editingProgram) updateMutation.mutate({ pid: editingProgram.$id, data: form })
    else createMutation.mutate(form)
  }

  const handleEdit = (program) => {
    setEditingProgram(program)
    setForm({ name: program.name, slug: program.slug, universityId: id,
              degreeType: program.degreeType, duration: program.duration })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-8 max-w-7xl">
      {deleteTarget && (
        <DeleteConfirm name={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate({ pid: deleteTarget.$id, name: deleteTarget.name })}
          onCancel={() => setDeleteTarget(null)} isPending={deleteMutation.isPending} />
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="space-y-3">
        <button onClick={() => navigate("/admin/universities")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group">
          <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform" /> Back to Universities
        </button>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
            <BookOpen size={18} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              {university ? `${university.name} — Programs` : "Programs"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">{programs.length} program{programs.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {canCreateOrEdit && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }} className="lg:col-span-2">
            <GlassCard>
              <SectionLabel>{editingProgram ? "Edit Program" : "Add Program"}</SectionLabel>
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {["name", "slug"].map(field => (
                  <input key={field} value={form[field]} onChange={e => updateForm(field, e.target.value)}
                    placeholder={field === "name" ? "Program name *" : "Slug"}
                    className="w-full h-10 px-3.5 rounded-xl text-sm border border-border/60 bg-card/80
                               text-foreground placeholder:text-muted-foreground/50
                               focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500/60
                               hover:border-border transition-all duration-150" />
                ))}
                <CustomSelect value={form.degreeType} onChange={v => updateForm("degreeType", v)}
                  placeholder="Degree type"
                  options={DEGREE_TYPES.map(d => ({ value: d, label: d }))} />
                <input value={form.duration} onChange={e => updateForm("duration", e.target.value)}
                  placeholder="Duration (e.g. 4 years)"
                  className="w-full h-10 px-3.5 rounded-xl text-sm border border-border/60 bg-card/80
                             text-foreground placeholder:text-muted-foreground/50
                             focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500/60
                             hover:border-border transition-all duration-150" />
                <div className="flex gap-2 pt-1">
                  {editingProgram && (
                    <button type="button" onClick={resetForm}
                      className="h-10 px-4 rounded-xl border border-border/60 text-sm text-muted-foreground
                                 hover:border-border hover:text-foreground transition-colors flex items-center gap-1.5">
                      <X size={13} /> Cancel
                    </button>
                  )}
                  <button type="submit" disabled={isSaving}
                    className="flex-1 h-10 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2
                               transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6d28d9)", boxShadow: isSaving ? "none" : "0 4px 16px rgba(109,40,217,0.35)" }}>
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {editingProgram ? "Update" : "Add Program"}
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className={canCreateOrEdit ? "lg:col-span-3" : "lg:col-span-5"}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Programs</p>
          {isLoading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-16 animate-pulse" />
              ))}
            </div>
          ) : programs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
              <BookOpen size={20} className="text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No programs yet</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2.5">
                {programs.map(p => (
                  <ProgramCard key={p.$id} program={p}
                    onEdit={canCreateOrEdit ? handleEdit : null}
                    onDelete={canDelete ? setDeleteTarget : null} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default UniversityPrograms
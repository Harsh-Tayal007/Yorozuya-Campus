// src/pages/universities/Universities.jsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { School, Plus, X, Loader2, AlertTriangle } from "lucide-react"

import {
  createUniversity, deleteUniversity, updateUniversity, getUniversities,
} from "@/services/university/universityService"
import { useAuth } from "@/context/AuthContext"
import UniversityCard from "@/components/university/UniversityCard"
import { GlassCard, SectionLabel } from "@/components/admin/CustomSelect"

function DeleteConfirm({ name, onConfirm, onCancel, isPending }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 w-full max-w-sm bg-background border border-border rounded-2xl
                      shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-center w-11 h-11 rounded-full bg-destructive/10
                        border border-destructive/20 mx-auto">
          <AlertTriangle size={20} className="text-destructive" />
        </div>
        <div className="text-center space-y-1.5">
          <h3 className="font-semibold">Delete university?</h3>
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

const FIELDS = [
  { name: "name",    placeholder: "University name *",   required: true },
  { name: "country", placeholder: "Country *",           required: true },
  { name: "city",    placeholder: "City",                required: false },
  { name: "website", placeholder: "https://website.com", required: false },
]

const Universities = () => {
  const { currentUser, hasPermission } = useAuth()
  const canManage = hasPermission("manage:universities")
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const emptyForm = { name: "", country: "", city: "", website: "" }
  const [form,              setForm]              = useState(emptyForm)
  const [editingUniversity, setEditingUniversity] = useState(null)
  const [deleteTarget,      setDeleteTarget]      = useState(null)
  const isEditing = Boolean(editingUniversity)

  const { data: universities = [], isLoading } = useQuery({
    queryKey: ["universities"],
    queryFn: getUniversities,
    staleTime: 1000 * 60 * 5,
  })

  const createMutation = useMutation({
    mutationFn: (data) => createUniversity(data, currentUser),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["universities"] }); setForm(emptyForm); toast.success("University added successfully") },
    onError: () => toast.error("Couldn't add university. Please try again."),
  })

  const updateMutation = useMutation({
    mutationFn: (u) => updateUniversity(u.$id, { name: u.name, country: u.country, city: u.city, website: u.website }, currentUser),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["universities"] }); setEditingUniversity(null); toast.success("University details updated") },
    onError: () => toast.error("Couldn't update university. Please try again."),
  })

  const deleteMutation = useMutation({
    mutationFn: ({ id, name }) => deleteUniversity(id, currentUser, name),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["universities"] }); setDeleteTarget(null); toast.success("University removed successfully") },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canManage) return
    if (isEditing) {
      if (!editingUniversity.name || !editingUniversity.country) { toast.error("Please enter both university name and country"); return }
      updateMutation.mutate(editingUniversity)
    } else {
      if (!form.name || !form.country) { toast.error("Please enter both university name and country"); return }
      createMutation.mutate(form)
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {deleteTarget && (
        <DeleteConfirm name={deleteTarget.name}
          onConfirm={() => deleteMutation.mutate({ id: deleteTarget.$id, name: deleteTarget.name })}
          onCancel={() => setDeleteTarget(null)} isPending={deleteMutation.isPending} />
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20">
          <School size={18} className="text-sky-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Universities</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{universities.length} institution{universities.length !== 1 ? "s" : ""}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Form */}
        {canManage && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }} className="lg:col-span-2">
            <GlassCard>
              <SectionLabel>{isEditing ? "Edit University" : "Add University"}</SectionLabel>
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {FIELDS.map(f => (
                  <input key={f.name} name={f.name}
                    value={isEditing ? editingUniversity[f.name] ?? "" : form[f.name]}
                    onChange={e => isEditing
                      ? setEditingUniversity(prev => ({ ...prev, [f.name]: e.target.value }))
                      : setForm(prev => ({ ...prev, [f.name]: e.target.value }))}
                    placeholder={f.placeholder} required={f.required}
                    className="w-full h-10 px-3.5 rounded-xl text-sm border border-border/60 bg-card/80
                               text-foreground placeholder:text-muted-foreground/50
                               focus:outline-none focus:ring-2 focus:ring-sky-500/25 focus:border-sky-500/60
                               hover:border-border transition-all duration-150" />
                ))}
                <div className="flex gap-2 pt-1">
                  {isEditing && (
                    <button type="button" onClick={() => setEditingUniversity(null)}
                      className="h-10 px-4 rounded-xl border border-border/60 text-sm text-muted-foreground
                                 hover:border-border hover:text-foreground transition-colors flex items-center gap-1.5">
                      <X size={13} /> Cancel
                    </button>
                  )}
                  <button type="submit" disabled={isSaving || !canManage}
                    className="flex-1 h-10 rounded-xl text-sm font-semibold text-white
                               flex items-center justify-center gap-2 transition-all duration-200
                               active:scale-[0.98] disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #0ea5e9, #0284c7)", boxShadow: isSaving ? "none" : "0 4px 16px rgba(14,165,233,0.3)" }}>
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {isEditing ? "Save Changes" : "Add University"}
                  </button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        )}

        {/* Grid */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className={canManage ? "lg:col-span-3" : "lg:col-span-5"}>
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-24 animate-pulse" />
              ))}
            </div>
          ) : universities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border/50">
              <School size={24} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No universities yet</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid gap-3 sm:grid-cols-2">
                {universities.map(uni => (
                  <UniversityCard key={uni.$id} university={uni}
                    onClick={() => navigate(`/university/${uni.$id}`)}
                    onDelete={canManage ? setDeleteTarget : null}
                    onEdit={canManage ? () => setEditingUniversity(uni) : null} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Universities
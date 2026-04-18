// src/pages/admin/units/Units.jsx
import { useEffect, useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import { Layers, Plus, Pencil, Trash2, X, Loader2, Check } from "lucide-react"

import { getSyllabusByProgram } from "@/services/syllabus/syllabusService"
import { createUnit, getUnitsBySubject, deleteUnit, updateUnit } from "@/services/syllabus/unitService"
import { getPrograms } from "@/services/university/programService"
import { getSubjectsBySyllabusIds } from "@/services/syllabus/subjectService"
import { useAuth } from "@/context/AuthContext"
import { CustomSelect, GlassCard, SectionLabel } from "@/components/admin/CustomSelect"

export default function UnitsAdmin() {
  const { user, role } = useAuth()
  const queryClient    = useQueryClient()
  const canCreateOrEdit = role === "admin" || role === "mod"
  const canDelete       = role === "admin"

  const [programId,   setProgramId]   = useState("")
  const [semester,    setSemester]    = useState("")
  const [branch,      setBranch]      = useState("")
  const [subjectId,   setSubjectId]   = useState("")
  const [title,       setTitle]       = useState("")
  const [order,       setOrder]       = useState("")
  const [editingUnit, setEditingUnit] = useState(null)
  const [isSaving,    setIsSaving]    = useState(false)

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: programs = [] } = useQuery({
    queryKey: ["programs-all"],
    queryFn: getPrograms,
    staleTime: 1000 * 60 * 10,
  })

  const { data: syllabus = [] } = useQuery({
    queryKey: ["syllabus-units", programId, semester],
    queryFn: async () => {
      const list = await getSyllabusByProgram(programId)
      return list.filter(s => Number(s.semester) === Number(semester))
    },
    enabled: !!programId && !!semester,
    staleTime: 1000 * 60 * 5,
  })

  const filteredSyllabus = useMemo(() =>
    branch ? syllabus.filter(s => s.branch === branch) : syllabus,
    [syllabus, branch])

  const syllabusIds = useMemo(() => filteredSyllabus.map(s => s.$id), [filteredSyllabus])

  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-units", syllabusIds],
    queryFn: () => getSubjectsBySyllabusIds(syllabusIds),
    enabled: syllabusIds.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: ["units", subjectId],
    queryFn: () => getUnitsBySubject(subjectId),
    enabled: !!subjectId,
    staleTime: 1000 * 60 * 5,
  })

  const availableBranches = useMemo(() => [...new Set(syllabus.map(s => s.branch).filter(Boolean))], [syllabus])

  // Reset cascades
  useEffect(() => { setBranch(""); setSubjectId(""); setEditingUnit(null); setTitle(""); setOrder("") }, [programId, semester])
  useEffect(() => { setSubjectId(""); setEditingUnit(null); setTitle(""); setOrder("") }, [branch])
  useEffect(() => { if (!subjectId) { setEditingUnit(null); setTitle(""); setOrder("") } }, [subjectId])

  // ── Save unit ──────────────────────────────────────────────────────────────
  const handleSaveUnit = async () => {
    if (!canCreateOrEdit) return
    if (!subjectId || !title || !order) { toast.error("Subject, title and order are required"); return }
    try {
      setIsSaving(true)
      if (editingUnit) {
        await updateUnit(editingUnit.$id, { title, order: Number(order) }, user)
        toast.success("Unit updated")
      } else {
        await createUnit({ subjectId, title, order: Number(order) }, user)
        toast.success("Unit added")
      }
      queryClient.invalidateQueries({ queryKey: ["units", subjectId] })
      setTitle(""); setOrder(""); setEditingUnit(null)
    } catch (err) {
      console.error(err); toast.error("Failed to save unit")
    } finally { setIsSaving(false) }
  }

  const handleDeleteUnit = (unit) => {
    if (!canDelete) return
    toast(`Delete "${unit.title}"?`, {
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteUnit(unit.$id, user, unit.title)
            queryClient.invalidateQueries({ queryKey: ["units", subjectId] })
            toast.success("Unit deleted")
          } catch { toast.error("Failed to delete unit") }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    })
  }

  const sortedUnits = useMemo(() => [...units].sort((a, b) => a.order - b.order), [units])

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Layers size={18} className="text-emerald-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Units</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage units for each subject</p>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Left: Scope + form */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard>
            <SectionLabel>Academic Scope</SectionLabel>
            <div className="space-y-2.5">
              <CustomSelect value={programId} onChange={v => { setProgramId(v); setSemester("") }}
                placeholder="Select Program"
                options={programs.map(p => ({ value: p.$id, label: p.name }))} />
              <CustomSelect value={semester} onChange={setSemester}
                placeholder="Select Semester" disabled={!programId}
                options={[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Semester ${s}` }))} />
              <CustomSelect value={branch} onChange={setBranch}
                placeholder="Select Branch" disabled={!availableBranches.length}
                options={availableBranches.map(b => ({ value: b, label: b }))} />
              <CustomSelect value={subjectId} onChange={setSubjectId}
                placeholder="Select Subject" disabled={!subjects.length}
                options={subjects.map(s => ({ value: s.$id, label: s.subjectName }))} />
            </div>
          </GlassCard>

          {canCreateOrEdit && subjectId && (
            <GlassCard>
              <SectionLabel>{editingUnit ? "Edit Unit" : "Add Unit"}</SectionLabel>
              <div className="space-y-2.5">
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Unit title *"
                  className="w-full h-10 px-3.5 rounded-xl text-sm border border-border/60 bg-card/80
                             text-foreground placeholder:text-muted-foreground/50
                             focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60
                             hover:border-border transition-all duration-150" />
                <input value={order} onChange={e => setOrder(e.target.value)} type="number" min="1"
                  placeholder="Order (1, 2, 3…)"
                  className="w-full h-10 px-3.5 rounded-xl text-sm border border-border/60 bg-card/80
                             text-foreground placeholder:text-muted-foreground/50
                             focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500/60
                             hover:border-border transition-all duration-150" />
                <div className="flex gap-2 pt-1">
                  {editingUnit && (
                    <button type="button" onClick={() => { setEditingUnit(null); setTitle(""); setOrder("") }}
                      className="h-10 px-3 rounded-xl border border-border/60 text-sm text-muted-foreground
                                 hover:border-border hover:text-foreground transition-colors flex items-center gap-1.5">
                      <X size={13} /> Cancel
                    </button>
                  )}
                  <button onClick={handleSaveUnit} disabled={isSaving || !title || !order}
                    className="flex-1 h-10 rounded-xl text-sm font-semibold text-white
                               flex items-center justify-center gap-2 transition-all duration-200
                               active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #059669, #047857)", boxShadow: isSaving ? "none" : "0 4px 16px rgba(5,150,105,0.3)" }}>
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : editingUnit ? <Check size={14} /> : <Plus size={14} />}
                    {editingUnit ? "Update Unit" : "Add Unit"}
                  </button>
                </div>
              </div>
            </GlassCard>
          )}
        </div>

        {/* Right: Units list */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {subjectId ? `${sortedUnits.length} unit${sortedUnits.length !== 1 ? "s" : ""}` : "Units"}
            </p>
          </div>

          {!subjectId ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border/50">
              <Layers size={24} className="text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select a subject to manage units</p>
            </div>
          ) : unitsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-14 animate-pulse" />
              ))}
            </div>
          ) : sortedUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
              <Layers size={20} className="text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No units yet</p>
              {canCreateOrEdit && <p className="text-xs text-muted-foreground/60 mt-1">Add the first unit using the form</p>}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {sortedUnits.map(unit => (
                  <motion.div key={unit.$id} layout
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}
                    className={[
                      "group flex items-center justify-between rounded-2xl border px-4 py-3",
                      "transition-all duration-150",
                      editingUnit?.$id === unit.$id
                        ? "border-emerald-500/40 bg-emerald-500/5"
                        : "border-border/60 bg-card/60 backdrop-blur-sm hover:border-border hover:bg-card/80",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20
                                      flex items-center justify-center text-[11px] font-bold text-emerald-500 shrink-0">
                        {unit.order}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{unit.title}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-3">
                      {canCreateOrEdit && (
                        <button onClick={() => { setEditingUnit(unit); setTitle(unit.title); setOrder(String(unit.order)) }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5
                                     border border-transparent hover:border-primary/20 transition-all active:scale-95">
                          <Pencil size={13} />
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => handleDeleteUnit(unit)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5
                                     border border-transparent hover:border-destructive/20 transition-all active:scale-95">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>
    </div>
  )
}
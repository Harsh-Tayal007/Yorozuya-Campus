// src/pages/admin/syllabus/syllabus.jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState, useRef } from "react"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  ClipboardList, ChevronDown, Check, X, Filter,
  GitBranch, BookOpen, Layers, ExternalLink, Pencil, Trash2, Loader2,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import { getUniversities } from "@/services/university/universityService"
import { getProgramsByUniversity } from "@/services/university/programService"
import {
  createSyllabus, getSyllabusByProgram, updateSyllabus, deleteSyllabus,
} from "@/services/syllabus/syllabusService"
import { getSubjectsBySyllabusIds } from "@/services/syllabus/subjectService"
import { storage } from "@/lib/appwrite"
import { useAuth } from "@/context/AuthContext"
import SyllabusForm from "./syllabusForm"
import { CustomSelect, GlassCard, SectionLabel } from "@/components/admin/CustomSelect"

const BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID

// ── Filter pill select (portal) ────────────────────────────────────────────────
function FilterSelect({ value, onChange, options, placeholder, icon: Icon }) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef          = useRef(null)
  const dropdownRef         = useRef(null)
  const selected            = options.find(o => String(o.value) === String(value))
  const isActive            = value && value !== "ALL"

  const calcCoords = () => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setCoords({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: Math.max(r.width, 160) })
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [open])

  useEffect(() => {
    if (!open) return
    const update = () => calcCoords()
    window.addEventListener("scroll", update, true); window.addEventListener("resize", update)
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update) }
  }, [open])

  const panel = (
    <AnimatePresence>
      {open && (
        <motion.div ref={dropdownRef}
          initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
          transition={{ duration: 0.13 }}
          style={{ position: "absolute", top: coords.top, left: coords.left, width: coords.width, zIndex: 99999, transformOrigin: "top" }}
          className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        >
          <div className="max-h-48 overflow-y-auto py-1">
            {options.map(opt => {
              const isSel = String(opt.value) === String(value)
              return (
                <button key={opt.value} type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={[
                    "flex items-center justify-between w-full px-3.5 py-2 text-xs text-left gap-3 transition-colors",
                    isSel ? "bg-violet-500/10 text-violet-400 font-semibold" : "text-foreground hover:bg-muted/60",
                  ].join(" ")}>
                  <span className="truncate">{opt.label}</span>
                  {isSel && <Check size={11} className="text-violet-400 shrink-0" />}
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="relative">
      <button ref={triggerRef} type="button"
        onClick={() => { if (!open) calcCoords(); setOpen(v => !v) }}
        className={[
          "h-9 pl-3 pr-2 rounded-xl border text-xs font-medium flex items-center gap-1.5",
          "transition-all duration-150 whitespace-nowrap outline-none",
          open ? "border-primary bg-background ring-2 ring-primary/20 text-foreground" :
          isActive ? "border-violet-500/40 bg-violet-500/5 text-violet-400" :
          "border-border/60 bg-card/60 text-muted-foreground hover:border-border hover:text-foreground",
        ].join(" ")}
      >
        {Icon && <Icon size={11} className="shrink-0" />}
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown size={11} className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  )
}

// ── Syllabus card ─────────────────────────────────────────────────────────────
function SyllabusCardModern({ syllabus, subjects, onEdit, onDelete, onView }) {
  const handleView = () => {
    if (!subjects.length) { toast.error("No subject PDF available"); return }
    const url = storage.getFileView(BUCKET_ID, subjects[0].pdfFileId)
    window.open(url, "_blank")
  }

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm
                 hover:border-border hover:bg-card/80 transition-all duration-200 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg, transparent, #06b6d4, transparent)" }} />
      <div className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20
                        flex items-center justify-center shrink-0 mt-0.5
                        group-hover:scale-105 transition-transform duration-200">
          <ClipboardList size={15} className="text-cyan-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground">{syllabus.title}</h3>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <GitBranch size={9} />{syllabus.branch}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <BookOpen size={9} />Sem {syllabus.semester}
                </span>
                {subjects.length > 0 && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Layers size={9} />{subjects.map(s => s.subjectName).join(", ")}
                  </span>
                )}
                {subjects.length === 0 && (
                  <span className="text-[11px] text-muted-foreground/50">No subjects yet</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={handleView}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium
                           border border-border/60 bg-muted/30 text-muted-foreground
                           hover:border-border hover:text-foreground hover:bg-muted/60
                           transition-all duration-150 active:scale-95">
                <ExternalLink size={11} /> View
              </button>
              {onEdit && (
                <button onClick={() => onEdit(syllabus)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5
                             border border-transparent hover:border-primary/20 transition-all duration-150 active:scale-95">
                  <Pencil size={13} />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(syllabus)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5
                             border border-transparent hover:border-destructive/20 transition-all duration-150 active:scale-95">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
const SyllabusAdmin = () => {
  const [selectedUniversity, setSelectedUniversity] = useState("")
  const [selectedProgram,    setSelectedProgram]    = useState("")
  const [editingSyllabus,    setEditingSyllabus]    = useState(null)
  const [filterBranch,       setFilterBranch]       = useState("ALL")
  const [filterSemester,     setFilterSemester]     = useState("ALL")
  const [filterSubject,      setFilterSubject]      = useState("ALL")

  const queryClient = useQueryClient()
  const navigate    = useNavigate()
  const { user, role } = useAuth()
  const canCreateOrEdit = role === "admin" || role === "mod"
  const canDelete       = role === "admin"

  // Universities
  const { data: universities = [] } = useQuery({
    queryKey: ["universities"],
    queryFn: getUniversities,
    staleTime: 1000 * 60 * 10,
  })

  // Programs
  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ["programs", selectedUniversity],
    queryFn: () => getProgramsByUniversity(selectedUniversity),
    enabled: !!selectedUniversity,
    staleTime: 1000 * 60 * 5,
  })

  // Syllabus
  const { data: syllabusList = [], isLoading: syllabusLoading } = useQuery({
    queryKey: ["syllabus", selectedProgram],
    queryFn: () => getSyllabusByProgram(selectedProgram),
    enabled: !!selectedProgram,
    staleTime: 1000 * 60 * 5,
  })

  // Subjects
  const syllabusIds = useMemo(() => syllabusList.map(s => s.$id).sort(), [syllabusList])
  const { data: allSubjects = [] } = useQuery({
    queryKey: ["subjects", syllabusIds],
    queryFn: () => getSubjectsBySyllabusIds(syllabusIds),
    enabled: syllabusIds.length > 0,
    staleTime: 1000 * 60 * 5,
  })

  // Reset on university change
  useEffect(() => {
    setSelectedProgram(""); setEditingSyllabus(null)
    setFilterBranch("ALL"); setFilterSemester("ALL"); setFilterSubject("ALL")
  }, [selectedUniversity])

  useEffect(() => { setEditingSyllabus(null) }, [selectedProgram])

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSyllabus,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["syllabus", selectedProgram] }); toast.success("Syllabus created") },
  })
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSyllabus(id, data, user),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["syllabus", selectedProgram] }); setEditingSyllabus(null); toast.success("Syllabus updated") },
  })
  const deleteMutation = useMutation({
    mutationFn: (s) => deleteSyllabus(s.$id, user, s.title),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["syllabus", selectedProgram] }); toast.success("Syllabus deleted") },
    onError: () => toast.error("Delete failed"),
  })

  // Derived data
  const subjectsMap = useMemo(() => {
    const map = {}
    allSubjects.forEach(s => { if (!map[s.syllabusId]) map[s.syllabusId] = []; map[s.syllabusId].push(s) })
    return map
  }, [allSubjects])

  const availableBranches  = useMemo(() => [...new Set(syllabusList.map(s => s.branch).filter(Boolean))], [syllabusList])
  const availableSubjects  = useMemo(() => [...new Set(allSubjects.map(s => s.subjectName))], [allSubjects])

  const filteredSyllabus = useMemo(() =>
    syllabusList.filter(s => {
      if (filterBranch   !== "ALL" && s.branch !== filterBranch) return false
      if (filterSemester !== "ALL" && String(s.semester) !== filterSemester) return false
      if (filterSubject  !== "ALL" && !allSubjects.some(sub => sub.syllabusId === s.$id && sub.subjectName === filterSubject)) return false
      return true
    }), [syllabusList, allSubjects, filterBranch, filterSemester, filterSubject])

  const hasActiveFilters = filterBranch !== "ALL" || filterSemester !== "ALL" || filterSubject !== "ALL"
  const uniName   = universities.find(u => u.$id === selectedUniversity)?.name
  const progName  = programs.find(p => p.$id === selectedProgram)?.name

  return (
    <div className="space-y-8 max-w-7xl">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
          <ClipboardList size={18} className="text-cyan-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Syllabus</h1>
          <p className="text-xs text-muted-foreground mt-0.5">University → Program → Syllabus</p>
        </div>
      </motion.div>

      {/* Context selectors */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassCard>
          <SectionLabel>Select Context</SectionLabel>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomSelect value={selectedUniversity} onChange={setSelectedUniversity}
              placeholder="Select University" disabled={!!editingSyllabus}
              options={universities.map(u => ({ value: u.$id, label: u.name }))} />
            <CustomSelect value={selectedProgram} onChange={setSelectedProgram}
              placeholder={!selectedUniversity ? "Select university first" : programsLoading ? "Loading…" : "Select Program"}
              disabled={!selectedUniversity || programsLoading || !!editingSyllabus}
              options={programs.map(p => ({ value: p.$id, label: p.name }))} />
          </div>

          {/* Breadcrumb */}
          {uniName && progName && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/40">
              <span className="text-xs text-muted-foreground">{uniName}</span>
              <span className="text-muted-foreground/40 text-xs">→</span>
              <span className="text-xs font-medium text-foreground">{progName}</span>
              <span className="ml-auto text-[11px] text-muted-foreground">{syllabusList.length} syllabus entries</span>
            </div>
          )}
        </GlassCard>
      </motion.div>

      {!selectedProgram ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed border-border/50">
          <ClipboardList size={24} className="text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Select a university and program to manage syllabus</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Form */}
          {canCreateOrEdit && (
            <div className="lg:col-span-2">
              <SyllabusForm
                programId={selectedProgram}
                editingSyllabus={editingSyllabus}
                onCancelEdit={() => setEditingSyllabus(null)}
                user={user}
                onSubmit={(data) => {
                  if (editingSyllabus) updateMutation.mutate({ id: editingSyllabus.$id, data })
                  else createMutation.mutate({ title: data.title, semester: data.semester, branch: data.branch, programId: selectedProgram, description: data.description })
                }}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["syllabus", selectedProgram] })}
              />
            </div>
          )}

          {/* List */}
          <div className={canCreateOrEdit ? "lg:col-span-3" : "lg:col-span-5"}>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Filter size={11} /><span className="hidden sm:block">Filter:</span>
              </div>
              <FilterSelect value={filterBranch} onChange={setFilterBranch}
                placeholder="Branch" icon={GitBranch}
                options={[{ value: "ALL", label: "All Branches" }, ...availableBranches.map(b => ({ value: b, label: b }))]} />
              <FilterSelect value={filterSemester} onChange={setFilterSemester}
                placeholder="Semester" icon={BookOpen}
                options={[{ value: "ALL", label: "All Semesters" }, ...[1,2,3,4,5,6,7,8].map(s => ({ value: String(s), label: `Sem ${s}` }))]} />
              <FilterSelect value={filterSubject} onChange={setFilterSubject}
                placeholder="Subject" icon={Layers}
                options={[{ value: "ALL", label: "All Subjects" }, ...availableSubjects.map(s => ({ value: s, label: s }))]} />
              {hasActiveFilters && (
                <button onClick={() => { setFilterBranch("ALL"); setFilterSemester("ALL"); setFilterSubject("ALL") }}
                  className="h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground border border-border/60
                             hover:border-border hover:text-foreground bg-card/60 transition-all flex items-center gap-1">
                  <X size={11} /> Clear
                </button>
              )}
              <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
                {filteredSyllabus.length} of {syllabusList.length}
              </span>
            </div>

            {/* Cards */}
            {syllabusLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-20 animate-pulse" />
                ))}
              </div>
            ) : filteredSyllabus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
                <ClipboardList size={20} className="text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No syllabus matches the filters</p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                <div className="space-y-2.5">
                  {filteredSyllabus.map(s => (
                    <SyllabusCardModern key={s.$id} syllabus={s}
                      subjects={subjectsMap[s.$id] ?? []}
                      onEdit={canCreateOrEdit ? setEditingSyllabus : null}
                      onDelete={canDelete ? (s) => deleteMutation.mutate(s) : null}
                      onView={(s) => navigate(`/admin/syllabus/${s.$id}`)} />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default SyllabusAdmin
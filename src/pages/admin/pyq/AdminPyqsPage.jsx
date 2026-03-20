// src/pages/admin/pyq/AdminPyqsPage.jsx
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { useQuery } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { FileText, Search, X, ChevronDown, Check, Filter, BookOpen, GraduationCap, GitBranch, Layers } from "lucide-react"
import { getSubjectsBySyllabusIds } from "@/services/syllabus/subjectService"
import PyqList from "./PyqList"

const DATABASE_ID          = import.meta.env.VITE_APPWRITE_DATABASE_ID
const PROGRAMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROGRAMS_COLLECTION_ID
const SYLLABUS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SYLLABUS_COLLECTION_ID
const UNITS_COLLECTION_ID  = import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID
const MOCK_SEMESTERS       = [1,2,3,4,5,6,7,8]

// ── Portal filter select ──────────────────────────────────────────────────────
function FilterSelect({ value, onChange, options, placeholder, icon: Icon, disabled }) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef          = useRef(null)
  const dropdownRef         = useRef(null)
  const selected            = options.find(o => String(o.value) === String(value))
  const isActive            = value && value !== "all"

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
          transition={{ duration: 0.13, ease: "easeOut" }}
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
                    "flex items-center justify-between w-full px-3.5 py-2 text-xs text-left gap-3",
                    "transition-colors duration-100",
                    isSel ? "bg-violet-500/10 text-violet-400 font-semibold" : "text-foreground hover:bg-muted/60",
                  ].join(" ")}
                >
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
      <button ref={triggerRef} type="button" disabled={disabled}
        onClick={() => { if (!disabled) { if (!open) calcCoords(); setOpen(v => !v) } }}
        className={[
          "h-9 pl-3 pr-2 rounded-xl border text-xs font-medium flex items-center gap-1.5",
          "transition-all duration-150 whitespace-nowrap outline-none",
          disabled ? "border-border/30 bg-muted/10 text-muted-foreground/40 cursor-not-allowed" :
          open ? "border-primary bg-background ring-2 ring-primary/20 text-foreground" :
          isActive ? "border-violet-500/40 bg-violet-500/5 text-violet-400" :
          "border-border/60 bg-card/60 text-muted-foreground hover:border-border hover:text-foreground",
        ].join(" ")}
      >
        {Icon && <Icon size={11} className="shrink-0" />}
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown size={11} className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  )
}

export default function AdminPyqsPage() {
  const [filters, setFilters] = useState({
    programId: "all", branch: "all", semester: "all", subjectId: "all", unitId: "all",
  })
  const [searchTerm,         setSearchTerm]         = useState("")
  const [filterSyllabusList, setFilterSyllabusList] = useState([])
  const [filterSubjects,     setFilterSubjects]     = useState([])
  const [filterUnits,        setFilterUnits]        = useState([])

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const resetDeps    = (keys) => setFilters(prev => { const u = { ...prev }; keys.forEach(k => u[k] = "all"); return u })

  const isProgramSelected  = filters.programId !== "all"
  const isBranchSelected   = filters.branch    !== "all"
  const isSemesterSelected = filters.semester  !== "all"
  const isSubjectSelected  = filters.subjectId !== "all"
  const hasActiveFilters   = Object.values(filters).some(v => v !== "all") || searchTerm

  // Programs — cached till reload
  const { data: programs = [] } = useQuery({
    queryKey: ["programs-all"],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, PROGRAMS_COLLECTION_ID, [Query.orderAsc("name")])
      return res.documents
    },
    staleTime: Infinity,
  })

  const filterBranches = Array.from(new Set(filterSyllabusList.map(s => s.branch).filter(Boolean)))

  // Syllabus for filter
  useEffect(() => {
    if (!isProgramSelected) { setFilterSyllabusList([]); return }
    databases.listDocuments(DATABASE_ID, SYLLABUS_COLLECTION_ID, [Query.equal("programId", filters.programId)])
      .then(res => setFilterSyllabusList(res.documents)).catch(() => setFilterSyllabusList([]))
  }, [filters.programId])

  // Subjects for filter
  useEffect(() => {
    if (!isProgramSelected) { setFilterSubjects([]); return }
    let rel = filterSyllabusList
    if (isBranchSelected)   rel = rel.filter(s => s.branch === filters.branch)
    if (isSemesterSelected) rel = rel.filter(s => Number(s.semester) === Number(filters.semester))
    const ids = rel.map(s => s.$id)
    if (!ids.length) { setFilterSubjects([]); return }
    getSubjectsBySyllabusIds(ids).then(setFilterSubjects).catch(() => setFilterSubjects([]))
  }, [filters.programId, filters.branch, filters.semester, filterSyllabusList])

  // Units for filter
  useEffect(() => {
    if (!isSubjectSelected) { setFilterUnits([]); return }
    databases.listDocuments(DATABASE_ID, UNITS_COLLECTION_ID, [Query.equal("subjectId", filters.subjectId)])
      .then(res => setFilterUnits(res.documents)).catch(() => setFilterUnits([]))
  }, [filters.subjectId])

  const clearAll = () => {
    setSearchTerm("")
    setFilters({ programId: "all", branch: "all", semester: "all", subjectId: "all", unitId: "all" })
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <FileText size={18} className="text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">All PYQs</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Browse and manage all previous year question papers</p>
        </div>
      </motion.div>

      {/* Search + Filters */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-2"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search PYQs…"
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm
                       text-xs text-foreground placeholder:text-muted-foreground/50
                       focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
                       hover:border-border transition-all duration-150" />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Filter size={11} /><span className="hidden sm:block">Filter:</span>
        </div>

        <FilterSelect value={filters.programId}
          onChange={v => { updateFilter("programId", v); resetDeps(["branch","semester","subjectId","unitId"]) }}
          placeholder="Program" icon={GraduationCap}
          options={[{ value: "all", label: "All Programs" }, ...programs.map(p => ({ value: p.$id, label: p.name }))]} />

        <FilterSelect value={filters.branch}
          onChange={v => { updateFilter("branch", v); resetDeps(["semester","subjectId","unitId"]) }}
          placeholder="Branch" icon={GitBranch} disabled={!isProgramSelected}
          options={[{ value: "all", label: "All Branches" }, ...filterBranches.map(b => ({ value: b, label: b }))]} />

        <FilterSelect value={filters.semester}
          onChange={v => { updateFilter("semester", v); resetDeps(["subjectId","unitId"]) }}
          placeholder="Semester" icon={BookOpen} disabled={!isProgramSelected}
          options={[{ value: "all", label: "All Semesters" }, ...MOCK_SEMESTERS.map(s => ({ value: String(s), label: `Sem ${s}` }))]} />

        <FilterSelect value={filters.subjectId}
          onChange={v => { updateFilter("subjectId", v); resetDeps(["unitId"]) }}
          placeholder="Subject" icon={Layers}
          disabled={!isProgramSelected || (!isBranchSelected && !isSemesterSelected)}
          options={[{ value: "all", label: "All Subjects" }, ...filterSubjects.map(s => ({ value: s.$id, label: s.subjectName }))]} />

        <FilterSelect value={filters.unitId}
          onChange={v => updateFilter("unitId", v)}
          placeholder="Unit" icon={Layers} disabled={!isSubjectSelected}
          options={[{ value: "all", label: "All Units" }, ...filterUnits.map(u => ({ value: u.$id, label: u.title }))]} />

        {hasActiveFilters && (
          <button onClick={clearAll}
            className="h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground
                       border border-border/60 hover:border-border hover:text-foreground
                       bg-card/60 transition-all duration-150 flex items-center gap-1">
            <X size={11} /> Clear
          </button>
        )}
      </motion.div>

      {/* List — no limit, no showViewMore */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <PyqList
          limit={50}
          filters={filters}
          searchTerm={searchTerm}
          showViewMore={false}
          onEdit={null}
        />
      </motion.div>
    </div>
  )
}
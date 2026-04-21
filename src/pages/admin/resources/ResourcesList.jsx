import { useEffect, useState } from "react"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import { getPrograms } from "@/services/university/programService"
import { getUnitsBySubject } from "@/services/syllabus/unitService"
import { deleteResource } from "@/services/resource/resourceService"
import { useAuth } from "@/context/AuthContext"
import { getSubjectsByIds } from "@/services/syllabus/subjectService"
import { Search, ExternalLink, Pencil, Trash2, FileText,
  Video, Link as LinkIcon, StickyNote, ChevronDown,
  Check, BookOpen, Layers, GraduationCap, GitBranch,
  Filter, X,
} from "lucide-react"
import { getFileViewUrl, getFileMetadata } from "@/services/shared/storageAdapter"
import { formatFileSize } from "@/utils/formatFileSize"

// ── Type config ───────────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  pdf:   { icon: FileText,  accent: "#ef4444", label: "PDF"   },
  video: { icon: Video,     accent: "#8b5cf6", label: "Video" },
  link:  { icon: LinkIcon,  accent: "#06b6d4", label: "Link"  },
  notes: { icon: StickyNote,accent: "#f59e0b", label: "Notes" },
}

// ── Custom filter select ──────────────────────────────────────────────────────
function FilterSelect({ value, onChange, options, placeholder, icon: Icon }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`h-9 pl-3 pr-2 rounded-xl border text-xs font-medium flex items-center gap-1.5
                    transition-all duration-150 whitespace-nowrap
                    ${open
                      ? "border-primary bg-background ring-2 ring-primary/20 text-foreground"
                      : value !== "all"
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border/60 bg-card/60 text-muted-foreground hover:border-border hover:text-foreground"}`}
      >
        {Icon && <Icon size={12} className="shrink-0" />}
        <span>{selected?.label ?? placeholder}</span>
        <ChevronDown size={11} className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute left-0 top-full mt-1.5 min-w-[160px] z-[200] rounded-xl
                       border border-border bg-background shadow-xl overflow-hidden origin-top"
            style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
          >
            <div className="max-h-48 overflow-y-auto py-1">
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false) }}
                  className={`flex items-center justify-between w-full px-3.5 py-2 text-xs
                              transition-colors hover:bg-muted text-left gap-3
                              ${opt.value === value ? "text-primary font-semibold bg-primary/5" : "text-foreground"}`}
                >
                  <span className="truncate">{opt.label}</span>
                  {opt.value === value && <Check size={11} className="text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Resource card ─────────────────────────────────────────────────────────────
function ResourceCard({ r, programMap, subjectMap, unitMap, fileSize, canEdit, canDelete, onEdit, onDelete, onOpen, searchTerm }) {
  const typeConfig = TYPE_CONFIG[r.type] ?? TYPE_CONFIG.pdf
  const Icon = typeConfig.icon

  const highlightMatch = (text, query) => {
    if (!query || !text) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig")
    return String(text).split(regex).map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5 not-italic">{part}</mark>
        : part
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm
                 hover:border-border hover:bg-card/80 transition-all duration-200 overflow-hidden"
    >
      {/* Accent top line */}
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${typeConfig.accent}, transparent)` }}
      />

      <div className="p-4 flex items-start gap-4">
        {/* Type icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5
                     transition-transform duration-200 group-hover:scale-105"
          style={{ background: `${typeConfig.accent}15`, border: `1px solid ${typeConfig.accent}30` }}
        >
          <Icon size={17} style={{ color: typeConfig.accent }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate">
                {highlightMatch(r.title, searchTerm)}
              </h3>
              {/* Type badge */}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: `${typeConfig.accent}15`, color: typeConfig.accent }}
                >
                  {typeConfig.label}
                </span>
                {fileSize > 0 && (
                  <span className="hidden sm:inline-block text-[10px] font-semibold bg-muted/60 text-muted-foreground/80 px-1.5 py-px rounded">
                    {formatFileSize(fileSize)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onOpen(r)}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium
                           border border-border/60 bg-muted/30 text-muted-foreground
                           hover:border-border hover:text-foreground hover:bg-muted/60
                           transition-all duration-150 active:scale-95"
              >
                <ExternalLink size={11} /> View
              </button>
              {canEdit && (
                <button
                  onClick={() => onEdit(r)}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium
                             border border-border/60 bg-muted/30 text-muted-foreground
                             hover:border-primary/40 hover:text-primary hover:bg-primary/5
                             transition-all duration-150 active:scale-95"
                >
                  <Pencil size={11} /> Edit
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => onDelete(r)}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium
                             border border-border/60 bg-muted/30 text-muted-foreground
                             hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5
                             transition-all duration-150 active:scale-95"
                >
                  <Trash2 size={11} /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
            {programMap[r.programId] && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <GraduationCap size={10} className="shrink-0" />
                {programMap[r.programId]}
              </span>
            )}
            {r.semester && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <BookOpen size={10} className="shrink-0" />
                Sem {r.semester}
              </span>
            )}
            {r.branch && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <GitBranch size={10} className="shrink-0" />
                {r.branch}
              </span>
            )}
            {subjectMap[r.subjectId] && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Layers size={10} className="shrink-0" />
                {subjectMap[r.subjectId]}
              </span>
            )}
            {unitMap[r.unitId] && (
              <span className="text-[11px] text-muted-foreground/60">
                · {unitMap[r.unitId]}
              </span>
            )}
          </div>

          {r.description && (
            <p className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2">{r.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// need useRef import for FilterSelect
import { useRef } from "react"

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ResourcesList({ resources, setResources, onEdit }) {
  const [programMap, setProgramMap] = useState({})
  const [subjectMap, setSubjectMap] = useState({})
  const [unitMap,    setUnitMap]    = useState({})
  const [filterProgram,  setFilterProgram]  = useState("all")
  const [filterSemester, setFilterSemester] = useState("all")
  const [filterSubject,  setFilterSubject]  = useState("all")
  const [filterUnit,     setFilterUnit]     = useState("all")
  const [searchTerm,      setSearchTerm]      = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [fileSizeMap,     setFileSizeMap]     = useState({})
  const { user, role } = useAuth()
  const canEdit   = role === "admin" || role === "mod"
  const canDelete = role === "admin"

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  useEffect(() => { setFilterUnit("all") }, [filterSubject])

  const openResource = (r) => {
    if (r.type === "link") { window.open(r.url, "_blank"); return }
    const fileUrl = getFileViewUrl(r.fileId, r.storageProvider, "resource", r.bucketId)
    window.open(fileUrl, "_blank")
  }

  const handleDelete = (resource) => {
    if (!canDelete) return
    toast(`Delete "${resource.title}"?`, {
      action: {
        label: "Delete",
        onClick: async () => {
          const id = toast.loading("Deleting…")
          try {
            await deleteResource(resource, user)
            setResources(prev => prev.filter(r => r.$id !== resource.$id))
            toast.success("Resource deleted", { id })
          } catch (err) {
            console.error(err)
            toast.error("Failed to delete", { id })
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    })
  }

  const handleEdit = (r) => {
    onEdit?.(r)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  useEffect(() => {
    getPrograms().then(list => {
      const map = {}
      list.forEach(p => { map[p.$id] = p.name })
      setProgramMap(map)
    }).catch(console.error)
  }, [])

  useEffect(() => {
    if (!resources.length) return
    const subjectIds = [...new Set(resources.map(r => r.subjectId).filter(Boolean))]
    if (!subjectIds.length) return
    const subjectMapTemp = {}
    const unitMapTemp    = {}
    getSubjectsByIds(subjectIds).then(subjects => {
      subjects.forEach(s => { subjectMapTemp[s.$id] = s.subjectName })
      setSubjectMap(subjectMapTemp)
    }).catch(console.error)
    Promise.all(subjectIds.map(id => getUnitsBySubject(id))).then(results => {
      results.flat().forEach(u => { unitMapTemp[u.$id] = u.title })
      setUnitMap(unitMapTemp)
    }).catch(console.error)
  }, [resources])

  useEffect(() => {
    if (!resources?.length) return
    const toFetch = resources.filter(r => r.fileId && !fileSizeMap[r.fileId] && r.type === "pdf")
    if (!toFetch.length) return

    Promise.all(toFetch.map(async r => {
      try {
        const meta = await getFileMetadata(r.fileId, r.storageProvider, "resource", r.bucketId)
        return { id: r.fileId, size: meta.size }
      } catch {
        return null
      }
    })).then(results => {
      const newMap = { ...fileSizeMap }
      results.forEach(res => { if (res) newMap[res.id] = res.size })
      setFileSizeMap(newMap)
    })
  }, [resources])

  if (!resources || resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3
                      rounded-2xl border border-dashed border-border/50">
        <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center">
          <FileText size={18} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">No resources added yet</p>
      </div>
    )
  }

  const filteredResources = resources.filter(r => {
    if (filterProgram  !== "all" && r.programId  !== filterProgram)  return false
    if (filterSemester !== "all" && String(r.semester) !== filterSemester) return false
    if (filterSubject  !== "all" && r.subjectId  !== filterSubject)  return false
    if (filterUnit     !== "all" && r.unitId     !== filterUnit)     return false
    if (debouncedSearch && !r.title?.toLowerCase().includes(debouncedSearch)) return false
    return true
  })

  const subjectIds = [...new Set(resources.map(r => r.subjectId).filter(Boolean))]
  const unitIds    = [...new Set(
    resources
      .filter(r => filterSubject === "all" || r.subjectId === filterSubject)
      .map(r => r.unitId).filter(Boolean)
  )]

  const hasActiveFilters = filterProgram !== "all" || filterSemester !== "all" ||
                           filterSubject !== "all" || filterUnit !== "all" || searchTerm

  const clearFilters = () => {
    setFilterProgram("all"); setFilterSemester("all")
    setFilterSubject("all"); setFilterUnit("all")
    setSearchTerm("")
  }

  return (
    <div className="space-y-4">

      {/* Search + filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search resources…"
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-border/60 bg-card/60
                       backdrop-blur-sm text-xs text-foreground placeholder:text-muted-foreground/50
                       focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
                       hover:border-border transition-all duration-150"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filter icon */}
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Filter size={11} />
          <span className="hidden sm:block">Filter:</span>
        </div>

        <FilterSelect
          value={filterProgram}
          onChange={setFilterProgram}
          placeholder="Program"
          icon={GraduationCap}
          options={[
            { value: "all", label: "All Programs" },
            ...[...new Set(resources.map(r => r.programId))].map(id => ({ value: id, label: programMap[id] || id }))
          ]}
        />
        <FilterSelect
          value={filterSemester}
          onChange={setFilterSemester}
          placeholder="Semester"
          icon={BookOpen}
          options={[
            { value: "all", label: "All Semesters" },
            ...[...new Set(resources.map(r => String(r.semester)))].map(s => ({ value: s, label: `Sem ${s}` }))
          ]}
        />
        <FilterSelect
          value={filterSubject}
          onChange={setFilterSubject}
          placeholder="Subject"
          icon={Layers}
          options={[
            { value: "all", label: "All Subjects" },
            ...subjectIds.map(id => ({ value: id, label: subjectMap[id] || id }))
          ]}
        />
        <FilterSelect
          value={filterUnit}
          onChange={setFilterUnit}
          placeholder="Unit"
          icon={Layers}
          options={[
            { value: "all", label: "All Units" },
            ...unitIds.map(id => ({ value: id, label: unitMap[id] || id }))
          ]}
        />

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground
                       border border-border/60 hover:border-border hover:text-foreground
                       bg-card/60 transition-all duration-150 flex items-center gap-1"
          >
            <X size={11} /> Clear
          </button>
        )}

        {/* Count */}
        <span className="ml-auto text-xs text-muted-foreground hidden sm:block">
          {filteredResources.length} of {resources.length}
        </span>
      </div>

      {/* Cards */}
      {filteredResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2
                        rounded-2xl border border-dashed border-border/50">
          <Search size={18} className="text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">No resources match your filters</p>
          <button onClick={clearFilters} className="text-xs text-primary hover:underline mt-1">
            Clear filters
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2.5">
            {filteredResources.map(r => (
              <ResourceCard
                key={r.$id}
                r={r}
                programMap={programMap}
                subjectMap={subjectMap}
                unitMap={unitMap}
                fileSize={fileSizeMap[r.fileId]}
                canEdit={canEdit}
                canDelete={canDelete}
                searchTerm={debouncedSearch}
                onOpen={openResource}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
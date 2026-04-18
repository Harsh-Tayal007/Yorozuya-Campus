import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"
import {
  Upload, Loader2, Link as LinkIcon, FileText,
  Video, StickyNote, X, ChevronDown, Check,
} from "lucide-react"

import { getUnitsBySubject } from "@/services/syllabus/unitService"
import { getSyllabusByProgram } from "@/services/syllabus/syllabusService"
import { getPrograms } from "@/services/university/programService"
import { createResource, updateResource } from "@/services/resource/resourceService"
import ResourcesList from "./ResourcesList"
import { databases } from "@/lib/appwrite"
import { DATABASE_ID, RESOURCES_COLLECTION_ID } from "@/config/appwrite"
import { useAuth } from "@/context/AuthContext"
import { getSubjectsBySyllabusIds } from "@/services/syllabus/subjectService"

const RESOURCE_TYPES = [
  { value: "pdf",   label: "PDF",   icon: FileText,  accent: "#ef4444" },
  { value: "video", label: "Video", icon: Video,     accent: "#8b5cf6" },
  { value: "link",  label: "Link",  icon: LinkIcon,  accent: "#06b6d4" },
  { value: "notes", label: "Notes", icon: StickyNote,accent: "#f59e0b" },
]

// ─────────────────────────────────────────────────────────────────────────────
// CustomSelect — dropdown portaled into document.body
// Avoids ALL z-index / stacking context / overflow issues permanently
// ─────────────────────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen]           = useState(false)
  const [coords, setCoords]       = useState({ top: 0, left: 0, width: 0 })
  const triggerRef                = useRef(null)
  const dropdownRef               = useRef(null)
  const selected                  = options.find(o => String(o.value) === String(value))

  const calcCoords = () => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setCoords({
      top:   r.bottom + window.scrollY + 6,
      left:  r.left   + window.scrollX,
      width: r.width,
    })
  }

  const handleToggle = () => {
    if (disabled) return
    if (!open) calcCoords()
    setOpen(v => !v)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) setOpen(false)
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [open])

  // Recalc on scroll so it follows the trigger
  useEffect(() => {
    if (!open) return
    const handler = () => calcCoords()
    window.addEventListener("scroll", handler, true)
    window.addEventListener("resize", handler)
    return () => {
      window.removeEventListener("scroll", handler, true)
      window.removeEventListener("resize", handler)
    }
  }, [open])

  // Close on route change / unmount
  useEffect(() => () => setOpen(false), [])

  const dropdownContent = (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
          animate={{ opacity: 1, y: 0, scaleY: 1 }}
          exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
          transition={{ duration: 0.13, ease: "easeOut" }}
          style={{
            position:      "absolute",
            top:           coords.top,
            left:          coords.left,
            width:         coords.width,
            zIndex:        99999,
            transformOrigin: "top",
          }}
          className="rounded-xl border border-border bg-popover shadow-2xl overflow-hidden"
        >
          <div className="max-h-52 overflow-y-auto py-1">
            {options.length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No options available</p>
            ) : (
              options.map(opt => {
                const isActive = String(opt.value) === String(value)
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={[
                      "flex items-center justify-between w-full px-4 py-2.5 text-sm text-left gap-3",
                      "transition-colors duration-100",
                      isActive
                        ? "bg-violet-500/10 text-violet-400 font-semibold"
                        : "text-foreground hover:bg-muted/60",
                    ].join(" ")}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isActive && <Check size={13} className="text-violet-400 shrink-0" />}
                  </button>
                )
              })
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        className={[
          "w-full h-10 px-3.5 rounded-xl border text-sm text-left",
          "flex items-center justify-between gap-2 select-none outline-none",
          "transition-all duration-150",
          disabled
            ? "border-border/30 bg-muted/20 text-muted-foreground/40 cursor-not-allowed pointer-events-none"
            : open
              ? "border-violet-500/60 bg-card ring-2 ring-violet-500/20 text-foreground"
              : "border-border/60 bg-card/80 text-foreground hover:border-border cursor-pointer",
        ].join(" ")}
      >
        <span className={selected ? "text-foreground truncate" : "text-muted-foreground/60"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={14}
          className={[
            "shrink-0 transition-transform duration-200",
            disabled ? "text-muted-foreground/30" : "text-muted-foreground",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {/* Portal: renders directly in document.body — zero stacking context issues */}
      {typeof document !== "undefined" && createPortal(dropdownContent, document.body)}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </p>
  )
}

function GlassCard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

export default function ResourcesUpload() {
  const [programId,       setProgramId]       = useState("")
  const [branch,          setBranch]          = useState("")
  const [semester,        setSemester]        = useState("")
  const [syllabusList,    setSyllabusList]    = useState([])
  const [syllabusIds,     setSyllabusIds]     = useState([])
  const [subjectId,       setSubjectId]       = useState("")
  const [unitId,          setUnitId]          = useState("")
  const [units,           setUnits]           = useState([])
  const [resourceType,    setResourceType]    = useState("")
  const [subjects,        setSubjects]        = useState([])
  const [title,           setTitle]           = useState("")
  const [description,     setDescription]     = useState("")
  const [file,            setFile]            = useState(null)
  const [url,             setUrl]             = useState("")
  const [programs,        setPrograms]        = useState([])
  const [isUploading,     setIsUploading]     = useState(false)
  const [resources,       setResources]       = useState([])
  const [editingResource, setEditingResource] = useState(null)
  const isEditMode   = Boolean(editingResource)
  const fileInputRef = useRef(null)
  const { user, role } = useAuth()
  const canUpload    = role === "admin" || role === "mod"
  const MOCK_SEMESTERS = [1,2,3,4,5,6,7,8]

  useEffect(() => {
    if (!syllabusIds.length) { setSubjects([]); setSubjectId(""); return }
    getSubjectsBySyllabusIds(syllabusIds).then(setSubjects).catch(console.error)
  }, [syllabusIds])

  useEffect(() => {
    if (!programId || !semester) { setSyllabusList([]); return }
    getSyllabusByProgram(programId).then(list => {
      const filtered = list.filter(s => Number(s.semester) === Number(semester))
      setSyllabusList(filtered)
      setSyllabusIds(filtered.map(s => s.$id))
    }).catch(console.error)
  }, [programId, semester])

  useEffect(() => { getPrograms().then(setPrograms).catch(console.error) }, [])

  useEffect(() => {
    if (!subjectId) { setUnits([]); return }
    getUnitsBySubject(subjectId).then(list => setUnits(list || [])).catch(() => setUnits([]))
  }, [subjectId])

  useEffect(() => { setSemester(""); setBranch(""); setSubjectId(""); setUnitId(""); setUnits([]) }, [programId])
  useEffect(() => { setBranch(""); setSubjectId(""); setUnitId(""); setUnits([]) }, [semester])
  useEffect(() => { setSubjectId(""); setUnitId(""); setUnits([]) }, [branch])

  useEffect(() => {
    databases.listDocuments(DATABASE_ID, RESOURCES_COLLECTION_ID)
      .then(res => setResources(res.documents || []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!editingResource) return
    setProgramId(editingResource.programId)
    setTitle(editingResource.title)
    setDescription(editingResource.description || "")
    setResourceType(editingResource.type)
    setUrl(editingResource.url || "")
  }, [editingResource])

  useEffect(() => {
    if (!editingResource || !programId) return
    setSemester(String(editingResource.semester))
  }, [programId, editingResource])

  useEffect(() => {
    if (!editingResource || !syllabusList.length) return
    setBranch(editingResource.branch)
  }, [syllabusList, editingResource])

  useEffect(() => {
    if (!editingResource || !branch) return
    if (subjects.some(s => s.$id === editingResource.subjectId))
      setSubjectId(editingResource.subjectId)
  }, [branch, subjects, editingResource])

  useEffect(() => {
    if (!editingResource || !units.length) return
    setUnitId(editingResource.unitId)
  }, [units, editingResource])

  const availableBranches = Array.from(new Set(syllabusList.map(s => s.branch).filter(Boolean)))

  const resetForm = () => {
    setProgramId(""); setSemester(""); setBranch(""); setSubjectId(""); setUnitId("")
    setResourceType(""); setTitle(""); setDescription(""); setFile(null); setUrl("")
    setEditingResource(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCancelEdit = () => { resetForm(); window.scrollTo({ top: 0, behavior: "smooth" }) }

  const handleSubmit = async () => {
    if (!canUpload || isUploading) return
    try {
      setIsUploading(true)
      if (!programId || !semester || !branch || !subjectId || !resourceType || !title) {
        toast.error("Please fill all required fields"); return
      }
      if (resourceType === "link" && !url)           { toast.error("Please provide a URL"); return }
      if (resourceType !== "link" && !file && !isEditMode) { toast.error("Please select a file"); return }

      if (isEditMode) {
        const payload = { programId, semester, branch, subjectId, title, description, type: resourceType, url }
        if (unitId) payload.unitId = unitId
        const updated = await updateResource(editingResource.$id, payload, user)
        setResources(prev => prev.map(r => r.$id === updated.$id ? updated : r))
        resetForm(); window.scrollTo({ top: 0, behavior: "smooth" })
        toast.success("Resource updated")
      } else {
        const payload = { programId, semester, branch, subjectId, title, description, resourceType, file, url }
        if (unitId) payload.unitId = unitId
        const created = await createResource(payload, user)
        setResources(prev => [created, ...prev])
        resetForm(); toast.success("Resource uploaded")
      }
    } catch (err) {
      console.error(err); toast.error("Failed to save resource")
    } finally { setIsUploading(false) }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center gap-3 flex-wrap"
      >
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Upload size={18} className="text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight">
            {isEditMode ? "Edit Resource" : "Upload Resource"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditMode ? `Editing: ${editingResource?.title}` : "Add study materials to the platform"}
          </p>
        </div>
        {isEditMode && (
          <button onClick={handleCancelEdit}
            className="flex items-center gap-1.5 text-xs text-muted-foreground
                       hover:text-foreground transition-colors px-3 py-1.5 rounded-xl
                       border border-border/60 hover:border-border bg-card/50 shrink-0">
            <X size={12} /> Cancel edit
          </button>
        )}
      </motion.div>

      {canUpload && (
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-5"
        >
          {/* Academic Scope */}
          <div className="lg:col-span-2">
            <GlassCard>
              <SectionLabel>Academic Scope</SectionLabel>
              <div className="space-y-2.5">
                <CustomSelect value={programId} onChange={setProgramId}
                  placeholder="Select Program"
                  options={programs.map(p => ({ value: p.$id, label: p.name }))} />
                <CustomSelect value={semester} onChange={setSemester}
                  placeholder="Select Semester" disabled={!programId}
                  options={MOCK_SEMESTERS.map(s => ({ value: String(s), label: `Semester ${s}` }))} />
                <CustomSelect value={branch} onChange={setBranch}
                  placeholder="Select Branch" disabled={!availableBranches.length}
                  options={availableBranches.map(b => ({ value: b, label: b }))} />
                <CustomSelect value={subjectId} onChange={setSubjectId}
                  placeholder="Select Subject" disabled={!subjects.length}
                  options={subjects.map(s => ({ value: s.$id, label: s.subjectName }))} />
                <CustomSelect value={unitId} onChange={setUnitId}
                  placeholder={
                    !subjectId           ? "Select subject first"
                    : units.length === 0 ? "No units available"
                    :                      "Select Unit (optional)"
                  }
                  disabled={!subjectId || units.length === 0}
                  options={[...units].sort((a,b) => a.order - b.order)
                    .map(u => ({ value: u.$id, label: `Unit ${u.order}: ${u.title}` }))} />
              </div>
            </GlassCard>
          </div>

          {/* Resource Details */}
          <div className="lg:col-span-3 space-y-4">

            {/* Type pills */}
            <GlassCard>
              <SectionLabel>Resource Type</SectionLabel>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {RESOURCE_TYPES.map(type => {
                  const Icon = type.icon
                  const isSel = resourceType === type.value
                  return (
                    <button key={type.value} type="button" onClick={() => setResourceType(type.value)}
                      className="relative flex flex-col items-center gap-1.5 py-3 px-2
                                 rounded-xl border text-xs font-medium outline-none
                                 transition-all duration-200 active:scale-95"
                      style={isSel ? {
                        background:   `${type.accent}18`,
                        borderColor:  `${type.accent}50`,
                        color:        type.accent,
                      } : {
                        borderColor:  "hsl(var(--border) / 0.6)",
                        color:        "hsl(var(--muted-foreground))",
                        background:   "hsl(var(--muted) / 0.2)",
                      }}
                    >
                      {isSel && (
                        <span className="absolute top-1.5 right-1.5">
                          <Check size={9} style={{ color: type.accent }} />
                        </span>
                      )}
                      <Icon size={16} />
                      {type.label}
                    </button>
                  )
                })}
              </div>
            </GlassCard>

            {/* Details */}
            <GlassCard>
              <SectionLabel>Details</SectionLabel>
              <div className="space-y-3">
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="Resource title *"
                  className="w-full h-10 px-3.5 rounded-xl text-sm border border-border/60 bg-card/80
                             text-foreground placeholder:text-muted-foreground/50
                             focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500/60
                             hover:border-border transition-all duration-150" />
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Description (optional)" rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-border/60 bg-card/80
                             text-foreground placeholder:text-muted-foreground/50
                             focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500/60
                             hover:border-border transition-all duration-150 resize-none" />
              </div>
            </GlassCard>

            {/* File / URL */}
            <GlassCard>
              <SectionLabel>File or URL</SectionLabel>
              <div className="space-y-3">
                <div
                  onClick={() => resourceType !== "link" && fileInputRef.current?.click()}
                  className={[
                    "flex flex-col items-center justify-center gap-2.5 rounded-xl",
                    "border-2 border-dashed py-7 px-4 text-center transition-all duration-200",
                    resourceType === "link"
                      ? "border-border/20 opacity-40 cursor-not-allowed"
                      : file
                        ? "border-emerald-500/40 bg-emerald-500/5 cursor-pointer"
                        : "border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer",
                  ].join(" ")}
                >
                  <input type="file" ref={fileInputRef} disabled={resourceType === "link"}
                    onChange={e => setFile(e.target.files[0] || null)} className="hidden" />
                  {file ? (
                    <>
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <Check size={16} className="text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-emerald-500 truncate max-w-[200px]">{file.name}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{(file.size/1024/1024).toFixed(2)} MB</p>
                      </div>
                      <button type="button"
                        onClick={e => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                        className="text-[11px] text-muted-foreground hover:text-destructive
                                   border border-border/50 hover:border-destructive/30 px-2.5 py-1 rounded-lg transition-colors">
                        Remove file
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center">
                        <Upload size={16} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {resourceType === "link" ? "Not needed for links" : "Click to select file"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">PDF, video, or any document</p>
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
                  <input value={url} onChange={e => setUrl(e.target.value)}
                    placeholder="Or paste a URL here" disabled={resourceType !== "link"}
                    className={[
                      "w-full h-10 pl-9 pr-3 rounded-xl border text-sm",
                      "text-foreground placeholder:text-muted-foreground/50",
                      "focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500/60 transition-all duration-150",
                      resourceType !== "link"
                        ? "border-border/20 bg-muted/10 opacity-40 cursor-not-allowed"
                        : "border-border/60 bg-card/80 hover:border-border",
                    ].join(" ")} />
                </div>
              </div>
            </GlassCard>

            {/* Submit */}
            <button type="button" onClick={handleSubmit} disabled={isUploading}
              className="w-full h-11 rounded-xl text-sm font-semibold text-white
                         flex items-center justify-center gap-2 outline-none
                         transition-all duration-200 active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                boxShadow: isUploading ? "none" : "0 4px 20px rgba(109,40,217,0.4)",
              }}
            >
              {isUploading
                ? <><Loader2 size={15} className="animate-spin" />{isEditMode ? "Updating…" : "Uploading…"}</>
                : <><Upload size={15} />{isEditMode ? "Update Resource" : "Upload Resource"}</>
              }
            </button>
          </div>
        </motion.div>
      )}

      {/* Resources list */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
          All Resources
        </p>
        <ResourcesList
          resources={resources}
          setResources={setResources}
          onEdit={canUpload ? setEditingResource : null}
        />
      </motion.div>
    </div>
  )
}
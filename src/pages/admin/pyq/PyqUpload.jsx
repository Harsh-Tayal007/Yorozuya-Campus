import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import {
  Upload, Loader2, Search, X, ChevronDown, Check,
  FileText, Image as ImageIcon, Video, Archive,
  Filter, BookOpen, GraduationCap, GitBranch, Layers,
} from "lucide-react"

import { databases } from "@/lib/appwrite"
import { Query, ID } from "appwrite"
import { useAuth } from "@/context/AuthContext"
import { ACTIVITIES_COLLECTION_ID } from "@/config/appwrite"
import { getSubjectsBySyllabusIds } from "@/services/syllabus/subjectService"
import { uploadFile as adapterUpload, deleteFile as adapterDelete } from "@/services/shared/storageAdapter"
import PyqList from "./PyqList"

const DATABASE_ID          = import.meta.env.VITE_APPWRITE_DATABASE_ID
const PROGRAMS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PROGRAMS_COLLECTION_ID
const SYLLABUS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SYLLABUS_COLLECTION_ID
const UNITS_COLLECTION_ID  = import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID
const PYQS_COLLECTION_ID   = import.meta.env.VITE_APPWRITE_PYQS_COLLECTION_ID
const MOCK_SEMESTERS       = [1,2,3,4,5,6,7,8]

const FILE_TYPES = [
  { value: "pdf",   label: "PDF",   icon: FileText,  accent: "#ef4444" },
  { value: "image", label: "Image", icon: ImageIcon, accent: "#06b6d4" },
  { value: "video", label: "Video", icon: Video,     accent: "#8b5cf6" },
  { value: "zip",   label: "ZIP",   icon: Archive,   accent: "#f59e0b" },
]

// ─────────────────────────────────────────────────────────────────────────────
// CustomSelect - portal-based, escapes all stacking contexts
// ─────────────────────────────────────────────────────────────────────────────
function CustomSelect({ value, onChange, options, placeholder, disabled }) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef          = useRef(null)
  const dropdownRef         = useRef(null)
  const selected            = options.find(o => String(o.value) === String(value))

  const calcCoords = () => {
    if (!triggerRef.current) return
    const r = triggerRef.current.getBoundingClientRect()
    setCoords({ top: r.bottom + window.scrollY + 6, left: r.left + window.scrollX, width: r.width })
  }

  const handleToggle = () => { if (disabled) return; if (!open) calcCoords(); setOpen(v => !v) }

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!triggerRef.current?.contains(e.target) && !dropdownRef.current?.contains(e.target))
        setOpen(false)
    }
    document.addEventListener("pointerdown", close)
    return () => document.removeEventListener("pointerdown", close)
  }, [open])

  useEffect(() => {
    if (!open) return
    const update = () => calcCoords()
    window.addEventListener("scroll", update, true)
    window.addEventListener("resize", update)
    return () => { window.removeEventListener("scroll", update, true); window.removeEventListener("resize", update) }
  }, [open])

  useEffect(() => () => setOpen(false), [])

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
          <div className="max-h-52 overflow-y-auto py-1">
            {options.length === 0
              ? <p className="px-4 py-3 text-sm text-muted-foreground">No options available</p>
              : options.map(opt => {
                  const isActive = String(opt.value) === String(value)
                  return (
                    <button key={opt.value} type="button"
                      onClick={() => { onChange(opt.value); setOpen(false) }}
                      className={[
                        "flex items-center justify-between w-full px-4 py-2.5 text-sm text-left gap-3",
                        "transition-colors duration-100",
                        isActive ? "bg-violet-500/10 text-violet-400 font-semibold" : "text-foreground hover:bg-muted/60",
                      ].join(" ")}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isActive && <Check size={13} className="text-violet-400 shrink-0" />}
                    </button>
                  )
                })
            }
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <div className="relative w-full">
      <button ref={triggerRef} type="button" onClick={handleToggle}
        className={[
          "w-full h-10 px-3.5 rounded-xl border text-sm text-left",
          "flex items-center justify-between gap-2 select-none outline-none transition-all duration-150",
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
        <ChevronDown size={14} className={["shrink-0 transition-transform duration-200",
          disabled ? "text-muted-foreground/30" : "text-muted-foreground", open ? "rotate-180" : ""].join(" ")} />
      </button>
      {typeof document !== "undefined" && createPortal(panel, document.body)}
    </div>
  )
}

// ── Filter pill select ────────────────────────────────────────────────────────
function FilterSelect({ value, onChange, options, placeholder, icon: Icon, disabled }) {
  const [open, setOpen]     = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })
  const triggerRef          = useRef(null)
  const dropdownRef         = useRef(null)
  const selected            = options.find(o => String(o.value) === String(value))

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

  const isActive = value && value !== "all"

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

function SectionLabel({ children }) {
  return <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{children}</p>
}

function GlassCard({ children, className = "" }) {
  return (
    <div className={`rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 ${className}`}>
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
const PyqUpload = () => {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()

  // Form state
  const [form, setForm] = useState({
    programId: "", semester: "", subjectId: "", unitId: "",
    title: "", description: "", fileType: "", file: null,
  })
  const [branch,       setBranch]       = useState("")
  const [syllabusList, setSyllabusList] = useState([])
  const [syllabusIds,  setSyllabusIds]  = useState([])
  const [subjects,     setSubjects]     = useState([])
  const [units,        setUnits]        = useState([])
  const [loadingUnits, setLoadingUnits] = useState(false)
  const [isUploading,  setIsUploading]  = useState(false)
  const [editingPyq,   setEditingPyq]   = useState(null)
  const [refreshKey,   setRefreshKey]   = useState(0)
  const fileInputRef = useRef(null)
  const isEditMode = Boolean(editingPyq)

  // Filter state
  const [pyqFilters, setPyqFilters] = useState({
    programId: "all", branch: "all", semester: "all", subjectId: "all", unitId: "all",
  })
  const [filterSyllabusList, setFilterSyllabusList] = useState([])
  const [filterSubjects,     setFilterSubjects]     = useState([])
  const [filterUnits,        setFilterUnits]        = useState([])
  const [searchTerm,         setSearchTerm]         = useState("")

  // ── React Query: programs (cached till reload) ────────────────────────────
  const { data: programs = [] } = useQuery({
    queryKey: ["programs-all"],
    queryFn: async () => {
      const res = await databases.listDocuments(DATABASE_ID, PROGRAMS_COLLECTION_ID, [Query.orderAsc("name")])
      return res.documents
    },
    staleTime: Infinity,
  })

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  const updatePyqFilter = (key, value) => setPyqFilters(prev => ({ ...prev, [key]: value }))

  const resetDependentPyqFilters = (keys) =>
    setPyqFilters(prev => { const u = { ...prev }; keys.forEach(k => (u[k] = "all")); return u })

  const uploadBranches = Array.from(new Set(syllabusList.map(s => s.branch).filter(Boolean)))
  const filterBranches = Array.from(new Set(filterSyllabusList.map(s => s.branch).filter(Boolean)))

  const isProgramSelected  = pyqFilters.programId !== "all"
  const isBranchSelected   = pyqFilters.branch    !== "all"
  const isSemesterSelected = pyqFilters.semester  !== "all"
  const isSubjectSelected  = pyqFilters.subjectId !== "all"

  const resetForm = () => {
    setEditingPyq(null); setBranch(""); setSyllabusList([]); setSyllabusIds([])
    setSubjects([]); setUnits([])
    setForm({ programId: "", semester: "", subjectId: "", unitId: "", title: "", description: "", fileType: "", file: null })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const validateForm = () => {
    if (!form.programId)     return "Program is required"
    if (!form.semester)      return "Semester is required"
    if (!form.subjectId)     return "Subject is required"
    if (!form.title.trim())  return "Title is required"
    if (!isEditMode && !form.file) return "File is required"
    return null
  }

  // ── All effects (identical logic to original) ─────────────────────────────
  useEffect(() => {
    if (!form.subjectId) return
    setLoadingUnits(true)
    databases.listDocuments(DATABASE_ID, UNITS_COLLECTION_ID, [
      Query.equal("subjectId", form.subjectId), Query.orderAsc("order"),
    ]).then(res => setUnits(res.documents)).catch(() => setUnits([])).finally(() => setLoadingUnits(false))
  }, [form.subjectId])

  useEffect(() => {
    if (!syllabusIds.length) { setSubjects([]); updateField("subjectId", ""); return }
    getSubjectsBySyllabusIds(syllabusIds).then(setSubjects).catch(console.error)
  }, [syllabusIds])

  useEffect(() => {
    if (!branch || !form.semester) { setSyllabusIds([]); return }
    const filtered = syllabusList.filter(s => s.branch === branch && Number(s.semester) === Number(form.semester))
    setSyllabusIds(filtered.map(s => s.$id))
  }, [branch, form.semester, syllabusList])

  useEffect(() => {
    if (!form.programId) { setSyllabusList([]); return }
    databases.listDocuments(DATABASE_ID, SYLLABUS_COLLECTION_ID, [Query.equal("programId", form.programId)])
      .then(res => setSyllabusList(res.documents)).catch(console.error)
  }, [form.programId])

  useEffect(() => {
    if (!pyqFilters.programId || pyqFilters.programId === "all") { setFilterSyllabusList([]); return }
    databases.listDocuments(DATABASE_ID, SYLLABUS_COLLECTION_ID, [Query.equal("programId", pyqFilters.programId)])
      .then(res => setFilterSyllabusList(res.documents)).catch(() => setFilterSyllabusList([]))
  }, [pyqFilters.programId])

  useEffect(() => {
    if (pyqFilters.programId === "all") { setFilterSubjects([]); return }
    let rel = filterSyllabusList
    if (pyqFilters.branch   !== "all") rel = rel.filter(s => s.branch === pyqFilters.branch)
    if (pyqFilters.semester !== "all") rel = rel.filter(s => Number(s.semester) === Number(pyqFilters.semester))
    const ids = rel.map(s => s.$id)
    if (!ids.length) { setFilterSubjects([]); return }
    getSubjectsBySyllabusIds(ids).then(setFilterSubjects).catch(() => setFilterSubjects([]))
  }, [pyqFilters.programId, pyqFilters.branch, pyqFilters.semester, filterSyllabusList])

  useEffect(() => {
    if (!pyqFilters.subjectId || pyqFilters.subjectId === "all") { setFilterUnits([]); return }
    databases.listDocuments(DATABASE_ID, UNITS_COLLECTION_ID, [Query.equal("subjectId", pyqFilters.subjectId)])
      .then(res => setFilterUnits(res.documents)).catch(() => setFilterUnits([]))
  }, [pyqFilters.subjectId])

  // Edit prefill
  useEffect(() => {
    if (!editingPyq) return
    setForm(prev => ({ ...prev, programId: editingPyq.programId, title: editingPyq.title,
      description: editingPyq.description || "", fileType: editingPyq.fileType, file: null }))
  }, [editingPyq])

  useEffect(() => {
    if (!editingPyq || !MOCK_SEMESTERS.length) return
    setForm(prev => ({ ...prev, semester: Number(editingPyq.semester) }))
  }, [editingPyq, form.programId])

  useEffect(() => {
    if (!editingPyq || !syllabusList.length) return
    setBranch(syllabusList.find(s => s.programId === editingPyq.programId && s.semester === Number(editingPyq.semester))?.branch || "")
  }, [syllabusList, editingPyq])

  useEffect(() => {
    if (!editingPyq || !subjects.length) return
    if (subjects.some(s => s.$id === editingPyq.subjectId))
      setForm(prev => ({ ...prev, subjectId: editingPyq.subjectId, unitId: editingPyq.unitId || "" }))
  }, [subjects, editingPyq])

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (isUploading) return
    const error = validateForm()
    if (error) { toast.error(error); return }
    setIsUploading(true)
    try {
      let fileId  = editingPyq?.fileId   || null
      let bucketId = editingPyq?.bucketId || ""
      let storageProvider = editingPyq?.storageProvider || "appwrite"

      if (form.file) {
        const renamedFile = new File([form.file], `pyq_${Date.now()}_${form.file.name}`, { type: form.file.type })
        const uploadResult = await adapterUpload(renamedFile, "pyq")

        // Delete old file if editing (using old storageProvider)
        if (editingPyq?.fileId) {
          try {
            await adapterDelete(editingPyq.fileId, editingPyq.storageProvider, "pyq", editingPyq.bucketId)
          } catch { /* ignore */ }
        }

        fileId = uploadResult.fileId
        bucketId = uploadResult.bucketId || ""
        storageProvider = uploadResult.storageProvider
      }

      let pyqId
      const docData = {
        title: form.title, description: form.description || null,
        programId: form.programId, semester: String(form.semester),
        subjectId: form.subjectId, unitId: form.unitId || null,
        fileId, bucketId, storageProvider, fileType: form.fileType,
      }

      if (isEditMode) {
        pyqId = editingPyq.$id
        await databases.updateDocument(DATABASE_ID, PYQS_COLLECTION_ID, pyqId, docData)
      } else {
        pyqId = ID.unique()
        await databases.createDocument(DATABASE_ID, PYQS_COLLECTION_ID, pyqId,
          { ...docData, year: new Date().getFullYear() })
      }

      await databases.createDocument(DATABASE_ID, ACTIVITIES_COLLECTION_ID, ID.unique(), {
        actorId: currentUser.$id, actorName: currentUser.username || currentUser.name || "Admin",
        action: isEditMode ? "updated PYQ" : "uploaded PYQ", entityType: "PYQ",
        entityId: pyqId, entityName: form.title,
      })

      setRefreshKey(k => k + 1)
      resetForm()
      toast.success(isEditMode ? "PYQ updated" : "PYQ uploaded")
      window.scrollTo({ top: 0, behavior: "smooth" })
    } catch (err) {
      console.error(err); toast.error("Something went wrong while saving PYQ")
    } finally { setIsUploading(false) }
  }

  const selectedFileType = FILE_TYPES.find(t => t.value === form.fileType)

  return (
    <div className="space-y-8 max-w-7xl mx-auto">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center gap-3 flex-wrap">
        <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
          <FileText size={18} className="text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight">{isEditMode ? "Edit PYQ" : "Upload PYQ"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEditMode ? `Editing: ${editingPyq?.title}` : "Add previous year question papers"}
          </p>
        </div>
        {isEditMode && (
          <button onClick={resetForm}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground
                       transition-colors px-3 py-1.5 rounded-xl border border-border/60 hover:border-border bg-card/50 shrink-0">
            <X size={12} /> Cancel edit
          </button>
        )}
      </motion.div>

      {/* Upload form */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Academic Scope */}
        <div className="lg:col-span-2">
          <GlassCard>
            <SectionLabel>Academic Scope</SectionLabel>
            <div className="space-y-2.5">
              <CustomSelect value={form.programId}
                onChange={v => { updateField("programId", v); updateField("semester", ""); updateField("subjectId", ""); updateField("unitId", ""); setBranch("") }}
                placeholder="Select Program"
                options={programs.map(p => ({ value: p.$id, label: p.name }))} />
              <CustomSelect value={branch}
                onChange={v => { setBranch(v); updateField("subjectId", ""); updateField("unitId", "") }}
                placeholder="Select Branch" disabled={!uploadBranches.length}
                options={uploadBranches.map(b => ({ value: b, label: b }))} />
              <CustomSelect value={String(form.semester || "")}
                onChange={v => { updateField("semester", v); updateField("subjectId", ""); updateField("unitId", "") }}
                placeholder="Select Semester" disabled={!form.programId}
                options={MOCK_SEMESTERS.map(s => ({ value: String(s), label: `Semester ${s}` }))} />
              <CustomSelect value={form.subjectId}
                onChange={v => { updateField("subjectId", v); updateField("unitId", "") }}
                placeholder="Select Subject" disabled={!form.programId || !form.semester || !subjects.length}
                options={subjects.map(s => ({ value: s.$id, label: s.subjectName }))} />
              <CustomSelect value={form.unitId}
                onChange={v => updateField("unitId", v)}
                placeholder={loadingUnits ? "Loading units…" : units.length === 0 ? "No units (optional)" : "Select Unit (optional)"}
                disabled={!form.subjectId || units.length === 0}
                options={units.map(u => ({ value: u.$id, label: u.title }))} />
            </div>
          </GlassCard>
        </div>

        {/* Details + file */}
        <div className="lg:col-span-3 space-y-4">

          {/* File type pills */}
          <GlassCard>
            <SectionLabel>File Type</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FILE_TYPES.map(type => {
                const Icon = type.icon
                const isSel = form.fileType === type.value
                return (
                  <button key={type.value} type="button" onClick={() => updateField("fileType", type.value)}
                    className="relative flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border
                               text-xs font-medium outline-none transition-all duration-200 active:scale-95"
                    style={isSel ? { background: `${type.accent}18`, borderColor: `${type.accent}50`, color: type.accent }
                      : { borderColor: "hsl(var(--border) / 0.6)", color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted) / 0.2)" }}
                  >
                    {isSel && <span className="absolute top-1.5 right-1.5"><Check size={9} style={{ color: type.accent }} /></span>}
                    <Icon size={16} />
                    {type.label}
                  </button>
                )
              })}
            </div>
          </GlassCard>

          {/* Title & description */}
          <GlassCard>
            <SectionLabel>Details</SectionLabel>
            <div className="space-y-3">
              <input value={form.title} onChange={e => updateField("title", e.target.value)}
                placeholder="PYQ title *"
                className="w-full h-10 px-3.5 rounded-xl text-sm border border-border/60 bg-card/80
                           text-foreground placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500/60
                           hover:border-border transition-all duration-150" />
              <textarea value={form.description} onChange={e => updateField("description", e.target.value)}
                placeholder="Description (optional)" rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm border border-border/60 bg-card/80
                           text-foreground placeholder:text-muted-foreground/50
                           focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500/60
                           hover:border-border transition-all duration-150 resize-none" />
            </div>
          </GlassCard>

          {/* File upload */}
          <GlassCard>
            <SectionLabel>Upload File</SectionLabel>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={[
                "flex flex-col items-center justify-center gap-2.5 rounded-xl",
                "border-2 border-dashed py-7 px-4 text-center transition-all duration-200 cursor-pointer",
                form.file
                  ? "border-emerald-500/40 bg-emerald-500/5"
                  : "border-border/40 hover:border-violet-500/40 hover:bg-violet-500/5",
              ].join(" ")}
            >
              <input type="file" ref={fileInputRef}
                onChange={e => updateField("file", e.target.files?.[0] || null)} className="hidden" />
              {form.file ? (
                <>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check size={16} className="text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-emerald-500 truncate max-w-[220px]">{form.file.name}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{(form.file.size/1024/1024).toFixed(2)} MB</p>
                  </div>
                  <button type="button"
                    onClick={e => { e.stopPropagation(); updateField("file", null); if (fileInputRef.current) fileInputRef.current.value = "" }}
                    className="text-[11px] text-muted-foreground hover:text-destructive border border-border/50
                               hover:border-destructive/30 px-2.5 py-1 rounded-lg transition-colors">
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <div className="w-9 h-9 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-center">
                    <Upload size={16} className="text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Click to select file</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PDF, image, video, or ZIP</p>
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          {/* Submit */}
          <button type="button" onClick={handleUpload} disabled={isUploading}
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
              : <><Upload size={15} />{isEditMode ? "Update PYQ" : "Upload PYQ"}</>
            }
          </button>
        </div>
      </motion.div>

      {/* Search + Filters */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Browse PYQs</p>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search PYQs…"
              className="w-full h-9 pl-8 pr-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm
                         text-xs text-foreground placeholder:text-muted-foreground/50
                         focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary
                         hover:border-border transition-all duration-150" />
            {searchTerm && (
              <button onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={12} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Filter size={11} /><span className="hidden sm:block">Filter:</span>
          </div>

          <FilterSelect value={pyqFilters.programId}
            onChange={v => { updatePyqFilter("programId", v); resetDependentPyqFilters(["branch","semester","subjectId","unitId"]) }}
            placeholder="Program" icon={GraduationCap}
            options={[{ value: "all", label: "All Programs" }, ...programs.map(p => ({ value: p.$id, label: p.name }))]} />

          <FilterSelect value={pyqFilters.branch}
            onChange={v => { updatePyqFilter("branch", v); resetDependentPyqFilters(["semester","subjectId","unitId"]) }}
            placeholder="Branch" icon={GitBranch} disabled={!isProgramSelected}
            options={[{ value: "all", label: "All Branches" }, ...filterBranches.map(b => ({ value: b, label: b }))]} />

          <FilterSelect value={pyqFilters.semester}
            onChange={v => { updatePyqFilter("semester", v); resetDependentPyqFilters(["subjectId","unitId"]) }}
            placeholder="Semester" icon={BookOpen} disabled={!isProgramSelected}
            options={[{ value: "all", label: "All Semesters" }, ...MOCK_SEMESTERS.map(s => ({ value: String(s), label: `Sem ${s}` }))]} />

          <FilterSelect value={pyqFilters.subjectId}
            onChange={v => { updatePyqFilter("subjectId", v); resetDependentPyqFilters(["unitId"]) }}
            placeholder="Subject" icon={Layers}
            disabled={!isProgramSelected || (!isBranchSelected && !isSemesterSelected)}
            options={[{ value: "all", label: "All Subjects" }, ...filterSubjects.map(s => ({ value: s.$id, label: s.subjectName }))]} />

          <FilterSelect value={pyqFilters.unitId}
            onChange={v => updatePyqFilter("unitId", v)}
            placeholder="Unit" icon={Layers} disabled={!isSubjectSelected}
            options={[{ value: "all", label: "All Units" }, ...filterUnits.map(u => ({ value: u.$id, label: u.title }))]} />

          {(searchTerm || Object.values(pyqFilters).some(v => v !== "all")) && (
            <button onClick={() => { setSearchTerm(""); setPyqFilters({ programId: "all", branch: "all", semester: "all", subjectId: "all", unitId: "all" }) }}
              className="h-9 px-3 rounded-xl text-xs font-medium text-muted-foreground
                         border border-border/60 hover:border-border hover:text-foreground
                         bg-card/60 transition-all duration-150 flex items-center gap-1">
              <X size={11} /> Clear
            </button>
          )}
        </div>
      </motion.div>

      {/* PYQ List */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Recent PYQs</p>
        <PyqList
          limit={5}
          refreshKey={refreshKey}
          filters={pyqFilters}
          searchTerm={searchTerm}
          showViewMore
          onEdit={(pyq) => { setEditingPyq(pyq); window.scrollTo({ top: 0, behavior: "smooth" }) }}
        />
      </motion.div>
    </div>
  )
}

export default PyqUpload
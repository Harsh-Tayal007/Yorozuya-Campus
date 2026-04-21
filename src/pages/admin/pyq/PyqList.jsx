import { useQuery, useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import {
  FileText, Link as LinkIcon, Image as ImageIcon,
  Video, Archive, ExternalLink, Pencil, Trash2,
  BookOpen, GraduationCap, GitBranch, Layers, Calendar,
  ArrowRight,
} from "lucide-react"
import { 
  getFileViewUrl, 
  deleteFile as adapterDelete,
  getFileMetadata 
} from "@/services/shared/storageAdapter"
import { formatFileSize } from "@/utils/formatFileSize"

import {
  DATABASE_ID, PYQS_COLLECTION_ID,
  SYLLABUS_COLLECTION_ID, UNITS_COLLECTION_ID, PROGRAMS_COLLECTION_ID,
} from "@/config/appwrite"
import { getSubjectsByIds } from "@/services/syllabus/subjectService"

// ── File type config ──────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  pdf:   { icon: FileText,  accent: "#ef4444", label: "PDF"   },
  image: { icon: ImageIcon, accent: "#06b6d4", label: "Image" },
  video: { icon: Video,     accent: "#8b5cf6", label: "Video" },
  zip:   { icon: Archive,   accent: "#f59e0b", label: "ZIP"   },
  link:  { icon: LinkIcon,  accent: "#10b981", label: "Link"  },
}

function highlightText(text, query) {
  if (!query || !text) return text
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  return String(text).split(regex).map((part, i) =>
    part.toLowerCase() === query.toLowerCase()
      ? <mark key={i} className="bg-primary/20 text-primary rounded px-0.5 not-italic">{part}</mark>
      : part
  )
}

// ── Build a stable query key from filters ─────────────────────────────────────
function buildQueryKey(limit, refreshKey, filters, searchTerm) {
  return [
    "pyqs",
    limit,
    refreshKey,
    filters.programId  ?? "all",
    filters.semester   ?? "all",
    filters.subjectId  ?? "all",
    filters.unitId     ?? "all",
    (filters.subjectIds ?? []).join(","),
    searchTerm,
  ]
}

// ── Fetch everything needed for the list ─────────────────────────────────────
async function fetchPyqsWithMeta({ limit, filters, searchTerm }) {
  const queries = [Query.orderDesc("$createdAt"), Query.limit(limit)]

  if (filters.programId  && filters.programId  !== "all") queries.push(Query.equal("programId",  filters.programId))
  if (filters.semester   && filters.semester   !== "all") queries.push(Query.equal("semester",   String(filters.semester)))
  if (filters.subjectId  && filters.subjectId  !== "all") queries.push(Query.equal("subjectId",  filters.subjectId))
  else if (filters.subjectIds?.length)                    queries.push(Query.equal("subjectId",  filters.subjectIds))
  if (filters.unitId     && filters.unitId     !== "all") queries.push(Query.equal("unitId",     filters.unitId))

  const res  = await databases.listDocuments(DATABASE_ID, PYQS_COLLECTION_ID, queries)
  let docs   = res.documents

  if (searchTerm?.trim()) {
    const q = searchTerm.toLowerCase()
    docs = docs.filter(p => p.title?.toLowerCase().includes(q))
  }

  // ── Build lookup maps in parallel ─────────────────────────────────────────
  const subjectIds  = [...new Set(res.documents.map(p => p.subjectId).filter(Boolean))]
  const programIds  = [...new Set(res.documents.map(p => p.programId).filter(Boolean))]

  const [subjects, programRes] = await Promise.all([
    subjectIds.length ? getSubjectsByIds(subjectIds) : Promise.resolve([]),
    programIds.length
      ? databases.listDocuments(DATABASE_ID, PROGRAMS_COLLECTION_ID, [Query.equal("$id", programIds)])
      : Promise.resolve({ documents: [] }),
  ])

  const subjectMap = {}; subjects.forEach(s => { subjectMap[s.$id] = s })
  const programMap = {}; programRes.documents.forEach(p => { programMap[p.$id] = p })

  const unitIds      = [...new Set(res.documents.map(p => p.unitId).filter(Boolean))]
  const syllabusIds  = [...new Set(subjects.map(s => s.syllabusId).filter(Boolean))]

  const [unitRes, syllabusRes] = await Promise.all([
    unitIds.length
      ? databases.listDocuments(DATABASE_ID, UNITS_COLLECTION_ID, [Query.equal("$id", unitIds)])
      : Promise.resolve({ documents: [] }),
    syllabusIds.length
      ? databases.listDocuments(DATABASE_ID, SYLLABUS_COLLECTION_ID, [Query.equal("$id", syllabusIds)])
      : Promise.resolve({ documents: [] }),
  ])

  const unitMap     = {}; unitRes.documents.forEach(u => { unitMap[u.$id] = u })
  const syllabusMap = {}; syllabusRes.documents.forEach(s => { syllabusMap[s.$id] = s })

  // ── Enrich with file sizes ────────────────────────────────────────────────
  const enrichedDocs = await Promise.all(docs.map(async (doc) => {
    if (!doc.fileId || (doc.storageProvider !== "cloudflare" && !doc.bucketId)) {
      return doc
    }
    try {
      const meta = await getFileMetadata(doc.fileId, doc.storageProvider, "pyq", doc.bucketId)
      return { ...doc, fileSize: meta.size }
    } catch {
      return doc
    }
  }))

  return { docs: enrichedDocs, subjectMap, programMap, unitMap, syllabusMap }
}

// ── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card/40 p-4 animate-pulse">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-muted/50 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted/50 rounded w-3/4" />
              <div className="h-3 bg-muted/30 rounded w-1/4" />
              <div className="flex gap-4 mt-2">
                <div className="h-3 bg-muted/30 rounded w-20" />
                <div className="h-3 bg-muted/30 rounded w-16" />
                <div className="h-3 bg-muted/30 rounded w-24" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── PYQ Card ──────────────────────────────────────────────────────────────────
function PyqCard({ pyq, programMap, subjectMap, syllabusMap, unitMap, onEdit, onDelete, searchTerm }) {
  const typeConfig = TYPE_CONFIG[pyq.fileType] ?? TYPE_CONFIG.pdf
  const Icon       = typeConfig.icon
  const program    = programMap?.[pyq.programId]?.name
  const subject    = subjectMap?.[pyq.subjectId]?.subjectName
  const branch     = syllabusMap?.[subjectMap?.[pyq.subjectId]?.syllabusId]?.branch
  const unit       = unitMap?.[pyq.unitId]?.title

  const handleView = () => {
    const url = getFileViewUrl(pyq.fileId, pyq.storageProvider, "pyq", pyq.bucketId)
    window.open(url, "_blank")
  }

  return (
    <motion.div layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm
                 hover:border-border hover:bg-card/80 transition-all duration-200 overflow-hidden"
    >
      {/* Accent top line */}
      <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, transparent, ${typeConfig.accent}, transparent)` }} />

      <div className="p-4 flex items-start gap-4">
        {/* Icon */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5
                        transition-transform duration-200 group-hover:scale-105"
          style={{ background: `${typeConfig.accent}15`, border: `1px solid ${typeConfig.accent}30` }}>
          <Icon size={17} style={{ color: typeConfig.accent }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground leading-snug">
                {highlightText(pyq.title, searchTerm)}
              </h3>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px] font-bold uppercase tracking-wide"
                  style={{ background: `${typeConfig.accent}15`, color: typeConfig.accent }}>
                  {typeConfig.label}
                </span>
                {pyq.year && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px]
                                   font-semibold bg-muted/60 text-muted-foreground">
                    <Calendar size={9} />{pyq.year}
                  </span>
                )}
                {pyq.fileSize > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-px rounded text-[10px]
                                   font-semibold bg-muted/60 text-muted-foreground/80">
                    {formatFileSize(pyq.fileSize)}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={handleView}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium
                           border border-border/60 bg-muted/30 text-muted-foreground
                           hover:border-border hover:text-foreground hover:bg-muted/60
                           transition-all duration-150 active:scale-95">
                <ExternalLink size={11} /> View
              </button>
              {onEdit && (
                <button onClick={() => onEdit(pyq)}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium
                             border border-border/60 bg-muted/30 text-muted-foreground
                             hover:border-primary/40 hover:text-primary hover:bg-primary/5
                             transition-all duration-150 active:scale-95">
                  <Pencil size={11} /> Edit
                </button>
              )}
              <button onClick={() => onDelete(pyq)}
                className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium
                           border border-border/60 bg-muted/30 text-muted-foreground
                           hover:border-destructive/40 hover:text-destructive hover:bg-destructive/5
                           transition-all duration-150 active:scale-95">
                <Trash2 size={11} /> Delete
              </button>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
            {program && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><GraduationCap size={10} className="shrink-0" />{program}</span>}
            {pyq.semester && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><BookOpen size={10} className="shrink-0" />Sem {pyq.semester}</span>}
            {branch  && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><GitBranch size={10} className="shrink-0" />{branch}</span>}
            {subject && <span className="flex items-center gap-1 text-[11px] text-muted-foreground"><Layers size={10} className="shrink-0" />{subject}</span>}
            {unit    && <span className="text-[11px] text-muted-foreground/60">· {unit}</span>}
          </div>

          {pyq.description && (
            <p className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2">{pyq.description}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PyqList({
  limit = 6,
  refreshKey = 0,
  filters = {},
  searchTerm = "",
  showViewMore = false,
  onEdit,
}) {
  const navigate     = useNavigate()
  const queryClient  = useQueryClient()
  const queryKey     = buildQueryKey(limit, refreshKey, filters, searchTerm)

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchPyqsWithMeta({ limit, filters, searchTerm }),
    staleTime: 1000 * 60 * 5,   // cached 5 min - no refetch on page switch
    retry: false,
  })

  const { docs = [], subjectMap = {}, programMap = {}, unitMap = {}, syllabusMap = {} } = data ?? {}

  const handleDelete = (pyq) => {
    toast(`Delete "${pyq.title}"?`, {
      action: {
        label: "Delete",
        onClick: async () => {
          const id = toast.loading("Deleting…")
          try {
            await databases.deleteDocument(DATABASE_ID, PYQS_COLLECTION_ID, pyq.$id)
            if (pyq.fileId) {
              await adapterDelete(pyq.fileId, pyq.storageProvider, "pyq", pyq.bucketId)
            }
            // Invalidate so list refreshes after delete
            queryClient.invalidateQueries({ queryKey: ["pyqs"] })
            toast.success("PYQ deleted", { id })
          } catch (err) {
            console.error("Delete failed", err)
            toast.error("Failed to delete PYQ", { id })
          }
        },
      },
      cancel: { label: "Cancel", onClick: () => {} },
    })
  }

  if (isLoading) return <Skeleton />

  if (!docs.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3
                      rounded-2xl border border-dashed border-border/50">
        <div className="w-10 h-10 rounded-xl bg-muted/40 flex items-center justify-center">
          <FileText size={18} className="text-muted-foreground/40" />
        </div>
        <p className="text-sm text-muted-foreground">No PYQs found</p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <AnimatePresence mode="popLayout">
        {docs.map(pyq => (
          <PyqCard
            key={pyq.$id}
            pyq={pyq}
            programMap={programMap}
            subjectMap={subjectMap}
            syllabusMap={syllabusMap}
            unitMap={unitMap}
            onEdit={onEdit}
            onDelete={handleDelete}
            searchTerm={searchTerm}
          />
        ))}
      </AnimatePresence>

      {showViewMore && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-1 flex justify-center">
          <button
            onClick={() => navigate("/admin/pyqs")}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground
                       hover:text-foreground transition-colors duration-150 group px-4 py-2
                       rounded-xl border border-border/50 hover:border-border bg-card/40"
          >
            View all PYQs
            <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-150" />
          </button>
        </motion.div>
      )}
    </div>
  )
}
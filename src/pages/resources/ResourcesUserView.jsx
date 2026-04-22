// src/pages/resources/ResourcesUserView.jsx
import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Library, Download, ExternalLink, ArrowUpRight, Layers, BookOpen } from "lucide-react"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

import { getPdfViewUrl, getPdfDownloadUrl } from "@/services/shared/storageService"
import { getAvailableResourceSemesters } from "@/services/resource/resourceAvailabilityService"
import { getResolvedResourcesForSubject } from "@/services/resource/resourceUserResolver"
import { getProgramById } from "@/services/university/programService"
import { Breadcrumbs } from "@/components"
import { BackButton } from "@/components"
import PdfPreviewModal from "@/components/common/display/PdfPreviewModal"
import { STORAGE_BUCKET_ID } from "@/config/appwrite"
import { buildResourceFilename } from "@/utils/filenameUtils"
import { downloadFileXHR } from "@/services/shared/downloadService"
import { isMobileDevice } from "@/utils/isMobileDevice"
import { formatFileSize } from "@/utils/formatFileSize"
import GlowCard from "@/components/common/display/GlowCard"
import { FileTypeBadge } from "@/components"
import ShareButton from "@/components/common/navigation/ShareButton"
import { useShareLink } from "@/hooks/useShareLink"

const DATABASE_ID         = import.meta.env.VITE_APPWRITE_DATABASE_ID
const SYLLABUS_COLLECTION = import.meta.env.VITE_APPWRITE_SYLLABUS_COLLECTION_ID
const SUBJECTS_COLLECTION = import.meta.env.VITE_APPWRITE_SUBJECTS_COLLECTION_ID
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID

async function getSubjectsBySemesterContext({ programId, branch, semester }) {
  const syllabusRes = await databases.listDocuments(DATABASE_ID, SYLLABUS_COLLECTION, [
    Query.equal("programId", programId),
    Query.equal("branch", branch),
    Query.equal("semester", Number(semester)),
  ])
  const ids = syllabusRes.documents.map(d => d.$id)
  if (!ids.length) return []
  const res = await databases.listDocuments(DATABASE_ID, SUBJECTS_COLLECTION, [
    Query.equal("syllabusId", ids), Query.orderAsc("subjectName"),
  ])
  return res.documents
}

function Skeleton({ count = 4 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-16 animate-pulse" />
      ))}
    </div>
  )
}

export default function ResourcesUserView({
  programId: propProgramId,
  branchName: propBranchName,
  isDashboard,
}) {
  const params     = useParams()
  const navigate   = useNavigate()
  const programId  = propProgramId  ?? params.programId
  const branchName = propBranchName ?? params.branchName
  const semester   = params.semester
  const subjectId  = params.subjectId
  const unitId     = params.unitId
  const decodedBranch = branchName ? decodeURIComponent(branchName) : null

  const [previewResource, setPreviewResource] = useState(null)
  const [downloadingId,   setDownloadingId]   = useState(null)
  const [progress,        setProgress]        = useState(null)
  const [activeDownload,  setActiveDownload]  = useState(null)

  const programBase       = `/programs/${programId}/branches/${branchName}`
  const dashboardBase     = "/dashboard/resources"
  const baseResourcesPath = isDashboard ? dashboardBase : `${programBase}/resources`

  const canFetch = !!programId && programId !== "undefined"
               && !!decodedBranch && decodedBranch !== "undefined"

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn:  () => getProgramById(programId),
    enabled:  canFetch,
    staleTime: 1000 * 60 * 10,
  })

  const { data: availableSemesters = [], isLoading: loadingSemesters } = useQuery({
    queryKey: ["resourceSemesters", programId, decodedBranch],
    queryFn:  () => getAvailableResourceSemesters({ programId, branch: decodedBranch }),
    enabled:  canFetch && !semester && !subjectId,
    staleTime: 1000 * 60 * 5,
  })

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery({
    queryKey: ["subjects", programId, decodedBranch, semester],
    queryFn:  () => getSubjectsBySemesterContext({ programId, branch: decodedBranch, semester }),
    enabled:  canFetch && !!semester && !subjectId,
    staleTime: 1000 * 60 * 5,
  })

  const { data: resources = [], isLoading: loadingResources } = useQuery({
    queryKey: ["resources", programId, semester, subjectId],
    queryFn:  () => getResolvedResourcesForSubject({ programId, semester, subjectId }),
    enabled:  canFetch && !!semester && !!subjectId,
    staleTime: 1000 * 60 * 5,
  })

  const { data: currentSubject } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn:  () => databases.getDocument(DATABASE_ID, SUBJECTS_COLLECTION, subjectId),
    enabled:  !!subjectId, staleTime: 1000 * 60 * 30,
  })

  const { data: currentUnit } = useQuery({
    queryKey: ["unit", unitId],
    queryFn:  () => databases.getDocument(DATABASE_ID, UNITS_COLLECTION_ID, unitId),
    enabled:  !!unitId, staleTime: 1000 * 60 * 30,
  })

  const getSharePath = useShareLink({ programId, branchName: decodedBranch })

  // Build the share path for the current view level
  const sharePath = (() => {
    if (subjectId && semester) return getSharePath(`resources/semester/${semester}/subject/${subjectId}`)
    if (semester)              return getSharePath(`resources/semester/${semester}`)
    return                            getSharePath("resources")
  })()

  if (!canFetch) return null

  const wrapClass = isDashboard
    ? "space-y-5"
    : "max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6"

  return (
    <div className={wrapClass}>

      {/* ── Back navigation ── */}
      {isDashboard && !semester && (
        <BackButton to="/dashboard" label="Overview" />
      )}
      {isDashboard && semester && !subjectId && (
        <BackButton to={dashboardBase} label="Resources" />
      )}
      {isDashboard && semester && subjectId && (
        <BackButton to={`${dashboardBase}/semester/${semester}`} label={`Semester ${semester}`} />
      )}
      {!isDashboard && !semester && (
        <BackButton to={`/programs/${programId}/branches/${branchName}`} label={decodedBranch} />
      )}
      {!isDashboard && semester && !subjectId && (
        <>
          <BackButton to={`${programBase}/resources`} label="Resources" />
          <Breadcrumbs overrides={{
            ...(program?.name && { [programId]: program.name }),
          }} />
        </>
      )}
      {!isDashboard && semester && subjectId && (
        <>
          <BackButton to={`${programBase}/resources/semester/${semester}`} label={`Semester ${semester}`} />
          <Breadcrumbs overrides={{
            ...(program?.name && { [programId]: program.name }),
            ...(currentSubject?.subjectName && { [subjectId]: currentSubject.subjectName }),
            ...(currentUnit?.title && { [unitId]: `Unit ${currentUnit.order}` }),
          }} />
        </>
      )}

      {/* ── Page header ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <Library size={18} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Resources</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{decodedBranch}</p>
          </div>
        </div>

        <ShareButton path={sharePath} />
      </motion.div>

      {/* ── Semester grid ── */}
      {!semester && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
          {loadingSemesters ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-20 animate-pulse" />)}
            </div>
          ) : availableSemesters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
              <p className="text-sm text-muted-foreground">No resources available yet</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {availableSemesters.map(sem => (
                <GlowCard key={sem} onClick={() => navigate(`${baseResourcesPath}/semester/${sem}`)} disableGlare={true} className="p-5 cursor-target">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <BookOpen size={14} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-amber-400 transition-colors">Semester {sem}</p>
                        <p className="text-[11px] text-muted-foreground">View resources</p>
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                </GlowCard>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Subjects grid ── */}
      {semester && !subjectId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
          {loadingSubjects ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-20 animate-pulse" />)}
            </div>
          ) : subjects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
              <p className="text-sm text-muted-foreground">No subjects for this semester yet</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map(subject => (
                <GlowCard key={subject.$id}
                  onClick={() => navigate(`${baseResourcesPath}/semester/${semester}/subject/${subject.$id}`)}
                  disableGlare={true}
                  className="p-5 cursor-target">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Layers size={13} className="text-amber-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-amber-400 transition-colors truncate">{subject.subjectName}</p>
                        {subject.description && <p className="text-[11px] text-muted-foreground truncate">{subject.description}</p>}
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-muted-foreground/40 group-hover:text-amber-400 transition-all shrink-0" />
                  </div>
                </GlowCard>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── Resources list ── */}
      {subjectId && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
          {loadingResources ? <Skeleton count={4} /> : resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
              <p className="text-sm text-muted-foreground">No resources uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {resources.map(resource => (
                <GlowCard key={resource.$id}
                  disableGlare={true}
                  spotlightColor="rgba(245, 158, 11, 0.08)"
                  className="overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                    style={{ background: "linear-gradient(90deg, transparent, #f59e0b, transparent)" }} />
                  <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileTypeBadge fileType={resource.type} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{resource.title}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {resource.unit && (
                            <span className="text-[10px] font-medium px-1.5 py-px rounded bg-muted/60 text-muted-foreground">
                              Unit {resource.unit.order}: {resource.unit.title}
                            </span>
                          )}
                          {resource.fileSize > 0 && (
                            <span className="hidden sm:inline-block text-[11px] text-muted-foreground/60">
                              {formatFileSize(resource.fileSize)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => {
                        if (resource.type === "link" && resource.url) { window.open(resource.url, "_blank"); return }
                        const viewUrl = getPdfViewUrl(resource.fileId, resource.storageProvider, "resource", resource.bucketId)
                        if (isMobileDevice()) { window.open(viewUrl, "_blank"); return }
                        setPreviewResource(resource)
                      }}
                        className="flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium
                                   border border-border/60 bg-muted/30 text-muted-foreground
                                   hover:border-border hover:text-foreground hover:bg-muted/60 transition-all active:scale-95 cursor-target">
                        <ExternalLink size={11} /> View
                      </button>
                      {resource.type === "pdf" && (
                        <div className="relative">
                          <button
                            onClick={() => {
                              if (downloadingId === resource.$id) return
                              setDownloadingId(resource.$id); setProgress(0)
                              const ctrl = downloadFileXHR({
                                url: getPdfDownloadUrl(resource.fileId, resource.storageProvider, "resource", resource.bucketId),
                                fileName: buildResourceFilename(resource),
                                onProgress: (d) => setProgress(typeof d === "number" ? d : Math.min(Math.round((d.loaded / resource.fileSize) * 100), 99)),
                                onSuccess: () => { setProgress(null); setDownloadingId(null); setActiveDownload(null) },
                                onCancel:  () => { setProgress(null); setDownloadingId(null); setActiveDownload(null) },
                                onError:   () => { setProgress(null); setDownloadingId(null); setActiveDownload(null) },
                              })
                              setActiveDownload(ctrl)
                            }}
                            className="relative h-8 px-3 rounded-xl text-xs font-medium text-white overflow-hidden
                                       flex items-center gap-1 transition-all active:scale-95 cursor-target"
                            style={{ background: "linear-gradient(135deg, #d97706, #b45309)" }}
                          >
                            {downloadingId === resource.$id && (
                              <span className="absolute inset-y-0 left-0 bg-amber-900/40 transition-[width]" style={{ width: `${progress}%` }} />
                            )}
                            <span className="relative z-10 flex items-center gap-1">
                              <Download size={11} />
                              {downloadingId === resource.$id ? `${progress ?? 0}%` : "Download"}
                            </span>
                          </button>
                          {downloadingId === resource.$id && (
                            <button onClick={() => activeDownload?.cancel()}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 text-xs text-white/70 hover:text-white">✕</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </GlowCard>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {!isMobileDevice() && (
        <PdfPreviewModal 
          open={!!previewResource} 
          fileId={previewResource?.fileId}
          bucketId={previewResource?.bucketId || STORAGE_BUCKET_ID} 
          storageProvider={previewResource?.storageProvider}
          type="resource"
          title={previewResource?.title}
          onClose={() => setPreviewResource(null)} 
        />
      )}
    </div>
  )
}
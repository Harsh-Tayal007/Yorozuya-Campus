// src/pages/admin/syllabus/SyllabusUserView.jsx
import { useState } from "react"
import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { ClipboardList, Download, ExternalLink } from "lucide-react"

import { getPdfViewUrl, getPdfDownloadUrl } from "@/services/shared/storageService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { getFileMetadata, getFileViewUrl } from "@/services/shared/storageAdapter"
import { Breadcrumbs } from "@/components"
import { BackButton } from "@/components"
import { PdfPreviewModal } from "@/components"
import GlowCard from "@/components/common/display/GlowCard"
import { STORAGE_BUCKET_ID, SUBJECTS_COLLECTION_ID, SYLLABUS_COLLECTION_ID } from "@/config/appwrite"
import { buildSyllabusFilename } from "@/utils/filenameUtils"
import { downloadFileXHR } from "@/services/shared/downloadService"
import { formatFileSize } from "@/utils/formatFileSize"
import { getProgramById } from "@/services/university/programService"
import { FileTypeBadge } from "@/components"
import ShareButton from "@/components/common/navigation/ShareButton"
import { useShareLink } from "@/hooks/useShareLink"

const DATABASE_ID        = import.meta.env.VITE_APPWRITE_DATABASE_ID
const SYLLABUS_BUCKET_ID = STORAGE_BUCKET_ID

async function getSubjectsBySemesterContext({ programId, branch, semester }) {
  const syllabusRes = await databases.listDocuments(DATABASE_ID, SYLLABUS_COLLECTION_ID, [
    Query.equal("programId", programId),
    Query.equal("branch", branch),
    Query.equal("semester", Number(semester)),
  ])
  const ids = syllabusRes.documents.map(d => d.$id)
  if (!ids.length) return []
  const subjectsRes = await databases.listDocuments(DATABASE_ID, SUBJECTS_COLLECTION_ID, [
    Query.equal("syllabusId", ids),
    Query.orderAsc("subjectName"),
  ])
  return subjectsRes.documents
}

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

export default function SyllabusUserView({
  programId: propProgramId,
  branchName: propBranchName,
  semester: propSemester,
  isDashboard,
}) {
  const params     = useParams()
  const programId  = propProgramId  ?? params.programId
  const branchName = propBranchName ?? params.branchName
  const semester   = propSemester   ?? params.semester

  const decodedBranch = branchName && branchName !== "undefined"
    ? decodeURIComponent(branchName)
    : null

  const [previewFile, setPreviewFile] = useState(null)

  const canFetch = !!programId
    && programId !== "undefined"
    && !!decodedBranch
    && !!semester
    && semester !== "undefined"

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn:  () => getProgramById(programId),
    enabled:  canFetch,
    staleTime: 1000 * 60 * 10,
  })

  const { data: subjects = [], isLoading, error } = useQuery({
    queryKey: ["syllabus-subjects", programId, decodedBranch, semester],
    queryFn:  () => getSubjectsBySemesterContext({
      programId,
      branch: decodedBranch,
      semester: Number(semester),
    }),
    enabled:  canFetch,
    staleTime: 1000 * 60 * 5,
  })

  const { data: fileSizes = {} } = useQuery({
    queryFn: async () => {
      const sizes = {}
      await Promise.all(subjects.map(async s => {
        if (!s.pdfFileId) return
        try {
          const metadata = await getFileMetadata(s.pdfFileId, s.storageProvider, "syllabus", s.bucketId)
          sizes[s.pdfFileId] = metadata.size
        } catch (err) {
          console.error("Size fetch failed", err)
        }
      }))
      return sizes
    },
    enabled:  subjects.length > 0,
    staleTime: 1000 * 60 * 10,
  })

  const getSharePath = useShareLink({ programId, branchName: decodedBranch })

  if (!canFetch) return null

  const publicBase = `/programs/${programId}/branches/${branchName}/syllabus`
  const wrapClass  = isDashboard
    ? "space-y-5"
    : "max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6"

  return (
    <div className={wrapClass}>

      {isDashboard && (
        <BackButton to="/dashboard/syllabus" label="Syllabus" />
      )}
      {!isDashboard && (
        <>
          <BackButton to={publicBase} label="Syllabus" />
          <Breadcrumbs overrides={{ [programId]: program?.name || "" }} />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <ClipboardList size={18} className="text-cyan-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Semester {semester} · Syllabus</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{decodedBranch}</p>
          </div>
        </div>

        <ShareButton path={getSharePath(`syllabus/semester/${semester}`)} />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-16 animate-pulse" />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">No subjects uploaded for this semester yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {subjects.map(subject => (
              <GlowCard key={subject.$id}
                disableGlare={true}
                spotlightColor="rgba(6, 182, 212, 0.08)"
                className="overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                  style={{ background: "linear-gradient(90deg, transparent, #06b6d4, transparent)" }} />
                <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileTypeBadge fileType="pdf" onPreview={() => {
                      const url = getFileViewUrl(subject.pdfFileId, subject.storageProvider, "syllabus", subject.bucketId)
                      if (isMobile()) { window.open(url, "_blank"); return }
                      setPreviewFile({
                        fileId: subject.pdfFileId,
                        bucketId: subject.bucketId || SYLLABUS_BUCKET_ID,
                        storageProvider: subject.storageProvider,
                        type: "syllabus",
                        title: subject.subjectName
                      })
                    }} className="cursor-target" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{subject.subjectName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {subject.description && (
                          <span className="text-[11px] text-muted-foreground truncate">{subject.description}</span>
                        )}
                        {fileSizes[subject.pdfFileId] > 0 && (
                          <span className="hidden sm:inline-block text-[11px] text-muted-foreground/60 shrink-0">
                            {formatFileSize(fileSizes[subject.pdfFileId])}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => {
                          const url = getFileViewUrl(subject.pdfFileId, subject.storageProvider, "syllabus", subject.bucketId)
                          if (isMobile()) { window.open(url, "_blank"); return }
                          setPreviewFile({
                            fileId: subject.pdfFileId,
                            bucketId: subject.bucketId || SYLLABUS_BUCKET_ID,
                            storageProvider: subject.storageProvider,
                            type: "syllabus",
                            title: subject.subjectName
                          })
                        }}
                        className="flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium
                                   border border-border/60 bg-muted/30 text-muted-foreground
                                   hover:border-border hover:text-foreground hover:bg-muted/60
                                   transition-all active:scale-95 cursor-target"
                      >
                        <ExternalLink size={11} /> View
                      </button>
                    <button
                      onClick={() => downloadFileXHR({
                        url: getPdfDownloadUrl(subject.pdfFileId, subject.storageProvider, "syllabus", subject.bucketId),
                        fileName: buildSyllabusFilename({ subjectName: subject.subjectName, semester }),
                      })}
                      className="flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium
                                 text-white transition-all active:scale-95 cursor-target"
                      style={{ background: "linear-gradient(135deg, #0891b2, #0e7490)" }}
                    >
                      <Download size={11} /> Download
                    </button>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </motion.div>

      {!isMobile() && (
        <PdfPreviewModal
          open={!!previewFile}
          fileId={previewFile?.fileId}
          bucketId={previewFile?.bucketId}
          storageProvider={previewFile?.storageProvider}
          type={previewFile?.type}
          title={previewFile?.title}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  )
}
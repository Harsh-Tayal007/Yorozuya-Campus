// src/pages/pyqs/PyqSubjectList.jsx
import { useState } from "react"
import { useParams, useLocation } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { FileText, ExternalLink, Download } from "lucide-react"
import { databases, storage } from "@/lib/appwrite"
import { Breadcrumbs } from "@/components"
import { BackButton } from "@/components"
import { formatFileSize } from "@/utils/formatFileSize"
import PyqPreviewModal from "./PyqPreviewModal"
import { getPyqsForSubject } from "@/services/syllabus/pyqService"
import { getProgramById } from "@/services/university/programService"
import { DATABASE_ID, SUBJECTS_COLLECTION_ID } from "@/config/appwrite"
import { isMobileDevice } from "@/utils/isMobileDevice"
import { FileTypeBadge } from "@/components"
import ShareButton from "@/components/common/navigation/ShareButton"
import { useShareLink } from "@/hooks/useShareLink"

const PyqSubjectList = ({ programId: propProgramId, branchName: propBranchName, isDashboard }) => {
  const params   = useParams()
  const location = useLocation()
  const programId  = propProgramId  ?? params.programId
  const branchName = propBranchName ?? params.branchName
  const semester   = params.semester
  const subjectId  = params.subjectId
  const decodedBranch = branchName ? decodeURIComponent(branchName) : null
  const initialSubjectName = location.state?.subjectName

  const [previewPyq, setPreviewPyq] = useState(null)

  const programBase = `/programs/${programId}/branches/${branchName}`
  const basePyqPath = isDashboard ? "/dashboard/pyqs" : `${programBase}/pyqs`

  const canFetch = !!programId && programId !== "undefined" && !!semester && !!subjectId

  const { data: program } = useQuery({
    queryKey: ["program", programId],
    queryFn:  () => getProgramById(programId),
    enabled:  canFetch, staleTime: 1000 * 60 * 10,
  })

  const { data: currentSubject } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn:  () => databases.getDocument(DATABASE_ID, SUBJECTS_COLLECTION_ID, subjectId),
    enabled:  canFetch && !initialSubjectName,
    staleTime: 1000 * 60 * 30,
  })

  const subjectName = initialSubjectName || currentSubject?.subjectName

  const { data: pyqs = [], isLoading } = useQuery({
    queryKey: ["pyqs-subject", programId, semester, subjectId],
    queryFn:  () => getPyqsForSubject({ programId, semester: Number(semester), subjectId }),
    enabled:  canFetch,
    staleTime: 1000 * 60 * 5,
  })

  const getSharePath = useShareLink({ programId, branchName: decodedBranch })

  const handleView     = (pyq) => {
    if (isMobileDevice()) { window.open(storage.getFileView(pyq.bucketId, pyq.fileId), "_blank"); return }
    setPreviewPyq(pyq)
  }
  const handleDownload = (pyq) => window.open(storage.getFileDownload(pyq.bucketId, pyq.fileId), "_blank")

  if (!canFetch) return null

  const wrapClass = isDashboard ? "space-y-5" : "max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6"

  return (
    <div className={wrapClass}>
      <BackButton to={`${basePyqPath}/semester/${semester}`} label={`Semester ${semester}`} />
      {!isDashboard && (
        <Breadcrumbs overrides={{
          ...(program?.name   && { [programId]:  program.name }),
          ...(subjectName     && { [subjectId]:  subjectName }),
        }} />
      )}

      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20">
            <FileText size={18} className="text-red-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PYQs</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{subjectName ?? decodedBranch}</p>
          </div>
        </div>

        <ShareButton path={getSharePath(`pyqs/semester/${semester}/subject/${subjectId}`)} />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }}>
        {isLoading ? (
          <div className="space-y-2.5">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl border border-border/40 bg-card/40 h-16 animate-pulse" />)}
          </div>
        ) : pyqs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-border/50">
            <p className="text-sm text-muted-foreground">No PYQs uploaded for this subject yet</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pyqs.map(pyq => (
              <motion.div key={pyq.$id} layout
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="group relative rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm
                           hover:border-border hover:bg-card/80 transition-all duration-200 overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                  style={{ background: "linear-gradient(90deg, transparent, #ef4444, transparent)" }} />
                <div className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileTypeBadge fileType={pyq.fileType} onPreview={() => handleView(pyq)} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{pyq.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        {pyq.unit && <span className="text-[10px] font-medium px-1.5 py-px rounded bg-muted/60 text-muted-foreground">Unit {pyq.unit.order}: {pyq.unit.title}</span>}
                        {pyq.year && <span className="text-[11px] text-muted-foreground">{pyq.year}</span>}
                        {pyq.fileSize && <span className="text-[11px] text-muted-foreground/60">{formatFileSize(pyq.fileSize)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => handleView(pyq)}
                      className="flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium
                                 border border-border/60 bg-muted/30 text-muted-foreground
                                 hover:border-border hover:text-foreground hover:bg-muted/60 transition-all active:scale-95">
                      <ExternalLink size={11} /> View
                    </button>
                    <button onClick={() => handleDownload(pyq)}
                      className="flex items-center gap-1 h-8 px-3 rounded-xl text-xs font-medium text-white transition-all active:scale-95"
                      style={{ background: "linear-gradient(135deg, #dc2626, #b91c1c)" }}>
                      <Download size={11} /> Download
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {!isMobileDevice() && (
        <PyqPreviewModal pyq={previewPyq} open={!!previewPyq} onClose={() => setPreviewPyq(null)} />
      )}
    </div>
  )
}

export default PyqSubjectList
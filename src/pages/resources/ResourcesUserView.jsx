import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"

import { Query } from "appwrite"
import { databases } from "@/lib/appwrite"

import { getPdfViewUrl } from "@/services/storageService"
import { getAvailableResourceSemesters } from "@/services/resourceAvailabilityService"
import { BackButton, Breadcrumbs, ErrorState, FileTypeBadge, LoadingCard, SyllabusListSkeleton } from "@/components"
import { getResolvedResourcesForSubject }
  from "@/services/resourceUserResolver";
import { Button } from "@/components/ui/button"
import { formatFileSize } from "@/utils/formatFileSize"
import { Badge } from "@/components/ui/badge"
import PdfPreviewModal from "@/components/common/PdfPreviewModal"
import { STORAGE_BUCKET_ID } from "@/config/appwrite"
import { buildResourceFilename } from "@/utils/filenameUtils"
import { downloadFileXHR } from "@/services/downloadService"
import { isMobileDevice } from "@/utils/isMobileDevice"
import { useQuery } from "@tanstack/react-query"
import GlowCard from "@/components/common/GlowCard"
import { ArrowUpRight } from "lucide-react"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const SYLLABUS_COLLECTION = import.meta.env.VITE_APPWRITE_SYLLABUS_COLLECTION_ID
const SUBJECTS_COLLECTION = import.meta.env.VITE_APPWRITE_SUBJECTS_COLLECTION_ID
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID
const RESOURCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_RESOURCES_COLLECTION_ID

export default function ResourcesUserView({
  programId: propProgramId,
  branchName: propBranchName,
  isDashboard
}) {

  const params = useParams()

  const programId = propProgramId ?? params.programId
  const branchName = propBranchName ?? params.branchName
  const semester = params.semester
  const subjectId = params.subjectId
  const unitId = params.unitId

  const [downloadingId, setDownloadingId] = useState(null);

  const [progress, setProgress] = useState(null)

  const navigate = useNavigate()

  const decodedBranch = branchName
    ? decodeURIComponent(branchName)
    : null

  const [previewResource, setPreviewResource] = useState(null);

  const [activeDownload, setActiveDownload] = useState(null)

  const programBase = `/programs/${programId}/branches/${branchName}`
  const dashboardBase = "/dashboard/resources"

  const baseResourcesPath = isDashboard
    ? dashboardBase
    : `${programBase}/resources`

  const branchBasePath = isDashboard
    ? "/dashboard"
    : programBase

  const {
    data: resources = [],
    isLoading: loadingResources,
    error: resourcesError,
    refetch: refetchResources,

  } = useQuery({
    queryKey: ["resources", programId, semester, subjectId],
    queryFn: () =>
      getResolvedResourcesForSubject({
        programId,
        semester,
        subjectId,
      }),
    enabled: !!programId && !!semester && !!subjectId,
    // staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const {
    data: program = null,
  } = useQuery({
    queryKey: ["program", programId],
    queryFn: () => getProgramById(programId),
    enabled: !!programId,
    staleTime: 1000 * 60 * 10,
  })

  const {
    data: subjects = [],
    isLoading: loading,
    error: subjectsError,
    refetch: refetchSubjects,
  } = useQuery({
    queryKey: ["subjects", programId, decodedBranch, semester],
    queryFn: () =>
      getSubjectsBySemesterContext({
        programId,
        branch: decodedBranch,
        semester,
      }),
    enabled: !!programId && !!decodedBranch && !!semester,
    // staleTime: 10 * 60 * 1000,
  });


  const {
    data: units = [],
    isLoading: loadingUnits,
  } = useQuery({
    queryKey: ["units", subjectId],
    queryFn: async () => {
      const res = await databases.listDocuments(
        DATABASE_ID,
        UNITS_COLLECTION_ID,
        [
          Query.equal("subjectId", subjectId),
          Query.orderAsc("order"),
        ]
      );
      return res.documents;
    },
    enabled: !!subjectId,
    // staleTime: 15 * 60 * 1000,
  });

  const {
    data: currentSubject = null,
  } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () =>
      databases.getDocument(
        DATABASE_ID,
        SUBJECTS_COLLECTION,
        subjectId
      ),
    enabled: !!subjectId,
    // staleTime: 30 * 60 * 1000,
  });

  const {
    data: currentUnit = null,
  } = useQuery({
    queryKey: ["unit", unitId],
    queryFn: () =>
      databases.getDocument(
        DATABASE_ID,
        UNITS_COLLECTION_ID,
        unitId
      ),
    enabled: !!unitId,
    // staleTime: 30 * 60 * 1000,
  });

  const {
    data: availableSemesters = [],
    isLoading: loadingSemesters,
  } = useQuery({
    queryKey: ["resourceSemesters", programId, decodedBranch],
    queryFn: () =>
      getAvailableResourceSemesters({
        programId,
        branch: decodedBranch,
      }),
    enabled: !!programId && !semester && !subjectId,
    // staleTime: 20 * 60 * 1000,
  });

  async function getSubjectsBySemesterContext({ programId, branch, semester }) {
    const syllabusRes = await databases.listDocuments(
      DATABASE_ID,
      SYLLABUS_COLLECTION,
      [
        Query.equal("programId", programId),
        Query.equal("branch", branch),
        Query.equal("semester", Number(semester)),
      ]
    )

    const syllabusIds = syllabusRes.documents.map(doc => doc.$id)

    if (!syllabusIds.length) return []

    const subjectsRes = await databases.listDocuments(
      DATABASE_ID,
      SUBJECTS_COLLECTION,
      [
        Query.equal("syllabusId", syllabusIds),
        Query.orderAsc("subjectName"),
      ]
    )

    return subjectsRes.documents
  }


  if (subjectsError || resourcesError) {
    return (
      <ErrorState
        message="Failed to load resources."
        onRetry={() => {
          refetchSubjects()
          refetchResources()
        }}
      />
    )
  }



  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

      {/* ⬅ Back Button */}
      {!semester && (
        <BackButton
          to={branchBasePath}
          label={decodedBranch}
        />
      )}

      {semester && !subjectId && (
        <BackButton
          to={baseResourcesPath}
          label="Resources"
        />
      )}

      {semester && subjectId && (
        <BackButton
          to={`${baseResourcesPath}/semester/${semester}`}
          label={`Semester ${semester}`}
        />
      )}

      {/* 🧭 Breadcrumb */}
      {program && (
  <Breadcrumbs
    overrides={{
      ...(program?.name && {
        [programId]: program.name,
      }),
      ...(currentSubject?.subjectName && {
        [subjectId]: currentSubject.subjectName,
      }),
      ...(currentUnit?.title && {
        [unitId]: `Unit ${currentUnit.order}`,
      }),
    }}
  />
)}

      {/* 🧾 Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">
          Resources
        </h1>
        <p className="text-muted-foreground">
          {decodedBranch}
        </p>
      </div>

      {/* 📦 Semester Cards */}
      {!semester && (
        <>
          {loadingSemesters ? (
            <LoadingCard count={4} />
          ) : availableSemesters.length === 0 ? (
            <p className="text-muted-foreground">
              No resources available for this branch yet.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {availableSemesters.map((sem) => (
                <GlowCard
                  key={sem}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(`${baseResourcesPath}/semester/${sem}`)
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Semester {sem}
                    </CardTitle>
                    <CardDescription>
                      View resources
                    </CardDescription>
                  </CardHeader>
                  {/* Arrow Icon */}
                  <ArrowUpRight
                    className="
          absolute bottom-4 right-4
          h-4 w-4
          text-muted-foreground
          opacity-70
          transition
          group-hover:opacity-100
        "
                  />
                </GlowCard>
              ))}
            </div>
          )}
        </>
      )}


      {/* 📘 Subjects */}
      {semester && !subjectId && (
        <>
          {loading && (
            <LoadingCard count={4} />
          )}

          {!loading && subjects.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No subjects uploaded for this semester yet.
            </div>
          )}

          {!loading && subjects.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject) => (
                <GlowCard
                  key={subject.$id}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate(`${baseResourcesPath}/semester/${semester}/subject/${subject.$id}`)
                  }
                >
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {subject.subjectName}
                    </CardTitle>

                    {subject.description && (
                      <CardDescription>
                        {subject.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {/* Arrow Icon */}
                  <ArrowUpRight
                    className="
          absolute bottom-4 right-4
          h-4 w-4
          text-muted-foreground
          opacity-70
          transition
          group-hover:opacity-100
        "
                  />
                </GlowCard>
              ))}
            </div>

          )}
        </>
      )}

      {/* 📚 Resources */}
      {subjectId && (
        <>
          {loadingResources && (
            <SyllabusListSkeleton count={4} />
          )}

          {!loadingResources && resources.length === 0 && (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No resources uploaded for this unit yet.
            </div>
          )}

          {!loadingResources && resources.length > 0 && (
            <div className="space-y-4">
              {resources.map((resource) => (
                <Card
                  key={resource.$id}
                  className="
  p-4
  flex flex-col gap-4
  md:flex-row md:items-center md:justify-between

  cursor-default
  transition-all duration-200
  hover:bg-muted/40
  hover:shadow-lg
hover:-translate-y-[2px]

"

                >

                  {/* Left */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <FileTypeBadge
                        fileType={resource.type === "pdf" ? "PDF" : "LINK"}
                      />

                      <p className="font-medium">{resource.title}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {resource.unit && (
                        <Badge variant="secondary">
                          Unit {resource.unit.order}: {resource.unit.title}
                        </Badge>
                      )}

                      {resource.fileSize && (
                        <Badge
                          variant="secondary"
                          className="font-normal opacity-80"
                        >
                          {formatFileSize(resource.fileSize)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="flex flex-col items-end gap-1 md:shrink-0">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // LINK resources → always open normally
                          if (resource.type === "link" && resource.url) {
                            window.open(resource.url, "_blank")
                            return
                          }

                          // PDF on mobile → open directly
                          if (isMobileDevice()) {
                            const url = getPdfViewUrl(resource.fileId)
                            window.open(url, "_blank")
                            return
                          }

                          // Desktop PDF → modal preview
                          setPreviewResource(resource)
                        }}
                      >
                        View
                      </Button>

                      {resource.type === "pdf" && (
                        <div className="relative">
                          <Button
                            size="sm"
                            className="relative overflow-hidden pr-8"
                            onClick={() => {
                              if (downloadingId === resource.$id) return

                              setDownloadingId(resource.$id)
                              setProgress(0)

                              const controller = downloadFileXHR({
                                url: getPdfViewUrl(resource.fileId),
                                fileName: buildResourceFilename(resource),

                                onProgress: (data) => {
                                  if (typeof data === "number") {
                                    setProgress(data)
                                  } else {
                                    const percent = Math.min(
                                      Math.round((data.loaded / resource.fileSize) * 100),
                                      99
                                    )
                                    setProgress(percent)
                                  }
                                },

                                onSuccess: () => {
                                  setProgress(null)
                                  setDownloadingId(null)
                                  setActiveDownload(null)
                                },

                                onCancel: () => {
                                  setProgress(null)
                                  setDownloadingId(null)
                                  setActiveDownload(null)
                                },

                                onError: () => {
                                  setProgress(null)
                                  setDownloadingId(null)
                                  setActiveDownload(null)
                                },
                              })

                              setActiveDownload(controller)
                            }}
                          >
                            {/* BASE */}
                            {downloadingId === resource.$id && (
                              <span className="absolute inset-0 bg-zinc-300 dark:bg-zinc-700" />
                            )}

                            {/* PROGRESS */}
                            {downloadingId === resource.$id && (
                              <span
                                className="absolute inset-y-0 left-0 bg-primary transition-[width]"
                                style={{ width: `${progress}%` }}
                              />
                            )}

                            {/* TEXT (auto-contrast) */}
                            <span className="relative z-10 mix-blend-difference text-white font-medium">
                              {downloadingId === resource.$id
                                ? `Downloading… ${progress ?? 0}%`
                                : "Download"}
                            </span>
                          </Button>

                          {/* ❌ CANCEL (NOT INSIDE BUTTON) */}
                          {downloadingId === resource.$id && (
                            <span
                              className="
        absolute right-2 top-1/2 -translate-y-1/2
        cursor-pointer
        text-xs
        opacity-70
        hover:opacity-100
        z-20
      "
                              onClick={(e) => {
                                e.stopPropagation()
                                activeDownload?.cancel()
                              }}
                            >
                              ✕
                            </span>
                          )}
                        </div>


                      )}
                    </div>
                  </div>

                </Card>
              ))}
            </div>
          )}

        </>
      )}

      {!isMobileDevice() && (
        <PdfPreviewModal
          open={!!previewResource}
          fileId={previewResource?.fileId}
          bucketId={STORAGE_BUCKET_ID}
          title={previewResource?.title}
          onClose={() => setPreviewResource(null)}
        />
      )}

    </div>
  )
}

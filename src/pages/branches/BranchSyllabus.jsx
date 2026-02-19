import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAvailableSyllabusSemesters } from "@/services/syllabusService"
import { BackButton, Breadcrumbs, LoadingCard } from "@/components"
import { ArrowUpRight } from "lucide-react"
import SemesterCard from "@/components/academic/SemesterCard"

const BranchSyllabus = ({
  programId,
  branchName,
  isDashboard = false
}) => {

  const params = useParams()
  const navigate = useNavigate()

  const finalProgramId = programId ?? params.programId
  const finalBranchName = branchName ?? params.branchName

  const decodedBranch = finalBranchName
    ? decodeURIComponent(finalBranchName)
    : null

  // UseQuery - for cache
  const { data: semesters = [], isLoading } = useQuery({
    queryKey: ["syllabus-semesters", finalProgramId, decodedBranch],
    queryFn: () =>
      getAvailableSyllabusSemesters({
        programId: finalProgramId,
        branch: decodedBranch,
      }),
    enabled: Boolean(finalProgramId && decodedBranch),
  })


  const breadcrumbItems = isDashboard
    ? [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Syllabus" },
    ]
    : [
      { label: "B.Tech", href: "/" },
      {
        label: decodedBranch,
        href: `/programs/${finalProgramId}/branches/${finalBranchName}`,
      },
      {
        label: "Syllabus",
      },
    ]


  return (
   <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">

      {isDashboard ? (
        <BackButton
          to="/dashboard"
          label="Dashboard"
        />
      ) : (
        <BackButton
          to={`/programs/${finalProgramId}/branches/${finalBranchName}`}
          label={decodedBranch}
        />
      )}

      <Breadcrumbs items={breadcrumbItems} />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          Syllabus
        </h1>
        <p className="text-muted-foreground mt-1">
          Select a semester to view syllabus
        </p>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingCard count={4} />
      ) : semesters.length === 0 ? (
        <p className="text-muted-foreground">
          No syllabus available for this branch yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((sem) => (
            <SemesterCard
              key={sem}
              semester={sem}
              onClick={() => {
                if (isDashboard) {
                  navigate(`/dashboard/syllabus/${sem}`)
                } else {
                  navigate(
                    `/programs/${finalProgramId}/branches/${encodeURIComponent(finalBranchName)}/syllabus/${sem}`
                  )
                }
              }}
            />

          ))}
        </div>
      )}
    </div>
  )
}

export default BranchSyllabus

import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAvailableSyllabusSemesters } from "@/services/syllabusService"
import { BackButton, Breadcrumbs } from "@/components"
import { ArrowUpRight } from "lucide-react"

const BranchSyllabus = () => {
  const { programId, branchName } = useParams()
  const navigate = useNavigate()

  const decodedBranch = decodeURIComponent(branchName)

  // UseQuery - for cache
  const {
    data: semesters = [],
    isLoading,
  } = useQuery({
    queryKey: ["syllabus-semesters", programId, decodedBranch],
    queryFn: () =>
      getAvailableSyllabusSemesters({
        programId,
        branch: decodedBranch,
      }),
    enabled: !!programId && !!decodedBranch,
  });

  const breadcrumbItems = [
    { label: "B.Tech", href: "/" },
    {
      label: decodedBranch,
      href: `/programs/${programId}/branches/${branchName}`,
    },
    {
      label: "Syllabus",
    },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

      <BackButton
        to={`/programs/${programId}/branches/${branchName}`}
        label={decodedBranch}
      />

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
        <p className="text-muted-foreground">Loading semesters…</p>
      ) : semesters.length === 0 ? (
        <p className="text-muted-foreground">
          No syllabus available for this branch yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((sem) => (
            <Card
              key={sem}
              onClick={() =>
                navigate(
                  `/programs/${programId}/branches/${branchName}/syllabus/${sem}`
                )
              }
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
                e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
              }}
              className="
    relative
    cursor-pointer
    text-center
    overflow-hidden
    transition-colors duration-300
    before:absolute
    before:inset-0
    before:opacity-0
    hover:before:opacity-100
    before:transition-opacity before:duration-300
    before:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.12),transparent_40%)]
    dark:before:bg-[radial-gradient(600px_circle_at_var(--mouse-x)_var(--mouse-y),rgba(255,255,255,0.08),transparent_40%)]
    hover:ring-1 hover:ring-primary/20
  "
            >
              <CardHeader className="items-start text-left">
                <CardTitle className="text-lg">Semester {sem}</CardTitle>
                <CardDescription>
                  View syllabus
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
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default BranchSyllabus

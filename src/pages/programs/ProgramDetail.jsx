import { useParams, useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { getBranchesForProgram } from "@/utils/getBranchesForProgram"
import { getAvailableBranchesForProgram } from "@/services/branchAvailabilityService"
import { useQuery } from "@tanstack/react-query"
import GlowCard from "@/components/common/GlowCard"
import { ArrowUpRight } from "lucide-react"

const ProgramDetail = () => {
  const { programId } = useParams()
  const navigate = useNavigate()

  const program = {
    id: programId,
    name: "B.Tech",
    duration: 4,
    level: "Undergraduate",
  }

  const allBranches = getBranchesForProgram(program.name)

  const {
    data: availableBranches = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["available-branches", programId],
    queryFn: () => getAvailableBranchesForProgram(programId),
    enabled: !!programId,
  })

  const visibleBranches = allBranches.filter(branch =>
    availableBranches.includes(branch)
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Program Header */}
      <div>
        <h1 className="text-3xl font-bold">{program.name}</h1>
        <p className="text-muted-foreground mt-1">
          {program.level} · {program.duration} Years
        </p>
      </div>

      {/* Branches */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Choose your branch
        </h2>

        {isLoading ? (
          <p className="text-muted-foreground">Loading branches…</p>
        ) : visibleBranches.length === 0 ? (
          <p className="text-muted-foreground">
            No branches have syllabus or resources available yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleBranches.map(branch => (
              <GlowCard
                key={branch}
                className="cursor-pointer"
                onClick={() =>
                  navigate(
                    `/programs/${programId}/branches/${encodeURIComponent(branch)}`
                  )
                }
              >
                <CardHeader>
                  <CardTitle className="text-lg">
                    {branch}
                  </CardTitle>
                </CardHeader>
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
      </div>
    </div>
  )
}

export default ProgramDetail

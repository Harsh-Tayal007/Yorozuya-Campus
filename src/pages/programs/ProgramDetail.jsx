import { useParams, useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { getBranchesForProgram } from "@/utils/getBranchesForProgram"
import { getAvailableBranchesForProgram } from "@/services/branchAvailabilityService"

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

  const [availableBranches, setAvailableBranches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAvailableBranches = async () => {
      try {
        const data = await getAvailableBranchesForProgram(programId)
        setAvailableBranches(data)
      } catch (err) {
        console.error("Failed to fetch available branches", err)
      } finally {
        setLoading(false)
      }
    }

    fetchAvailableBranches()
  }, [programId])

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

        {loading ? (
          <p className="text-muted-foreground">Loading branches…</p>
        ) : visibleBranches.length === 0 ? (
          <p className="text-muted-foreground">
            No branches have syllabus or resources available yet.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleBranches.map(branch => (
              <Card
                key={branch}
                onClick={() =>
                  navigate(
                    `/programs/${programId}/branches/${encodeURIComponent(branch)}`
                  )
                }
                className="cursor-pointer hover:shadow-lg transition"
              >
                <CardHeader>
                  <CardTitle>{branch}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProgramDetail

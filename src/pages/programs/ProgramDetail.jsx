import { useParams, useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { getBranchesForProgram } from "@/utils/getBranchesForProgram"

const ProgramDetail = () => {
  const { programId } = useParams()
  const navigate = useNavigate()

  // TEMP: replace later with API fetch
  const program = {
    id: programId,
    name: "B.Tech",
    duration: 4,
    level: "Undergraduate",
  }

  const branches = getBranchesForProgram(program.name)

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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card
              key={branch}
              onClick={() =>
                navigate(
                  `/programs/${programId}/branches/${encodeURIComponent(
                    branch
                  )}`
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
      </div>
    </div>
  )
}

export default ProgramDetail

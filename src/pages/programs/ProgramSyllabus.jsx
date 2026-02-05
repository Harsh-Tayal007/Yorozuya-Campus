import { useParams, useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const ProgramSyllabus = () => {
  const { programId } = useParams()
  const navigate = useNavigate()

  // TEMP: static semester count
  // later → fetch from program (semesterCount)
  const semesterCount = 8

  const semesters = Array.from(
    { length: semesterCount },
    (_, i) => i + 1
  )

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Syllabus</h1>
        <p className="text-muted-foreground mt-1">
          Select a semester to view syllabus
        </p>
      </div>

      {/* Semester Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {semesters.map((sem) => (
          <Card
            key={sem}
            onClick={() =>
              navigate(`/programs/${programId}/syllabus/${sem}`)
            }
            className="
              cursor-pointer text-center
              hover:shadow-lg transition
            "
          >
            <CardHeader>
              <CardTitle>Semester {sem}</CardTitle>
              <CardDescription>
                View syllabus
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default ProgramSyllabus

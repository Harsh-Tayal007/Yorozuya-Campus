import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { getAvailableSyllabusSemesters } from "@/services/syllabusAvailabilityService"

const ProgramSyllabus = () => {
  const { programId, branchName } = useParams()
  const navigate = useNavigate()

  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)

  const decodedBranch = decodeURIComponent(branchName)

  useEffect(() => {
    const fetchSemesters = async () => {
      try {
        const data =
          await getAvailableSyllabusSemesters({
            programId,
            branch: decodedBranch,
          })

        setSemesters(data)
      } catch (err) {
        console.error("Failed to fetch syllabus semesters", err)
      } finally {
        setLoading(false)
      }
    }

    fetchSemesters()
  }, [programId, decodedBranch])


  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">
          {decodedBranch} Syllabus
        </h1>
        <p className="text-muted-foreground mt-1">
          Select a semester to view syllabus
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground">
          Loading available semesters…
        </p>
      ) : semesters.length === 0 ? (
        <p className="text-muted-foreground">
          No syllabus available for this branch yet.
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {semesters.map((sem) => (
            <Card
              key={sem}
              onClick={() =>
               navigate(
  `/programs/${programId}/branches/${encodeURIComponent(
    decodedBranch
  )}/syllabus/semester/${sem}`
)
              }
              className="cursor-pointer text-center hover:shadow-lg transition"
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
      )}
    </div>
  )
}

export default ProgramSyllabus

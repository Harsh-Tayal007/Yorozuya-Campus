import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getAvailableSyllabusSemesters } from "@/services/syllabusService"

const BranchSyllabus = () => {
  const { programId, branchName } = useParams()
  const navigate = useNavigate()

  const decodedBranch = decodeURIComponent(branchName)

  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSemesters = async () => {
      setLoading(true)

      try {
        const data = await getAvailableSyllabusSemesters({
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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
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
      {loading ? (
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
              className="cursor-pointer text-center hover:shadow-lg transition"
            >
              <CardHeader className="items-start text-left">
                <CardTitle className="text-lg">Semester {sem}</CardTitle>
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

export default BranchSyllabus

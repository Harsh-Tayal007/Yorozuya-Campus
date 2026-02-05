import { useParams, useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

const BranchDetail = () => {
  const { programId, branchName } = useParams()
  const navigate = useNavigate()

  const decodedBranch = decodeURIComponent(branchName)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">{decodedBranch}</h1>
        <p className="text-muted-foreground mt-1">
          B.Tech · Branch Overview
        </p>
      </div>

      {/* Branch Actions */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* 📘 Syllabus */}
        <Card
          onClick={() =>
            navigate(
              `/programs/${programId}/branches/${branchName}/syllabus`
            )
          }
          className="cursor-pointer hover:shadow-lg transition"
        >
          <CardHeader>
            <CardTitle>📘 Syllabus</CardTitle>
            <CardDescription>
              View semester-wise syllabus
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 📚 Resources */}
        <Card
          onClick={() =>
            navigate(
              `/programs/${programId}/branches/${branchName}/resources`
            )
          }
          className="cursor-pointer hover:shadow-lg transition"
        >
          <CardHeader>
            <CardTitle>📚 Resources</CardTitle>
            <CardDescription>
              Notes, links & study materials
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 📝 PYQs */}
        <Card
          onClick={() =>
            navigate(
              `/programs/${programId}/branches/${branchName}/pyqs`
            )
          }
          className="cursor-pointer hover:shadow-lg transition"
        >
          <CardHeader>
            <CardTitle>📝 PYQs</CardTitle>
            <CardDescription>
              Previous year question papers
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}

export default BranchDetail

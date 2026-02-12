import { useParams, useNavigate } from "react-router-dom"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpen, Library, FileText, ArrowUpRight } from "lucide-react"
import GlowCard from "@/components/common/GlowCard"


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

        {/* Syllabus */}
        <GlowCard
          className="cursor-pointer relative"
          onClick={() =>
            navigate(
              `/programs/${programId}/branches/${branchName}/syllabus`
            )
          }
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <CardTitle>Syllabus</CardTitle>
            </div>

            <CardDescription>
              View semester-wise syllabus
            </CardDescription>
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


        {/* Resources */}
        <GlowCard
          className="cursor-pointer relative"
          onClick={() =>
            navigate(
              `/programs/${programId}/branches/${branchName}/resources`
            )
          }
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <Library className="h-5 w-5 text-primary" />
              <CardTitle>Resources</CardTitle>
            </div>

            <CardDescription>
              Notes, links & study materials
            </CardDescription>
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


        {/* PYQs */}
        <GlowCard
          className="cursor-pointer relative"
          onClick={() =>
            navigate(
              `/programs/${programId}/branches/${branchName}/pyqs`
            )
          }
        >
          <CardHeader>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>PYQs</CardTitle>
            </div>

            <CardDescription>
              Previous year question papers
            </CardDescription>
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


      </div>
    </div>
  )

}

export default BranchDetail

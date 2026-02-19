import { useNavigate } from "react-router-dom"
import { BookOpen, Library, FileText, ArrowUpRight } from "lucide-react"

import { CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import GlowCard from "../common/GlowCard"

const AcademicQuickAccess = ({
  programId,
  branchName,
  mode = "explore", // "explore" | "dashboard"
}) => {
  const navigate = useNavigate()

  const basePath =
    mode === "dashboard"
      ? "/dashboard"
      : `/programs/${programId}/branches/${branchName}`

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

      {/* Syllabus */}
      <GlowCard
        className="cursor-pointer relative"
        onClick={() => navigate(`${basePath}/syllabus`)}
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

        <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground opacity-70 transition group-hover:opacity-100" />
      </GlowCard>

      {/* Resources */}
      <GlowCard
        className="cursor-pointer relative"
        onClick={() => navigate(`${basePath}/resources`)}
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

        <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground opacity-70 transition group-hover:opacity-100" />
      </GlowCard>

      {/* PYQs */}
      <GlowCard
        className="cursor-pointer relative"
        onClick={() => navigate(`${basePath}/pyqs`)}
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

        <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-muted-foreground opacity-70 transition group-hover:opacity-100" />
      </GlowCard>

    </div>
  )
}

export default AcademicQuickAccess

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Trash2, Pencil } from "lucide-react"

const UniversityCard = ({
  university,
  onClick,
  actions,
  showCourses = false,
  onDelete,
  onEdit,
}) => {
  return (
    <Card
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className="
        group relative cursor-pointer overflow-hidden
        transition-all duration-300
        hover:-translate-y-1
        hover:shadow-xl
        hover:shadow-primary/10
      "
    >
      {/* Animated accent bar */}
      <div
        className="
          absolute inset-x-0 top-0 h-1
          bg-linear-to-r from-indigo-500 to-purple-500
          scale-x-0 origin-left
          transition-transform duration-300
          group-hover:scale-x-100
        "
      />

      <CardHeader className="space-y-1">
        <CardTitle
          className="
            text-lg font-semibold
            transition-colors
            group-hover:text-primary
          "
        >
          {university.name}
        </CardTitle>

        <CardDescription>
          {university.city
            ? `${university.city}, ${university.country}`
            : university.country}
        </CardDescription>
      </CardHeader>

      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
        {/* LEFT SIDE */}
        {showCourses && university.courses && (
          <span>{university.courses.length} Courses</span>
        )}

        {!showCourses && university.website && (
          <a
            href={university.website}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="
              inline-flex items-center gap-1
              hover:text-primary
              transition-colors
            "
          >
            Website <ExternalLink size={14} />
          </a>
        )}

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">
          {actions}

          {onEdit && (
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}


          {onDelete && (
            <Button
              variant="destructive"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(university.$id)
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}

          {onClick && (
            <span
              className="
        inline-flex items-center gap-1
        text-primary font-medium
        transition-all
        group-hover:gap-2
      "
            >
              View <span>→</span>
            </span>
          )}
        </div>


      </CardFooter>
    </Card>
  )
}

export default UniversityCard

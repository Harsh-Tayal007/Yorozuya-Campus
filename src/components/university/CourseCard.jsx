import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"

const CourseCard = ({ course, onClick }) => {
  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className="
        group relative cursor-pointer overflow-hidden
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10
        focus-visible:ring-2 focus-visible:ring-primary
      "
    >
      {/* Accent bar */}
      <div className="
    absolute inset-x-0 top-0 h-1
    bg-linear-to-r from-indigo-500 to-purple-500
    scale-x-0 origin-left
    transition-transform duration-300
    group-hover:scale-x-100
  " />

      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold transition-colors group-hover:text-primary">
          {course.name}
        </CardTitle>

        <CardDescription>
          {course.duration
            ? `Duration: ${course.duration} years`
            : "Duration not specified"}
        </CardDescription>
      </CardHeader>

      <CardFooter className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {course.degreeType || "Program"}
        </span>

        <span className="text-primary font-medium transition-all group-hover:translate-x-1">
          View →
        </span>
      </CardFooter>
    </Card>
  )
}

export default CourseCard

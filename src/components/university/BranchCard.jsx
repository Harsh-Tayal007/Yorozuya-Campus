import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card"

const BranchCard = ({ branch, onClick }) => {
  return (
    <Card
      onClick={onClick}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className="
    group relative cursor-pointer overflow-hidden
    transition-all duration-300
    hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10
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
        <CardTitle className="text-base font-semibold transition-colors group-hover:text-primary">
          {branch.name}
        </CardTitle>

        <CardDescription>
          {branch.semesters} Semesters
        </CardDescription>
      </CardHeader>

      <CardFooter className="text-sm text-muted-foreground">
        View branch →
      </CardFooter>
    </Card>
  )
}

export default BranchCard

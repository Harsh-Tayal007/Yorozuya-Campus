import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const ThreadCard = ({ thread }) => {
  const navigate = useNavigate()

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/forum/${thread.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/forum/${thread.id}`)
      }}
      className="
        bg-background border
        cursor-pointer
        transition-all duration-200
        hover:-translate-y-1 hover:shadow-xl
        active:translate-y-0 active:shadow-md
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-primary/50
      "
    >
      <CardContent className="pt-5 space-y-3">
        <h3 className="text-lg font-semibold leading-snug">
          {thread.title}
        </h3>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{thread.universityId}</Badge>
          {thread.courseId && <Badge variant="outline">{thread.courseId}</Badge>}
          {thread.branchId && <Badge variant="outline">{thread.branchId}</Badge>}
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {thread.content}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>
            By <span className="font-medium">{thread.author}</span> •{" "}
            {thread.createdAt}
          </span>
          <span>{thread.repliesCount} replies</span>
        </div>
      </CardContent>
    </Card>
  )
}

export default ThreadCard

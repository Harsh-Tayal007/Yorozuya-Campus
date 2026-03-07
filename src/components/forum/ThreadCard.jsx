import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const highlightMatch = (text = "", query) => {
  const safeText = String(text)

  if (!query) {
    return [<span key="full">{safeText}</span>]
  }

  const regex = new RegExp(`(${query})`, "gi")

  return safeText.split(regex).map((part, i) => {
    const isMatch = part.toLowerCase() === query.toLowerCase()

    return (
      <span
        key={`${isMatch ? "match" : "text"}-${i}`}
        className={isMatch ? "bg-primary/20 text-primary px-1 rounded" : ""}
      >
        {part}
      </span>
    )
  })
}

const ThreadCard = ({ thread, searchQuery }) => {
  const navigate = useNavigate()


  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/forum/${thread.$id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/forum/${thread.$id}`)
      }}
      className="
        group
        bg-background border
        cursor-pointer
        transition-all duration-200 ease-out
        hover:-translate-y-1 hover:shadow-2xl
        hover:border-primary/40
        active:scale-[0.98]
        focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-primary/50
      "
    >
      <CardContent className="pt-5 space-y-3">
        <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
          {highlightMatch(thread.title, searchQuery)}
        </h3>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{thread.universityId}</Badge>
          {thread.courseId && (
            <Badge variant="outline">{thread.courseId}</Badge>
          )}
          {thread.branchId && (
            <Badge variant="outline">{thread.branchId}</Badge>
          )}
        </div>

        <p className="text-sm text-muted-foreground">
          {highlightMatch(thread.content, searchQuery)}
        </p>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
          <span>
            By <span className="font-medium">{thread.authorName}</span> •{" "}
            {new Date(thread.$createdAt).toLocaleDateString()}
          </span>

          <span className="transition-colors group-hover:text-primary">
            {thread.repliesCount} replies
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

export default ThreadCard
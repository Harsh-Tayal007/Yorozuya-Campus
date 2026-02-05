import { useParams, useNavigate } from "react-router-dom"
import { threads } from "@/data/threads"

import PageWrapper from "@/components/common/PageWrapper"
import Breadcrumbs from "@/components/common/Breadcrumbs"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Reply } from "@/components/forum"

const ThreadDetail = () => {
  const { threadId } = useParams()
  const navigate = useNavigate()

  const thread = threads.find((t) => t.id === threadId)

  if (!thread) {
    return (
      <PageWrapper>
        <p className="text-muted-foreground">Thread not found.</p>
      </PageWrapper>
    )
  }

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate("/forum")
  }

  const replies = [
  {
    id: "r1",
    author: "Rahul",
    content: "Mid-sem exams are usually moderate. Focus on numericals.",
    createdAt: "2026-01-02T10:42",
    replies: [
      {
        id: "r1-1",
        author: "Sneha",
        content: "True, PYQs helped me a lot.",
        createdAt: "2026-01-02T11:05",
        replies: [
          {
            id: "r1-1-1",
            author: "Aditi",
            content: "Yes, especially for numericals.",
            createdAt: "2026-01-02T11:20",
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: "r2",
    author: "Kunal",
    content: "NPTEL and Gate Smashers are good resources.",
    createdAt: "2026-01-02T12:10",
    replies: [],
  },
]

  const demoOPReply = {
    id: "op-reply",
    author: thread.author,
    content: "Important update: Please check syllabus PDF first.",
    createdAt: "2026-01-02T12:45",
    upvotes: 8,
    isPinned: true,
    replies: [],
  }

  const allReplies = [demoOPReply, ...replies].sort(
    (a, b) => (b.isPinned === true) - (a.isPinned === true)
  )

  return (
    <PageWrapper>
      <Breadcrumbs
        items={[
          { label: "Forum", href: "/forum" },
          { label: thread.universityId },
          thread.courseId && { label: thread.courseId },
          thread.branchId && { label: thread.branchId },
          { label: thread.title },
        ].filter(Boolean)}
      />

      <Button
        variant="ghost"
        size="sm"
        className="mb-4"
        onClick={handleBack}
      >
        ← Back
      </Button>

      <Card className="mb-8">
        <CardContent className="pt-6 space-y-4">
          <h1 className="text-2xl font-bold">{thread.title}</h1>

          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary">{thread.universityId}</Badge>
            {thread.courseId && (
              <Badge variant="outline">{thread.courseId}</Badge>
            )}
            {thread.branchId && (
              <Badge variant="outline">{thread.branchId}</Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            By <span className="font-medium">{thread.author}</span> •{" "}
            {thread.createdAt}
          </p>

          <p>{thread.content}</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">
          {allReplies.length} Replies
        </h2>

        {allReplies.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No replies yet. Be the first to help 👋
          </div>
        ) : (
          allReplies.map((reply) => (
            <Reply
              key={reply.id}
              reply={reply}
              threadAuthor={thread.author}
            />
          ))
        )}
      </div>
    </PageWrapper>
  )
}

export default ThreadDetail

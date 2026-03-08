import { useParams, useNavigate, useSearchParams } from "react-router-dom"

import PageWrapper from "@/components/common/layout/PageWrapper"
import Breadcrumbs from "@/components/common/navigation/Breadcrumbs"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { useQuery } from "@tanstack/react-query"

import { fetchThreadById } from "@/services/forum/threadService"

import { Loader2 } from "lucide-react"

import { RepliesProvider } from "@/components/forum/RepliesProvider"
import RepliesSection from "@/components/forum/RepliesSection"

const ThreadDetail = () => {
  const { threadId } = useParams()
  const navigate = useNavigate()

  const [searchParams] = useSearchParams()
  const focusReplyId = searchParams.get("focus")

  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => fetchThreadById(threadId),
    enabled: !!threadId,
  })



  if (isLoading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          Loading thread...
        </div>
      </PageWrapper>
    )
  }

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

  // const demoOPReply = {
  //   id: "op-reply",
  //   author: thread.author,
  //   content: "Important update: Please check syllabus PDF first.",
  //   createdAt: "2026-01-02T12:45",
  //   upvotes: 8,
  //   isPinned: true,
  //   replies: [],
  // }

  // const allReplies = [demoOPReply, ...replies].sort(
  //   (a, b) => (b.isPinned === true) - (a.isPinned === true)
  // )

  return (
    <PageWrapper>
      <div className="space-y-6 animate-in fade-in-50 duration-300 overflow-visible">
        <Breadcrumbs
          items={[
            { label: "Forum", href: "/forum" },
            thread.universityId && { label: thread.universityId },
            thread.courseId && { label: thread.courseId },
            thread.branchId && { label: thread.branchId },
            { label: thread.title },  // last item — no href, renders as plain text
          ].filter(Boolean)}
        />

        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={handleBack}
        >
          ← Back
        </Button>

        {/* Thread Card */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h1 className="text-xl sm:text-2xl font-bold">{thread.title}</h1>

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
              By <span className="font-medium">{thread.authorName}</span> •{" "}
              {new Date(thread.$createdAt).toLocaleDateString()}
            </p>

            <p className="text-sm sm:text-base">{thread.content}</p>
          </CardContent>
        </Card>

        {/* Replies Section */}
        <RepliesProvider threadId={threadId} pinnedReplyId={thread.pinnedReplyId ?? null}>
          <RepliesSection
            threadAuthor={thread.authorName}
            focusReplyId={focusReplyId}
          />
        </RepliesProvider>
      </div>
    </PageWrapper>
  )
}

export default ThreadDetail

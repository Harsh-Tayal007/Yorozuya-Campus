// =============================================================================
// TOP REPLY BOX - collapsed placeholder above the thread list (export for page use)

import { useMutation, useQueryClient } from "@tanstack/react-query"
import DesktopReplyBox from "./DesktopReplyBox"
import MobileReplyModal from "./MobileReplyModal"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/context/AuthContext"
import { useState } from "react"
import useComposeState from "@/hooks/useComposeState"

// =============================================================================
export default function TopReplyBox({ threadId, onSuccess }) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const composeState = useComposeState()

  const mutation = useMutation({
    mutationFn: createReply,
    onSuccess: () => {
      setOpen(false)
      onSuccess?.()
    },
  })

  const submit = (text, gif) => {
    if (!text.trim() && !gif) return

    mutation.mutate({
      threadId,
      content: text,
      gif,
      authorId: user.$id,
      authorName: user.username
    })
  }

  if (!open) return (
    <button
      onClick={() => setOpen(true)}
      className="w-full text-left rounded-xl border border-border bg-muted/10
                 px-4 py-3 text-sm text-muted-foreground/70
                 hover:border-primary/40 hover:bg-muted/20 transition-colors mb-4"
    >
      Write a reply…
    </button>
  )

  if (isMobile) return <MobileReplyModal onSubmit={submit} onClose={() => setOpen(false)} />

  return (
    <div className="mb-4">
      <DesktopReplyBox
        cs={composeState}
        onSubmit={submit}
        onCancel={() => setOpen(false)}
      />
    </div>
  )
}
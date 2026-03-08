// src/components/forum/RepliesProvider.jsx
import { createContext, useContext } from "react"
import { useReplies } from "@/hooks/useReplies"
import useAuthorRoles from "@/hooks/useAuthorRoles"

const RepliesContext = createContext(null)

export const RepliesProvider = ({ threadId, pinnedReplyId, children }) => {
  const repliesState = useReplies(threadId)

  // Single batch query for all author roles in this thread
  const authorRoles = useAuthorRoles(repliesState.replies)

  return (
    <RepliesContext.Provider value={{ ...repliesState, pinnedReplyId, authorRoles }}>
      {children}
    </RepliesContext.Provider>
  )
}

export const useRepliesContext = () => {
  const ctx = useContext(RepliesContext)
  if (!ctx) throw new Error("useRepliesContext must be used inside RepliesProvider")
  return ctx
}
import { createContext, useContext } from "react"
import { useReplies } from "@/hooks/useReplies"

const RepliesContext = createContext(null)

export const RepliesProvider = ({ threadId, pinnedReplyId, children }) => {
  const repliesState = useReplies(threadId)

  return (
    <RepliesContext.Provider value={{ ...repliesState, pinnedReplyId }}>
      {children}
    </RepliesContext.Provider>
  )
}

export const useRepliesContext = () => {
  const ctx = useContext(RepliesContext)

  if (!ctx) {
    throw new Error("useRepliesContext must be used inside RepliesProvider")
  }

  return ctx
}
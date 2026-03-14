import { createContext, useContext } from "react"
import { useReplies } from "@/hooks/useReplies"
import useAuthorRoles from "@/hooks/useAuthorRolesHook"
import useThreadVotes from "@/hooks/useThreadVotes"  // ← new

const RepliesContext = createContext(null)

export const RepliesProvider = ({ threadId, pinnedReplyId, children }) => {
  const repliesState = useReplies(threadId)
  const authorRoles  = useAuthorRoles(repliesState.replies)

  // ── Batch fetch all votes in ONE request ──────────────────────────────────
  const allReplyIds = Object.keys(repliesState.replies?.byId ?? {})
  const { votesMap, updateVote } = useThreadVotes(allReplyIds)  // ← new

  return (
    <RepliesContext.Provider value={{
      ...repliesState,
      pinnedReplyId,
      authorRoles,
      votesMap,    // ← new
      updateVote,  // ← new
    }}>
      {children}
    </RepliesContext.Provider>
  )
}

export const useRepliesContext = () => {
  const ctx = useContext(RepliesContext)
  if (!ctx) throw new Error("useRepliesContext must be used inside RepliesProvider")
  return ctx
}
// hooks/useThreadVotes.js
import { useState, useEffect } from "react"
import { databases, Query } from "@/lib/appwrite"
import { useAuth } from "@/context/AuthContext"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const VOTES_COL   = import.meta.env.VITE_APPWRITE_VOTES_COLLECTION_ID

export default function useThreadVotes(replyIds = []) {
  const { currentUser } = useAuth()
  const userId = currentUser?.$id
  const [votesMap, setVotesMap] = useState({})

  useEffect(() => {
    if (!userId || replyIds.length === 0) return
    let cancelled = false

    ;(async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, VOTES_COL, [
          Query.equal("userId", userId),
          Query.equal("replyId", replyIds),  // array = 1 request for all
          Query.limit(500),
        ])
        if (cancelled) return
        const map = {}
        for (const doc of res.documents) {
          map[doc.replyId] = { vote: doc.vote, voteDocId: doc.$id }
        }
        setVotesMap(map)
      } catch (err) {
        console.error("Failed to batch fetch votes:", err)
      }
    })()

    return () => { cancelled = true }
  }, [userId, replyIds.join(",")])

  const updateVote = (replyId, vote, voteDocId) => {
    setVotesMap(prev => ({ ...prev, [replyId]: { vote, voteDocId } }))
  }

  return { votesMap, updateVote }
}
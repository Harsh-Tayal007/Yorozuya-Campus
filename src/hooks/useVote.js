import { useState, useCallback, useEffect } from "react"
import { databases, ID, Query } from "@/lib/appwrite"
import { useAuth } from "@/context/AuthContext"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const REPLIES_COL = import.meta.env.VITE_APPWRITE_REPLIES_COLLECTION_ID
const VOTES_COL = import.meta.env.VITE_APPWRITE_VOTES_COLLECTION_ID

export default function useVote(initialScore = 0, replyId) {
  const { currentUser } = useAuth()
  const userId = currentUser?.$id

  const [vote, setVote]           = useState(null)  // "up" | "down" | null
  const [voteDocId, setVoteDocId] = useState(null)  // Appwrite $id of vote doc
  const [score, setScore]         = useState(initialScore)
  const [loading, setLoading]     = useState(false)

  // On mount: load this user's existing vote for this reply from Appwrite
  useEffect(() => {
    if (!replyId || !userId || replyId.startsWith("temp-")) return
    let cancelled = false

    ;(async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, VOTES_COL, [
          Query.equal("replyId", replyId),
          Query.equal("userId", userId),
          Query.limit(1),
        ])
        if (cancelled) return
        if (res.documents.length > 0) {
          setVote(res.documents[0].vote)
          setVoteDocId(res.documents[0].$id)
        }
      } catch (err) {
        console.error("Failed to fetch vote:", err)
      }
    })()

    return () => { cancelled = true }
  }, [replyId, userId])

  const handleVote = useCallback(async (type) => {
    if (!userId || loading) return

    let scoreDelta = 0
    let newVote    = null

    if (vote === type) {
      // Undo
      scoreDelta = type === "up" ? -1 : 1
      newVote    = null
    } else {
      // Switch or fresh
      if (vote === "up")   scoreDelta -= 1
      if (vote === "down") scoreDelta += 1
      scoreDelta += type === "up" ? 1 : -1
      newVote = type
    }

    const prevVote      = vote
    const prevScore     = score
    const prevVoteDocId = voteDocId

    // Optimistic update
    setVote(newVote)
    setScore(s => s + scoreDelta)
    setLoading(true)

    try {
      // 1. Persist new score to replies collection
      await databases.updateDocument(DATABASE_ID, REPLIES_COL, replyId, {
        upvotes: prevScore + scoreDelta,
      })

      // 2. Create / update / delete vote doc
      if (newVote === null) {
        // Undid vote → delete doc
        if (voteDocId) {
          await databases.deleteDocument(DATABASE_ID, VOTES_COL, voteDocId)
          setVoteDocId(null)
        }
      } else if (voteDocId) {
        // Switched vote → update existing doc
        await databases.updateDocument(DATABASE_ID, VOTES_COL, voteDocId, {
          vote: newVote,
        })
      } else {
        // Fresh vote → create new doc
        const doc = await databases.createDocument(
          DATABASE_ID, VOTES_COL, ID.unique(),
          { replyId, userId, vote: newVote }
        )
        setVoteDocId(doc.$id)
      }
    } catch (err) {
      console.error("Vote failed, rolling back:", err)
      setVote(prevVote)
      setScore(prevScore)
      setVoteDocId(prevVoteDocId)
    } finally {
      setLoading(false)
    }

  }, [vote, score, voteDocId, replyId, userId, loading])

  return { vote, score, handleVote, loading }
}
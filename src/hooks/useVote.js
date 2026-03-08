import { useState, useCallback, useEffect } from "react"
import { databases, ID, Query } from "@/lib/appwrite"
import { useAuth } from "@/context/AuthContext"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const REPLIES_COL = import.meta.env.VITE_APPWRITE_REPLIES_COLLECTION_ID
const VOTES_COL   = import.meta.env.VITE_APPWRITE_VOTES_COLLECTION_ID

export default function useVote(initialUpvotes = 0, initialDownvotes = 0, replyId) {
  const { currentUser } = useAuth()
  const userId = currentUser?.$id

  const [vote, setVote]             = useState(null)
  const [voteDocId, setVoteDocId]   = useState(null)
  const [upvotes, setUpvotes]       = useState(initialUpvotes)
  const [downvotes, setDownvotes]   = useState(initialDownvotes)
  const [loading, setLoading]       = useState(false)

  // Net score for display
  const score = upvotes - downvotes

  // On mount: load existing vote for this user+reply
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

    // ── Compute upvote/downvote deltas ──────────────────────────────────────
    let upDelta   = 0
    let downDelta = 0
    let newVote   = null

    if (vote === type) {
      // Undo existing vote
      if (type === "up")   upDelta   = -1
      if (type === "down") downDelta = -1
      newVote = null
    } else {
      // Undo previous vote first
      if (vote === "up")   upDelta   = -1
      if (vote === "down") downDelta = -1
      // Apply new vote
      if (type === "up")   upDelta   += 1
      if (type === "down") downDelta += 1
      newVote = type
    }

    const prevVote      = vote
    const prevUpvotes   = upvotes
    const prevDownvotes = downvotes
    const prevVoteDocId = voteDocId

    // Optimistic update
    setVote(newVote)
    setUpvotes(u => u + upDelta)
    setDownvotes(d => d + downDelta)
    setLoading(true)

    try {
      // 1. Update both upvotes + downvotes on the reply doc
      await databases.updateDocument(DATABASE_ID, REPLIES_COL, replyId, {
        upvotes:   prevUpvotes   + upDelta,
        downvotes: prevDownvotes + downDelta,
      })

      // 2. Create / update / delete vote doc
      if (newVote === null) {
        if (voteDocId) {
          await databases.deleteDocument(DATABASE_ID, VOTES_COL, voteDocId)
          setVoteDocId(null)
        }
      } else if (voteDocId) {
        await databases.updateDocument(DATABASE_ID, VOTES_COL, voteDocId, { vote: newVote })
      } else {
        const doc = await databases.createDocument(
          DATABASE_ID, VOTES_COL, ID.unique(),
          { replyId, userId, vote: newVote }
        )
        setVoteDocId(doc.$id)
      }
    } catch (err) {
      console.error("Vote failed, rolling back:", err)
      setVote(prevVote)
      setUpvotes(prevUpvotes)
      setDownvotes(prevDownvotes)
      setVoteDocId(prevVoteDocId)
    } finally {
      setLoading(false)
    }

  }, [vote, upvotes, downvotes, voteDocId, replyId, userId, loading])

  return { vote, score, upvotes, downvotes, handleVote, loading }
}
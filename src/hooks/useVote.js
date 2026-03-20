import { useState, useCallback, useEffect } from "react"
import { databases, ID, Query } from "@/lib/appwrite"
import { useAuth } from "@/context/AuthContext"
import { computeKarmaDelta, updateKarmaForVote } from "@/services/user/karmaService"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const REPLIES_COL = import.meta.env.VITE_APPWRITE_REPLIES_COLLECTION_ID
const VOTES_COL   = import.meta.env.VITE_APPWRITE_VOTES_COLLECTION_ID

export default function useVote(
  initialUpvotes = 0,
  initialDownvotes = 0,
  replyId,
  initialVote = null,
  initialVoteDocId = null,
  onVoteChange,
  authorId = null        // ← new: reply/thread author's userId for karma
) {
  const { currentUser } = useAuth()
  const userId = currentUser?.$id

  const [vote, setVote]           = useState(initialVote)
  const [voteDocId, setVoteDocId] = useState(initialVoteDocId)
  const [upvotes, setUpvotes]     = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [loading, setLoading]     = useState(false)

  const score = upvotes - downvotes

  useEffect(() => { setVote(initialVote) },           [initialVote])
  useEffect(() => { setVoteDocId(initialVoteDocId) }, [initialVoteDocId])

  const handleVote = useCallback(async (type) => {
    if (!userId || loading) return

    let upDelta   = 0
    let downDelta = 0
    let newVote   = null

    if (vote === type) {
      if (type === "up")   upDelta   = -1
      if (type === "down") downDelta = -1
      newVote = null
    } else {
      if (vote === "up")   upDelta   = -1
      if (vote === "down") downDelta = -1
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
      await databases.updateDocument(DATABASE_ID, REPLIES_COL, replyId, {
        upvotes:   prevUpvotes   + upDelta,
        downvotes: prevDownvotes + downDelta,
      })

      let updatedVoteDocId = voteDocId

      if (newVote === null) {
        if (voteDocId) {
          await databases.deleteDocument(DATABASE_ID, VOTES_COL, voteDocId)
          setVoteDocId(null)
          updatedVoteDocId = null
        }
      } else if (voteDocId) {
        await databases.updateDocument(DATABASE_ID, VOTES_COL, voteDocId, { vote: newVote })
      } else {
        const doc = await databases.createDocument(
          DATABASE_ID, VOTES_COL, ID.unique(),
          { replyId, userId, vote: newVote }
        )
        setVoteDocId(doc.$id)
        updatedVoteDocId = doc.$id
      }

      onVoteChange?.(replyId, newVote, updatedVoteDocId)

      // ── Karma update — fire and forget, never blocks UI ──────────────────
      // Skip if voting on own reply (no self-karma)
      if (authorId && authorId !== userId) {
        const karmaDelta = computeKarmaDelta(prevVote, newVote)
        updateKarmaForVote(authorId, karmaDelta)
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

  }, [vote, upvotes, downvotes, voteDocId, replyId, userId, loading, onVoteChange, authorId])

  return { vote, score, upvotes, downvotes, handleVote, loading }
}
// src/services/user/karmaService.js
// Handles karma updates for vote events.
// Called fire-and-forget after successful vote mutations.

import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID    = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

// Cache authorId → userDocId to avoid repeated listDocuments calls
const docIdCache = new Map()

const getUserDocId = async (authorId) => {
  if (docIdCache.has(authorId)) return docIdCache.get(authorId)

  const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
    Query.equal("userId", authorId),
    Query.limit(1),
    Query.select(["$id"]),
  ])

  const docId = res.documents[0]?.$id ?? null
  if (docId) docIdCache.set(authorId, docId)
  return docId
}

/**
 * Compute karma delta from vote transition.
 *
 * Rules:
 *   upvote cast       → +3
 *   upvote removed    → -3
 *   downvote cast     → -1
 *   downvote removed  → +1
 *   switch up→down    → -3 + (-1) = -4
 *   switch down→up    → +1 + 3   = +4
 */
export const computeKarmaDelta = (prevVote, newVote) => {
  let delta = 0

  // Undo previous vote effect
  if (prevVote === "up")   delta -= 3
  if (prevVote === "down") delta += 1

  // Apply new vote effect
  if (newVote === "up")   delta += 3
  if (newVote === "down") delta -= 1

  return delta
}

/**
 * Update karma for a reply/thread author after a vote.
 * Fire-and-forget — never throws, logs errors only.
 *
 * @param {string} authorId - userId of the reply/thread author
 * @param {number} delta    - karma change (positive or negative)
 */
export const updateKarmaForVote = async (authorId, delta) => {
  if (!authorId || delta === 0) return

  try {
    const docId = await getUserDocId(authorId)
    if (!docId) return

    const doc = await databases.getDocument(DATABASE_ID, USERS_TABLE_ID, docId)
    await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, docId, {
      karma: Math.max(0, (doc.karma ?? 0) + delta),
    })
  } catch (err) {
    // Best-effort — never block the vote UI
    console.error("Karma update failed:", err)
  }
}
// src/hooks/useThreadAuthors.js
// Batch fetches avatar + username for all thread authors in ONE request.
// Results are stored per-authorId in TanStack cache as ["user-avatar", authorId]
// so ThreadCard, ThreadDetail, and UserProfile all share the same cache entries.

import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_COL   = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

export default function useThreadAuthors(threads = []) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!threads.length) return

    // Collect all unique authorIds that aren't already cached
    const uncachedIds = [...new Set(
      threads.map(t => t.authorId).filter(Boolean)
    )].filter(id => {
      const cached = queryClient.getQueryData(["user-avatar", id])
      return cached === undefined // not yet fetched
    })

    if (uncachedIds.length === 0) return

    // Single batch request for all uncached authors
    ;(async () => {
      try {
        const res = await databases.listDocuments(DATABASE_ID, USERS_COL, [
          Query.equal("userId", uncachedIds),
          Query.limit(500),
          Query.select(["userId", "avatarUrl", "username"]),
        ])

        // Seed each author into the cache individually
        for (const doc of res.documents) {
          queryClient.setQueryData(["user-avatar", doc.userId], {
            avatarUrl: doc.avatarUrl ?? null,
            username:  doc.username  ?? null,
          })
        }

        // Authors not found in DB - cache null so we don't refetch them
        const foundIds = new Set(res.documents.map(d => d.userId))
        for (const id of uncachedIds) {
          if (!foundIds.has(id)) {
            queryClient.setQueryData(["user-avatar", id], null)
          }
        }
      } catch (err) {
        console.error("useThreadAuthors batch fetch failed:", err)
      }
    })()
  }, [threads, queryClient])
}
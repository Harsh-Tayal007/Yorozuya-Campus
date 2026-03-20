// src/hooks/useBookmarkStatus.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { getBookmarkDoc, bookmarkThread, unbookmarkThread } from "@/services/user/profileService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID    = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

const getAuthorDocId = async (authorId) => {
  if (!authorId) return null
  const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
    Query.equal("userId", authorId),
    Query.limit(1),
    Query.select(["$id"]),
  ])
  return res.documents[0]?.$id ?? null
}

export default function useBookmarkStatus(threadId, threadAuthorId) {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()

  const enabled = !!currentUser && !!threadId

  const { data: bookmarkDocId, isLoading } = useQuery({
    queryKey: ["bookmark-status", currentUser?.$id, threadId],
    queryFn:  () => getBookmarkDoc({ userId: currentUser.$id, threadId }),
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const isBookmarked = !!bookmarkDocId

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      const authorDocId = await getAuthorDocId(threadAuthorId)
      return bookmarkThread({
        userId: currentUser.$id,
        threadId,
        threadAuthorDocId: authorDocId,
      })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["bookmark-status", currentUser.$id, threadId] })
      queryClient.setQueryData(["bookmark-status", currentUser.$id, threadId], "optimistic")
      // Optimistically update bookmarkCount in threads cache
      queryClient.setQueryData(["threads"], (old = []) =>
        old.map(t => t.$id === threadId
          ? { ...t, bookmarkCount: (t.bookmarkCount ?? 0) + 1 }
          : t
        )
      )
      queryClient.setQueryData(["thread", threadId], (old) =>
        old ? { ...old, bookmarkCount: (old.bookmarkCount ?? 0) + 1 } : old
      )
    },
    onSuccess: (newBookmarkDocId) => {
      queryClient.setQueryData(["bookmark-status", currentUser.$id, threadId], newBookmarkDocId)
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmark-status", currentUser.$id, threadId] })
      queryClient.invalidateQueries({ queryKey: ["threads"] })
    },
  })

  const unbookmarkMutation = useMutation({
    mutationFn: async () => {
      const authorDocId = await getAuthorDocId(threadAuthorId)
      return unbookmarkThread({
        bookmarkDocId: bookmarkDocId,
        threadId,
        threadAuthorDocId: authorDocId,
      })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["bookmark-status", currentUser.$id, threadId] })
      queryClient.setQueryData(["bookmark-status", currentUser.$id, threadId], null)
      queryClient.setQueryData(["threads"], (old = []) =>
        old.map(t => t.$id === threadId
          ? { ...t, bookmarkCount: Math.max(0, (t.bookmarkCount ?? 1) - 1) }
          : t
        )
      )
      queryClient.setQueryData(["thread", threadId], (old) =>
        old ? { ...old, bookmarkCount: Math.max(0, (old.bookmarkCount ?? 1) - 1) } : old
      )
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmark-status", currentUser.$id, threadId] })
      queryClient.invalidateQueries({ queryKey: ["threads"] })
    },
  })

  const toggle = () => {
    if (isBookmarked) unbookmarkMutation.mutate()
    else bookmarkMutation.mutate()
  }

  return {
    isBookmarked,
    isLoading,
    isPending: bookmarkMutation.isPending || unbookmarkMutation.isPending,
    toggle,
  }
}
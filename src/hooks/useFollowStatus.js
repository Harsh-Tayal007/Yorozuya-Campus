// src/hooks/useFollowStatus.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { getFollowDoc, followUser, unfollowUser } from "@/services/user/profileService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID    = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

// Gets the Appwrite doc $id for a user by their userId field
const getUserDocId = async (userId) => {
  const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
    Query.equal("userId", userId),
    Query.limit(1),
    Query.select(["$id"]),
  ])
  return res.documents[0]?.$id ?? null
}

export default function useFollowStatus(targetUserId) {
  const { currentUser, userDocId } = useAuth()
  const queryClient = useQueryClient()

  const isOwnProfile = currentUser?.$id === targetUserId
  const enabled = !!currentUser && !!targetUserId && !isOwnProfile

  // Check if already following
  const { data: followDocId, isLoading } = useQuery({
    queryKey: ["follow-status", currentUser?.$id, targetUserId],
    queryFn:  () => getFollowDoc({
      followerId:  currentUser.$id,
      followingId: targetUserId,
    }),
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const isFollowing = !!followDocId

  // Follow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      const targetDocId = await getUserDocId(targetUserId)
      return followUser({
        followerId:    currentUser.$id,
        followingId:   targetUserId,
        followerDocId: userDocId,
        followingDocId: targetDocId,
      })
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["follow-status", currentUser.$id, targetUserId] })
      queryClient.setQueryData(
        ["follow-status", currentUser.$id, targetUserId],
        "optimistic" // temp value — replaced by actual $id on success
      )
      // Optimistically update profile follower count in cache
      queryClient.setQueryData(["profile-by-userid", targetUserId], (old) =>
        old ? { ...old, followerCount: (old.followerCount ?? 0) + 1 } : old
      )
    },
    onSuccess: (newFollowDocId) => {
      queryClient.setQueryData(
        ["follow-status", currentUser.$id, targetUserId],
        newFollowDocId
      )
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status", currentUser.$id, targetUserId] })
      queryClient.invalidateQueries({ queryKey: ["profile-by-userid", targetUserId] })
    },
  })

  // Unfollow mutation
  const unfollowMutation = useMutation({
    mutationFn: async () => {
      const targetDocId = await getUserDocId(targetUserId)
      return unfollowUser({
        followDocId:    followDocId,
        followerDocId:  userDocId,
        followingDocId: targetDocId,
      })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["follow-status", currentUser.$id, targetUserId] })
      queryClient.setQueryData(
        ["follow-status", currentUser.$id, targetUserId],
        null
      )
      queryClient.setQueryData(["profile-by-userid", targetUserId], (old) =>
        old ? { ...old, followerCount: Math.max(0, (old.followerCount ?? 1) - 1) } : old
      )
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status", currentUser.$id, targetUserId] })
      queryClient.invalidateQueries({ queryKey: ["profile-by-userid", targetUserId] })
    },
  })

  const toggle = () => {
    if (isFollowing) unfollowMutation.mutate()
    else followMutation.mutate()
  }

  return {
    isFollowing,
    isLoading,
    isPending: followMutation.isPending || unfollowMutation.isPending,
    toggle,
    isOwnProfile,
  }
}
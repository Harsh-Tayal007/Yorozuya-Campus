// src/hooks/useFollowStatus.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import { getFollowDoc, followUser, unfollowUser } from "@/services/user/profileService"
import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { createNotification } from "@/services/notification/notificationService"

const DATABASE_ID    = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

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

  const { data: followDocId, isLoading } = useQuery({
    queryKey: ["follow-status", currentUser?.$id, targetUserId],
    queryFn:  () => getFollowDoc({ followerId: currentUser.$id, followingId: targetUserId }),
    enabled,
    staleTime: 1000 * 60 * 5,
  })

  const isFollowing = !!followDocId

  const followMutation = useMutation({
    mutationFn: async () => {
      const targetDocId = await getUserDocId(targetUserId)
      return followUser({
        followerId:     currentUser.$id,
        followingId:    targetUserId,
        followerDocId:  userDocId,
        followingDocId: targetDocId,
      })
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["follow-status", currentUser.$id, targetUserId] })
      queryClient.setQueryData(["follow-status", currentUser.$id, targetUserId], "optimistic")
      queryClient.setQueryData(["profile-by-userid", targetUserId], (old) =>
        old ? { ...old, followerCount: (old.followerCount ?? 0) + 1 } : old
      )
    },
    onSuccess: (newFollowDocId) => {
      queryClient.setQueryData(["follow-status", currentUser.$id, targetUserId], newFollowDocId)

      // Fire follow notification with actorUsername so bell can link to profile
      createNotification({
        recipientId:  targetUserId,
        type:         "follow",
        actorId:      currentUser.$id,
        actorName:    currentUser.name ?? currentUser.username ?? "Someone",
        actorAvatar:  currentUser.avatarUrl  ?? null,
        actorUsername: currentUser.username  ?? null,   // ← profile link
        message:      "started following you.",
      }).catch(console.error)
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ["follow-status", currentUser.$id, targetUserId] })
      queryClient.invalidateQueries({ queryKey: ["profile-by-userid", targetUserId] })
    },
  })

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
      queryClient.setQueryData(["follow-status", currentUser.$id, targetUserId], null)
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
// src/hooks/useNotifications.js
import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth } from "@/context/AuthContext"
import client from "@/lib/appwrite"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/services/notification/notificationService"

const NOTIF_COL = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID

export default function useNotifications() {
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()
  const unsubRef = useRef(null)

  const userId = currentUser?.$id

  // ── Fetch notifications ────────────────────────────────────────────────────
  const {
    data: notifications = [],
    isLoading,
  } = useQuery({
    queryKey: ["notifications", userId],
    queryFn:  () => getNotifications(userId),
    enabled:  !!userId,
    staleTime: 1000 * 30,
  })

  // ── Unread count ───────────────────────────────────────────────────────────
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread", userId],
    queryFn:  () => getUnreadCount(userId),
    enabled:  !!userId,
    staleTime: 1000 * 30,
  })

  // ── Appwrite Realtime subscription ────────────────────────────────────────
  useEffect(() => {
    if (!userId) return

    // Subscribe to all changes on the notifications collection for this user
    const channel = `databases.${DATABASE_ID}.collections.${NOTIF_COL}.documents`

    unsubRef.current = client.subscribe(channel, (response) => {
      const { events, payload } = response

      // Only react to events targeted at this user
      if (payload?.recipientId !== userId) return

      const isCreate = events.some(e => e.includes(".create"))
      const isUpdate = events.some(e => e.includes(".update"))
      const isDelete = events.some(e => e.includes(".delete"))

      if (isCreate) {
        // Prepend new notification optimistically
        queryClient.setQueryData(["notifications", userId], (old = []) => [
          payload,
          ...old,
        ])
        queryClient.setQueryData(["notifications-unread", userId], (old = 0) =>
          payload.read ? old : old + 1
        )
      }

      if (isUpdate) {
        queryClient.setQueryData(["notifications", userId], (old = []) =>
          old.map(n => n.$id === payload.$id ? payload : n)
        )
        // Recount unread from updated list
        queryClient.invalidateQueries({ queryKey: ["notifications-unread", userId] })
      }

      if (isDelete) {
        queryClient.setQueryData(["notifications", userId], (old = []) =>
          old.filter(n => n.$id !== payload.$id)
        )
        queryClient.invalidateQueries({ queryKey: ["notifications-unread", userId] })
      }
    })

    return () => {
      unsubRef.current?.()
    }
  }, [userId, queryClient])

  // ── Mark one read ──────────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onMutate: async (notifId) => {
      queryClient.setQueryData(["notifications", userId], (old = []) =>
        old.map(n => n.$id === notifId ? { ...n, read: true } : n)
      )
      queryClient.setQueryData(["notifications-unread", userId], (old = 0) =>
        Math.max(0, old - 1)
      )
    },
  })

  // ── Mark all read ──────────────────────────────────────────────────────────
  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(userId),
    onMutate: () => {
      queryClient.setQueryData(["notifications", userId], (old = []) =>
        old.map(n => ({ ...n, read: true }))
      )
      queryClient.setQueryData(["notifications-unread", userId], 0)
    },
  })

  // ── Delete ─────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onMutate: async (notifId) => {
      const notif = notifications.find(n => n.$id === notifId)
      queryClient.setQueryData(["notifications", userId], (old = []) =>
        old.filter(n => n.$id !== notifId)
      )
      if (notif && !notif.read) {
        queryClient.setQueryData(["notifications-unread", userId], (old = 0) =>
          Math.max(0, old - 1)
        )
      }
    },
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead:    (id) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
    remove:      (id) => deleteMutation.mutate(id),
  }
}
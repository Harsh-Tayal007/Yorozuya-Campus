/**
 * useNotifications.js
 * Place at: src/hooks/useNotifications.js
 *
 * Uses sendViaWorker (CF Worker) for background push,
 * falls back to sendLocal for foreground / localhost.
 */

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import client from "@/lib/appwrite";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/services/notification/notificationService";
import { usePush } from "@/context/PushNotificationContext";

const NOTIF_COL   = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

const TYPE_VERB = {
  reply:   "replied to your post",
  mention: "mentioned you",
  follow:  "started following you",
};

export default function useNotifications() {
  const { currentUser }               = useAuth();
  const queryClient                   = useQueryClient();
  const unsubRef                      = useRef(null);
  const { sendLocal, sendViaWorker }  = usePush();

  const userId = currentUser?.$id;

  // ── Fetch notifications ───────────────────────────────────────────────────
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", userId],
    queryFn:  () => getNotifications(userId),
    enabled:  !!userId,
    staleTime: 1000 * 30,
  });

  // ── Unread count ──────────────────────────────────────────────────────────
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications-unread", userId],
    queryFn:  () => getUnreadCount(userId),
    enabled:  !!userId,
    staleTime: 1000 * 30,
  });

  // ── Realtime subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = `databases.${DATABASE_ID}.collections.${NOTIF_COL}.documents`;

    unsubRef.current = client.subscribe(channel, async (response) => {
      const { events, payload } = response;
      if (payload?.recipientId !== userId) return;

      const isCreate = events.some(e => e.includes(".create"));
      const isUpdate = events.some(e => e.includes(".update"));
      const isDelete = events.some(e => e.includes(".delete"));

      if (isCreate) {
        // Update cache
        queryClient.setQueryData(["notifications", userId], (old = []) => [payload, ...old]);
        queryClient.setQueryData(["notifications-unread", userId], (old = 0) =>
          payload.read ? old : old + 1
        );

        // ── Push notification ─────────────────────────────────────────────
        if (!payload.read) {
          const verb  = TYPE_VERB[payload.type] ?? "sent you a notification";
          const title = `${payload.actorName} ${verb}`;
          const body  = payload.replyContent
            ? payload.replyContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
            : "";

          let url = "/dashboard";
          if (payload.type === "follow" && payload.actorUsername) {
            url = `/profile/${payload.actorUsername}`;
          } else if (payload.threadId) {
            url = payload.replyId
              ? `/forum/${payload.threadId}#reply-${payload.replyId}`
              : `/forum/${payload.threadId}`;
          }

          const tag = `notif-${payload.$id}`;

          // Try background push via CF Worker first, fall back to in-app
          const sent = await sendViaWorker({ title, body, url, tag, type: payload.type });
          if (!sent) sendLocal({ title, body, url, tag });
        }
      }

      if (isUpdate) {
        queryClient.setQueryData(["notifications", userId], (old = []) =>
          old.map(n => n.$id === payload.$id ? payload : n)
        );
        queryClient.invalidateQueries({ queryKey: ["notifications-unread", userId] });
      }

      if (isDelete) {
        queryClient.setQueryData(["notifications", userId], (old = []) =>
          old.filter(n => n.$id !== payload.$id)
        );
        queryClient.invalidateQueries({ queryKey: ["notifications-unread", userId] });
      }
    });

    return () => { unsubRef.current?.(); };
  }, [userId, queryClient, sendLocal, sendViaWorker]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onMutate: async (notifId) => {
      queryClient.setQueryData(["notifications", userId], (old = []) =>
        old.map(n => n.$id === notifId ? { ...n, read: true } : n)
      );
      queryClient.setQueryData(["notifications-unread", userId], (old = 0) =>
        Math.max(0, old - 1)
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => markAllAsRead(userId),
    onMutate: () => {
      queryClient.setQueryData(["notifications", userId], (old = []) =>
        old.map(n => ({ ...n, read: true }))
      );
      queryClient.setQueryData(["notifications-unread", userId], 0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onMutate: async (notifId) => {
      const notif = notifications.find(n => n.$id === notifId);
      queryClient.setQueryData(["notifications", userId], (old = []) =>
        old.filter(n => n.$id !== notifId)
      );
      if (notif && !notif.read) {
        queryClient.setQueryData(["notifications-unread", userId], (old = 0) =>
          Math.max(0, old - 1)
        );
      }
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    markRead:    (id) => markReadMutation.mutate(id),
    markAllRead: () => markAllReadMutation.mutate(),
    remove:      (id) => deleteMutation.mutate(id),
  };
}
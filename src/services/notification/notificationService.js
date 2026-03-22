// src/services/notification/notificationService.js
import { databases, ID, Query } from "@/lib/appwrite"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const NOTIF_COL   = import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID
const USERS_COL   = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

export async function createNotification({
  recipientId,
  type,
  actorId,
  actorName,
  actorAvatar    = null,
  actorUsername  = null,   // ← for follow → navigate to their profile
  threadId       = null,
  replyId        = null,
  replyContent   = null,   // ← plain text preview shown in dropdown
  message,
}) {
  if (recipientId === actorId) return null

  return databases.createDocument(DATABASE_ID, NOTIF_COL, ID.unique(), {
    recipientId,
    type,
    actorId,
    actorName,
    actorAvatar,
    actorUsername,
    threadId,
    replyId,
    replyContent,
    message,
    read: false,
  })
}

export async function getNotifications(recipientId, { limit = 20, offset = 0 } = {}) {
  const res = await databases.listDocuments(DATABASE_ID, NOTIF_COL, [
    Query.equal("recipientId", recipientId),
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.offset(offset),
  ])
  return res.documents
}

export async function getUnreadCount(recipientId) {
  const res = await databases.listDocuments(DATABASE_ID, NOTIF_COL, [
    Query.equal("recipientId", recipientId),
    Query.equal("read", false),
    Query.limit(1),
  ])
  return res.total
}

export async function markAsRead(notifId) {
  return databases.updateDocument(DATABASE_ID, NOTIF_COL, notifId, { read: true })
}

export async function markAllAsRead(recipientId) {
  const unread = await databases.listDocuments(DATABASE_ID, NOTIF_COL, [
    Query.equal("recipientId", recipientId),
    Query.equal("read", false),
    Query.limit(100),
  ])
  return Promise.all(
    unread.documents.map(doc =>
      databases.updateDocument(DATABASE_ID, NOTIF_COL, doc.$id, { read: true })
    )
  )
}

export async function deleteNotification(notifId) {
  return databases.deleteDocument(DATABASE_ID, NOTIF_COL, notifId)
}

export async function getUserIdByUsername(username) {
  const res = await databases.listDocuments(DATABASE_ID, USERS_COL, [
    Query.equal("username", username),
    Query.limit(1),
    Query.select(["userId", "avatarUrl", "name", "username"]),
  ])
  return res.documents[0] ?? null
}
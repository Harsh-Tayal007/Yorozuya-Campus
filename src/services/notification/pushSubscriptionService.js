// src/services/pushSubscriptionService.js
import { databases, ID } from "@/lib/appwrite"
import { Query } from "appwrite"

const DB  = import.meta.env.VITE_APPWRITE_DATABASE_ID
const COL = import.meta.env.VITE_APPWRITE_PUSH_SUBSCRIPTIONS_COLLECTION_ID
const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(b64) {
  const padding = "=".repeat((4 - b64.length % 4) % 4)
  const base64  = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/")
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

export async function subscribeToPush(userId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return null

  const permission = await Notification.requestPermission()
  if (permission !== "granted") return null

  const reg = await navigator.serviceWorker.ready
  
  // Check if already subscribed
  const existing = await reg.pushManager.getSubscription()
  const sub = existing ?? await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
  })

  const { endpoint, keys: { p256dh, auth } } = sub.toJSON()

  // Avoid duplicate docs - check if this endpoint already stored
  const already = await databases.listDocuments(DB, COL, [
    Query.equal("endpoint", endpoint),
    Query.limit(1),
  ])
  if (already.total > 0) return sub  // already registered

  await databases.createDocument(DB, COL, ID.unique(), {
    userId, endpoint, p256dh, auth,
  })

  return sub
}

export async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator)) return
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  
  const { endpoint } = sub.toJSON()
  await sub.unsubscribe()

  // Remove from Appwrite
  const docs = await databases.listDocuments(DB, COL, [
    Query.equal("endpoint", endpoint),
    Query.limit(1),
  ])
  if (docs.total > 0)
    await databases.deleteDocument(DB, COL, docs.documents[0].$id)
}
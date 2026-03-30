// src/services/moderation/banService.js
import { databases, ID, Query } from "@/lib/appwrite"
import { createNotification } from "@/services/notification/notificationService"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const BANS_COL    = import.meta.env.VITE_APPWRITE_BANS_COLLECTION_ID
const USERS_COL   = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

/**
 * Issue a ban. Sends a "ban" notification to the target user.
 * @param {object} opts
 * @param {string} opts.userId           - Target user's Appwrite auth $id
 * @param {string} opts.username         - Target username (for display)
 * @param {string} opts.bannedBy         - Admin's auth $id
 * @param {string} opts.bannedByUsername - Admin's username
 * @param {string} opts.reason           - Reason shown to the user
 * @param {'temporary'|'permanent'} opts.banType
 * @param {string|null} opts.expiresAt   - ISO string, required if banType=temporary
 * @param {string|null} opts.reportId    - Linked report $id (optional)
 */
export async function banUser({
  userId,
  username,
  bannedBy,
  bannedByUsername,
  reason,
  banType,
  expiresAt = null,
  reportId  = null,
}) {
  // Deactivate any existing active ban first (idempotent)
  await liftBan({ userId, liftedBy: bannedBy, silent: true }).catch(() => {})

  const ban = await databases.createDocument(DATABASE_ID, BANS_COL, ID.unique(), {
    userId,
    username,
    bannedBy,
    bannedByUsername,
    reason,
    banType,
    expiresAt: banType === "temporary" ? expiresAt : null,
    isActive: true,
    liftedAt: null,
    liftedBy: null,
    reportId,
  })

  // Notify the banned user
  await createNotification({
    recipientId:  userId,
    type:         "ban",
    actorId:      bannedBy,
    actorName:    "Unizuya Team",
    actorUsername: bannedByUsername,
    message:
      banType === "permanent"
        ? `You have been permanently banned. Reason: ${reason}`
        : `You have been temporarily banned until ${new Date(expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}. Reason: ${reason}`,
  })

  return ban
}

/**
 * Lift (revoke) an active ban for a user.
 */
export async function liftBan({ userId, liftedBy, silent = false }) {
  const res = await databases.listDocuments(DATABASE_ID, BANS_COL, [
    Query.equal("userId", userId),
    Query.equal("isActive", true),
    Query.limit(5),
  ])

  await Promise.all(
    res.documents.map(doc =>
      databases.updateDocument(DATABASE_ID, BANS_COL, doc.$id, {
        isActive: false,
        liftedAt: new Date().toISOString(),
        liftedBy,
      })
    )
  )

  if (!silent && res.documents.length > 0) {
    // Notify user their ban was lifted
    await createNotification({
      recipientId:  userId,
      type:         "ban_lifted",
      actorId:      liftedBy,
      actorName:    "Unizuya Team",
      message:      "Your ban has been lifted. Welcome back!",
    })
  }
}

/**
 * Get the active ban for a user (null if not banned).
 * Also auto-expires temporary bans.
 */
export async function getActiveBan(userId) {
  const res = await databases.listDocuments(DATABASE_ID, BANS_COL, [
    Query.equal("userId", userId),
    Query.equal("isActive", true),
    Query.limit(1),
  ])

  const ban = res.documents[0] ?? null
  if (!ban) return null

  // Auto-expire temporary bans
  if (ban.banType === "temporary" && ban.expiresAt) {
    if (new Date(ban.expiresAt) <= new Date()) {
      await databases.updateDocument(DATABASE_ID, BANS_COL, ban.$id, {
        isActive: false,
        liftedAt: new Date().toISOString(),
        liftedBy: "system",
      })
      return null
    }
  }

  return ban
}

/**
 * List all bans (active + history) for the admin panel.
 */
export async function listBans({ activeOnly = false, limit = 50, offset = 0 } = {}) {
  const filters = []
  if (activeOnly) filters.push(Query.equal("isActive", true))

  const res = await databases.listDocuments(DATABASE_ID, BANS_COL, [
    ...filters,
    Query.orderDesc("$createdAt"),
    Query.limit(limit),
    Query.offset(offset),
  ])
  return { bans: res.documents, total: res.total }
}

/**
 * Get ban history for a specific user.
 */
export async function getUserBanHistory(userId) {
  const res = await databases.listDocuments(DATABASE_ID, BANS_COL, [
    Query.equal("userId", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(20),
  ])
  return res.documents
}
// src/services/admin/auditLogService.js
import { databases } from "@/lib/appwrite"
import { DATABASE_ID, ACTIVITIES_COLLECTION_ID } from "@/config/appwrite"

export async function createAuditLog({
  actorId,
  actorName,
  action,
  entityType,
  entityId,
  entityName,
}) {
  return await databases.createDocument(
    DATABASE_ID,
    ACTIVITIES_COLLECTION_ID,
    "unique()",
    { actorId, actorName, action, entityType, entityId, entityName }
  )
}

// ── Convenience helpers ───────────────────────────────────────────────────────

/** Called when an admin/mod removes someone's reply */
export async function logReplyDeleted({ actor, targetUsername, replyId, threadId }) {
  return createAuditLog({
    actorId:    actor.$id ?? actor.id,
    actorName:  actor.username ?? actor.name,
    action:     "deleted reply",
    entityType: "reply",
    entityId:   replyId,
    // entityName carries human-readable context shown in the activity feed
    entityName: `@${targetUsername} (thread: ${threadId})`,
  })
}

/** Called when an admin deletes a user account */
export async function logAccountDeleted({ actor, targetUserId, targetUsername }) {
  return createAuditLog({
    actorId:    actor.$id ?? actor.id,
    actorName:  actor.username ?? actor.name,
    action:     "deleted account",
    entityType: "user",
    entityId:   targetUserId,
    entityName: `@${targetUsername}`,
  })
}

/** Called when an admin changes a user's role */
export async function logRoleChanged({ actor, targetUsername, targetUserId, oldRole, newRole }) {
  return createAuditLog({
    actorId:    actor.$id ?? actor.id,
    actorName:  actor.username ?? actor.name,
    action:     "changed role",
    entityType: "user",
    entityId:   targetUserId,
    entityName: `@${targetUsername} (${oldRole} → ${newRole})`,
  })
}
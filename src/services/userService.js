import { DATABASE_ID, USERS_COLLECTION_ID } from "@/config/appwrite";
import { databases } from "@/lib/appwrite";
import { createAuditLog } from "./activityService";

export async function updateUserRole(targetUserId, role, actor, targetMeta) {
  if (actor.role !== "admin") {
    throw new Error("Forbidden");
  }

  // 🚨 Prevent self role change
  if (targetUserId === actor.$id) {
    throw new Error("You cannot change your own role");
  }

  await databases.updateDocument(
    DATABASE_ID,
    USERS_COLLECTION_ID,
    targetUserId,
    { role }
  );

  await createAuditLog({
    actorId: actor.$id,
    actorName: actor.username,
    action: "changed role",
    entityType: "user",
    entityId: targetUserId,
    entityName: `${targetMeta.username} (${targetMeta.oldRole} → ${role})`,
  });
}

export async function getUsers() {
  const res = await databases.listDocuments(DATABASE_ID, USERS_COLLECTION_ID);

  return res.documents;
}

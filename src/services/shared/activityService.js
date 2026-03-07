import { databases } from "@/lib/appwrite"
import {
  DATABASE_ID,
  ACTIVITIES_COLLECTION_ID,
} from "@/config/appwrite"

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
    {
      actorId,
      actorName,
      action,
      entityType,
      entityId,
      entityName,
    }
  )
}

import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { ACTIVITIES_COLLECTION_ID } from "@/config/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID;

/**
 * Create unit
 */
export const createUnit = async (data, currentUser) => {
  const unit = await databases.createDocument(
    DATABASE_ID,
    UNITS_COLLECTION_ID,
    ID.unique(),
    data
  );

  await logActivity({
    actor: currentUser,
    action: "created",
    entityType: "Unit",
    entityName: data.title,
  });

  return unit;
};

/**
 * Get units by subject
 */
export const getUnitsBySubject = async (subjectId) => {
  const res = await databases.listDocuments(DATABASE_ID, UNITS_COLLECTION_ID, [
    Query.equal("subjectId", subjectId),
    Query.orderAsc("order"),
  ]);

  return res.documents;
};

/**
 * Update unit
 */
export const updateUnit = async (unitId, data, currentUser) => {
  const updated = await databases.updateDocument(
    DATABASE_ID,
    UNITS_COLLECTION_ID,
    unitId,
    data
  );

  await logActivity({
    actor: currentUser,
    action: "edited",
    entityType: "Unit",
    entityName: updated.title,
  });

  return updated;
};

/**
 * Delete unit
 */
export const deleteUnit = async (unitId, currentUser, entityName) => {
  await databases.deleteDocument(
    DATABASE_ID,
    UNITS_COLLECTION_ID,
    unitId
  );

  await logActivity({
    actor: currentUser,
    action: "deleted",
    entityType: "Unit",
    entityName,
  });
};

/* ---------------- HELPER ---------------- */
const logActivity = async ({
  actor,
  action,
  entityType,
  entityName,
}) => {
  return databases.createDocument(
    DATABASE_ID,
    ACTIVITIES_COLLECTION_ID,
    ID.unique(),
    {
      actorId: actor.$id,
      actorName: actor.name,
      action,
      entityType,
      entityName,
    }
  );
};

import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { ACTIVITIES_COLLECTION_ID } from "@/config/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = "universities";

/**
 * Create University
 */
export const createUniversity = async (data, currentUser) => {
  const university = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_ID,
    ID.unique(),
    data,
  );

  // 🔔 ACTIVITY LOG
  await databases.createDocument(
    DATABASE_ID,
    ACTIVITIES_COLLECTION_ID,
    ID.unique(),
    {
      actorId: currentUser.$id,
      actorName: currentUser.name,
      action: "created",
      entityType: "University",
      entityName: data.name,
      details: "University added",
    },
  );

  return university;
};

/**
 * Get all Universities
 */
export const getUniversities = async () => {
  const res = await databases.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.orderDesc("$createdAt"),
  ]);
  return res.documents;
};

/**
 * Get University by ID
 */
export const getUniversityById = async (id) => {
  return await databases.getDocument(DATABASE_ID, COLLECTION_ID, id);
};

/**
 * Update University
 */
export const updateUniversity = async (id, data, currentUser) => {
  const updated = await databases.updateDocument(
    DATABASE_ID,
    COLLECTION_ID,
    id,
    data,
  );

  await logActivity({
    actor: currentUser,
    action: "edited",
    entityType: "University",
    entityName: updated.name,
  });

  return updated;
};

export const deleteUniversity = async (id, currentUser, entityName) => {
  await databases.deleteDocument(DATABASE_ID, COLLECTION_ID, id);

  await logActivity({
    actor: currentUser,
    action: "deleted",
    entityType: "University",
    entityName,
  });
};

/* ---------------- HELPER ---------------- */
const logActivity = async ({ actor, action, entityType, entityName }) => {
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
    },
  );
};

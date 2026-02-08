import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { ACTIVITIES_COLLECTION_ID } from "@/config/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PROGRAMS_COLLECTION_ID = "programs";

/**
 * Create program
 */
export const createProgram = async (data, currentUser) => {
  const program = await databases.createDocument(
    DATABASE_ID,
    PROGRAMS_COLLECTION_ID,
    ID.unique(),
    data,
  );

  await logActivity({
    actor: currentUser,
    action: "created",
    entityType: "Program",
    entityName: data.name,
  });

  return program;
};

/**
 * Get all programs
 */
export const getPrograms = async () => {
  const res = await databases.listDocuments(
    DATABASE_ID,
    PROGRAMS_COLLECTION_ID,
    [Query.orderDesc("$createdAt")],
  );
  return res.documents;
};

/**
 * Get program by ID
 */
export const getProgramById = async (programId) => {
  return databases.getDocument(DATABASE_ID, PROGRAMS_COLLECTION_ID, programId);
};

/**
 * Get programs by university
 */
export const getProgramsByUniversity = async (universityId) => {
  const res = await databases.listDocuments(
    DATABASE_ID,
    PROGRAMS_COLLECTION_ID,
    [Query.equal("universityId", universityId)],
  );
  return res.documents;
};

/**
 * Update program
 */
export const updateProgram = async (id, data, currentUser) => {
  const updated = await databases.updateDocument(
    DATABASE_ID,
    PROGRAMS_COLLECTION_ID,
    id,
    data,
  );

  await logActivity({
    actor: currentUser,
    action: "edited",
    entityType: "Program",
    entityName: updated.name,
  });

  return updated;
};

/**
 * Delete program
 */
export const deleteProgram = async (id, currentUser, entityName) => {
  await databases.deleteDocument(DATABASE_ID, PROGRAMS_COLLECTION_ID, id);

  await logActivity({
    actor: currentUser,
    action: "deleted",
    entityType: "Program",
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

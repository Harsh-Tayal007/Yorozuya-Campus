import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { ACTIVITIES_COLLECTION_ID } from "@/config/appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SYLLABUS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_SYLLABUS_COLLECTION_ID;

/**
 * Create syllabus
 */
export const createSyllabus = async (data, currentUser) => {
  const syllabus = await databases.createDocument(
    DATABASE_ID,
    SYLLABUS_COLLECTION_ID,
    ID.unique(),
    data,
  );

  // ✅ log only if user is provided
  if (currentUser) {
    await logActivity({
      actor: currentUser,
      action: "created",
      entityType: "Syllabus",
      entityName: data.title,
    });
  }

  return syllabus; // ❗ REQUIRED
};

/**
 * Get syllabus by program (READ-ONLY)
 */
export const getSyllabusByProgram = async (programId) => {
  const res = await databases.listDocuments(
    DATABASE_ID,
    SYLLABUS_COLLECTION_ID,
    [Query.equal("programId", programId)],
  );
  return res.documents;
};

/**
 * Get syllabus by ID (READ-ONLY)
 */
export const getSyllabusById = async (id) => {
  return await databases.getDocument(DATABASE_ID, SYLLABUS_COLLECTION_ID, id);
};

/**
 * Update syllabus
 */
export const updateSyllabus = async (id, data, currentUser) => {
  const updated = await databases.updateDocument(
    DATABASE_ID,
    SYLLABUS_COLLECTION_ID,
    id,
    data,
  );

  await logActivity({
    actor: currentUser,
    action: "edited",
    entityType: "Syllabus",
    entityName: updated.title,
  });

  return updated;
};

/**
 * Delete syllabus
 */
export const deleteSyllabus = async (id, currentUser, entityName) => {
  await databases.deleteDocument(DATABASE_ID, SYLLABUS_COLLECTION_ID, id);

  await logActivity({
    actor: currentUser,
    action: "deleted",
    entityType: "Syllabus",
    entityName,
  });
};

/* ---------------- ACTIVITY HELPER ---------------- */
export const logActivity = async ({
  actor,
  action,
  entityType,
  entityName,
}) => {
  if (!actor || !actor.$id) return; // ✅ HARD GUARD

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

/**
 * Get syllabus by Program + Branch + Semester (USER VIEW)
 */
export const getSyllabusByContext = async ({ programId, branch, semester }) => {
  const res = await databases.listDocuments(
    DATABASE_ID,
    SYLLABUS_COLLECTION_ID,
    [
      Query.equal("programId", programId),
      Query.equal("branch", branch),
      Query.equal("semester", semester),
    ],
  );

  // Expecting ONE syllabus per context
  return res.documents[0] || null;
};

// For PYQs service
export const getSyllabusIdsForPyqs = async ({ programId, semester }) => {
  const res = await databases.listDocuments(
    DATABASE_ID,
    SYLLABUS_COLLECTION_ID,
    [
      Query.equal("programId", programId),
      Query.equal("semester", Number(semester)), // 👈 FIX
      Query.limit(10),
    ],
  );

  return res.documents.map((doc) => doc.$id);
};

export async function getAvailableSyllabusSemesters({ programId, branch }) {
  if (!programId || !branch) return [];

  const res = await databases.listDocuments(
    DATABASE_ID,
    SYLLABUS_COLLECTION_ID,
    [Query.equal("programId", programId), Query.equal("branch", branch)],
  );

  // extract unique semesters
  const semesters = [...new Set(res.documents.map((doc) => doc.semester))];

  // sort numerically (important)
  return semesters.sort((a, b) => a - b);
}

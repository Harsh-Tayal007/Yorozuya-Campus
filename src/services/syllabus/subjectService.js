import { databases } from "@/lib/appwrite";
import { ID, Query } from "appwrite";
import { ACTIVITIES_COLLECTION_ID } from "@/config/appwrite";
import { uploadFile as adapterUpload, deleteFile as adapterDelete } from "@/services/shared/storageAdapter";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const SUBJECTS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_SUBJECTS_COLLECTION_ID;

// ---------------- SUBJECT CACHE ----------------
const subjectCache = new Map(); // key: subjectId, value: subject doc

/**
 * Create subject
 */
export const createSubject = async (data, currentUser) => {
  if (!data.pdfFileId) {
    throw new Error("pdfFileld is required to create a subject");
  }

  const subject = await databases.createDocument(
    DATABASE_ID,
    SUBJECTS_COLLECTION_ID,
    ID.unique(),
    {
      syllabusId: data.syllabusId,
      subjectName: data.subjectName,
      description: data.description || "",
      pdfFileId: data.pdfFileId, // 🔒 enforced
      storageProvider: data.storageProvider || "appwrite",
      views: data.views ?? 0,
      ratingAvg: data.ratingAvg ?? 0,
      ratingCount: data.ratingCount ?? 0,
      version: data.version ?? 1,
    },
  );

  if (currentUser) {
    await logActivity({
      actor: currentUser,
      action: "created",
      entityType: "Subject",
      entityName: data.subjectName,
    });
  }

  // 🔁 invalidate subject cache
  subjectCache.clear();

  return subject;
};

/**
 * Get subjects by syllabus
 */
export const getSubjectsBySyllabus = async (syllabusId) => {
  const res = await databases.listDocuments(
    DATABASE_ID,
    SUBJECTS_COLLECTION_ID,
    [Query.equal("syllabusId", syllabusId)],
  );

  return res.documents;
};

/**
 * Delete subject
 */
export const deleteSubject = async (id, currentUser) => {
  const subject = await databases.getDocument(DATABASE_ID, SUBJECTS_COLLECTION_ID, id);

  if (subject.pdfFileId) {
    try {
      await adapterDelete(
        subject.pdfFileId,
        subject.storageProvider,
        "syllabus",
        subject.bucketId,
      );
    } catch (err) {
      console.warn("Failed to delete subject storage file:", err);
    }
  }

  await databases.deleteDocument(DATABASE_ID, SUBJECTS_COLLECTION_ID, id);

  if (currentUser) {
    await logActivity({
      actor: currentUser,
      action: "deleted",
      entityType: "Subject",
      entityName: subject.subjectName,
    });
  }

  subjectCache.delete(id);
};

/* ---------------- ACTIVITY HELPER ---------------- */
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

export const updateSubjectPdf = async (subjectId, newFile) => {
  // 1. Upload new PDF via adapter
  const uploadResult = await adapterUpload(newFile, "syllabus");

  // 2. Get existing subject
  const existing = await databases.getDocument(
    DATABASE_ID,
    SUBJECTS_COLLECTION_ID,
    subjectId,
  );

  // 3. Delete old file (using old storageProvider)
  if (existing.pdfFileId) {
    try {
      await adapterDelete(
        existing.pdfFileId,
        existing.storageProvider,
        "syllabus",
      );
    } catch {
      // ignore — old file may already be gone
    }
  }

  subjectCache.delete(subjectId);

  return databases.updateDocument(
    DATABASE_ID,
    SUBJECTS_COLLECTION_ID,
    subjectId,
    {
      pdfFileId: uploadResult.fileId,
      storageProvider: uploadResult.storageProvider,
      version: (existing.version || 1) + 1,
    },
  );
};

// subjectService.js
export const getSubjectsBySyllabusIds = async (syllabusIds = []) => {
  if (!syllabusIds.length) return [];

  const res = await databases.listDocuments(
    DATABASE_ID,
    SUBJECTS_COLLECTION_ID,
    [Query.equal("syllabusId", syllabusIds)],
  );

  return res.documents;
};

async function getSubjectsBySemester({ programId, branch, semester }) {
  const res = await databases.listDocuments(DATABASE_ID, SUBJECTS_COLLECTION, [
    Query.equal("programId", programId),
    Query.equal("branch", branch),
    Query.equal("semester", Number(semester)),
    Query.orderAsc("subjectName"),
  ]);

  return res.documents;
}

export const getSubjectsByIds = async (subjectIds = []) => {
  if (!subjectIds.length) return [];

  const missingIds = subjectIds.filter((id) => !subjectCache.has(id));
  if (missingIds.length) {
    const res = await databases.listDocuments(
      DATABASE_ID,
      SUBJECTS_COLLECTION_ID,
      [Query.equal("$id", missingIds)],
    );
    res.documents.forEach((sub) => subjectCache.set(sub.$id, sub));
  }

  return subjectIds.map((id) => subjectCache.get(id)).filter(Boolean);
};

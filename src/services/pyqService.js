import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const PYQS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_PYQS_COLLECTION_ID;
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID;

// 🔥 Simple in-memory cache
const pyqSubjectCache = new Map();

/**
 * Get distinct semesters that have PYQs for a program
 */
export const getSemestersWithPyqs = async (programId) => {
  const res = await databases.listDocuments(DATABASE_ID, PYQS_COLLECTION_ID, [
    Query.equal("programId", programId),
    Query.limit(100), // safe for now
  ]);

  // extract unique semesters
  const semesterSet = new Set();
  res.documents.forEach((doc) => {
    if (doc.semester) {
      semesterSet.add(doc.semester);
    }
  });

  return Array.from(semesterSet).sort((a, b) => Number(a) - Number(b));
};

export const getSubjectIdsWithPyqs = async ({ programId, semester }) => {
  const res = await databases.listDocuments(DATABASE_ID, PYQS_COLLECTION_ID, [
    Query.equal("programId", programId),
    Query.equal("semester", semester),
    Query.limit(100),
  ]);

  const subjectIdSet = new Set();
  res.documents.forEach((doc) => {
    if (doc.subjectId) {
      subjectIdSet.add(doc.subjectId);
    }
  });

  return Array.from(subjectIdSet);
};

/**
 * Get PYQs for a specific subject (User View)
 * Flat list, sorted by latest upload
 */
export const getPyqsForSubject = async ({ programId, semester, subjectId }) => {
  const cacheKey = `${programId}_${semester}_${subjectId}`;

  if (pyqSubjectCache.has(cacheKey)) {
    return pyqSubjectCache.get(cacheKey);
  }

  const res = await databases.listDocuments(DATABASE_ID, PYQS_COLLECTION_ID, [
    Query.equal("programId", programId),
    Query.equal("semester", String(semester)),
    Query.equal("subjectId", subjectId),
    Query.orderDesc("$createdAt"),
  ]);

  const pyqs = res.documents;

  // 🔑 Collect unitIds
  const unitIds = [...new Set(pyqs.map((p) => p.unitId).filter(Boolean))];

  let unitMap = {};

  if (unitIds.length) {
    const unitsRes = await databases.listDocuments(
      DATABASE_ID,
      UNITS_COLLECTION_ID,
      [Query.equal("$id", unitIds)],
    );

    unitMap = Object.fromEntries(unitsRes.documents.map((u) => [u.$id, u]));
  }

  const resolvedPyqs = pyqs.map((pyq) => ({
    ...pyq,
    unit: pyq.unitId ? unitMap[pyq.unitId] : null,
  }));

  // 🔥 Enrich with file metadata (file size)
  const enrichedPyqs = await Promise.all(
    resolvedPyqs.map(async (pyq) => {
      try {
        const file = await storage.getFile(pyq.bucketId, pyq.fileId);
        return {
          ...pyq,
          fileSize: file.sizeOriginal,
        };
      } catch (err) {
        console.warn("Failed to fetch file meta", pyq.$id);
        return pyq;
      }
    }),
  );

  // ✅ Save to cache
  pyqSubjectCache.set(cacheKey, enrichedPyqs);

  return enrichedPyqs;
};

export async function getBranchesWithPyqs(programId) {
  const res = await databases.listDocuments(DATABASE_ID, PYQS_COLLECTION_ID, [
    Query.equal("programId", programId),
    Query.limit(100),
  ]);

  // Extract unique branch names
  const branchSet = new Set(res.documents.map((doc) => doc.branch));

  return Array.from(branchSet);
}

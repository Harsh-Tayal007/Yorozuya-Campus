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
  const normalizedSemester = String(semester);

  const res = await databases.listDocuments(DATABASE_ID, PYQS_COLLECTION_ID, [
    Query.equal("programId", programId),
    Query.equal("semester", normalizedSemester), // ✅ FIX
    Query.limit(100),
  ]);

  const subjectIdSet = new Set();
  res.documents.forEach((doc) => {
    if (doc.subjectId) subjectIdSet.add(doc.subjectId);
  });

  return Array.from(subjectIdSet);
};

/**
 * Get PYQs for a specific subject (User View)
 * Flat list, sorted by latest upload
 */
export const getPyqsForSubject = async ({ programId, semester, subjectId }) => {
  const normalizedSemester = Number(semester); // ✅ FIX 1
  const cacheKey = `${programId}_${Number(semester)}_${subjectId}`;

  if (pyqSubjectCache.has(cacheKey)) {
    return pyqSubjectCache.get(cacheKey);
  }

  // 1️⃣ Fetch PYQs
  const res = await databases.listDocuments(DATABASE_ID, PYQS_COLLECTION_ID, [
    Query.equal("programId", programId),
    Query.equal("semester", String(semester)),
    Query.equal("subjectId", subjectId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ]);

  const pyqs = res.documents;

  // 2️⃣ Resolve units
  const unitIds = [...new Set(pyqs.map((p) => p.unitId).filter(Boolean))];
  let unitMap = {};

  if (unitIds.length > 0) {
    const unitsRes = await databases.listDocuments(
      DATABASE_ID,
      UNITS_COLLECTION_ID,
      [
        Query.equal("$id", unitIds),
        Query.limit(unitIds.length), // ✅ SAFETY
      ],
    );

    unitMap = Object.fromEntries(unitsRes.documents.map((u) => [u.$id, u]));
  }

  // 3️⃣ Attach unit object
  const resolvedPyqs = pyqs.map((pyq) => ({
    ...pyq,
    unit: pyq.unitId ? (unitMap[pyq.unitId] ?? null) : null,
  }));

  // 4️⃣ Attach file metadata (non-blocking)
  const enrichedPyqs = await Promise.all(
    resolvedPyqs.map(async (pyq) => {
      if (!pyq.fileId || !pyq.bucketId) return pyq;

      try {
        const file = await storage.getFile(pyq.bucketId, pyq.fileId);
        return {
          ...pyq,
          fileSize: file.sizeOriginal,
        };
      } catch {
        return pyq; // ❗ don’t poison cache
      }
    }),
  );

  // 5️⃣ Cache only FINAL stable data
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


export const normalizeSemester = (s) =>
  s === undefined ? undefined : Number(s)

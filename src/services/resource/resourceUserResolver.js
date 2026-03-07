import { databases, storage } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const RESOURCES_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_RESOURCES_COLLECTION_ID;
const UNITS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_UNITS_COLLECTION_ID;
const RESOURCES_BUCKET_ID = import.meta.env.VITE_APPWRITE_STORAGE_BUCKET_ID;

export const getResolvedResourcesForSubject = async ({
  programId,
  semester,
  subjectId,
}) => {
  // ⛔ Hard guard (same philosophy as PYQs)
  if (!programId || !semester || !subjectId) {
    return [];
  }

  const normalizedSemester = String(semester);

  // 1️⃣ Fetch raw resources
  const res = await databases.listDocuments(
    DATABASE_ID,
    RESOURCES_COLLECTION_ID,
    [
      Query.equal("programId", programId),
      Query.equal("semester", normalizedSemester),
      Query.equal("subjectId", subjectId),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ],
  );

  const resources = res.documents;

  if (resources.length === 0) return [];

  // 2️⃣ Resolve units (optional)
  const unitIds = [...new Set(resources.map((r) => r.unitId).filter(Boolean))];

  let unitMap = {};

  if (unitIds.length > 0) {
    const unitsRes = await databases.listDocuments(
      DATABASE_ID,
      UNITS_COLLECTION_ID,
      [Query.equal("$id", unitIds), Query.limit(unitIds.length)],
    );

    unitMap = Object.fromEntries(
      unitsRes.documents.map((u) => [
        u.$id,
        {
          order: u.order,
          title: u.title,
        },
      ]),
    );
  }

  // 3️⃣ Attach unit object
  const resolvedResources = resources.map((resource) => ({
    ...resource,
    unit: resource.unitId ? (unitMap[resource.unitId] ?? null) : null,
  }));

  // 4️⃣ Attach file size (PDF only)
  const enrichedResources = await Promise.all(
    resolvedResources.map(async (resource) => {
      if (resource.type !== "pdf" || !resource.fileId) {
        return resource;
      }

      try {
        const file = await storage.getFile(
          RESOURCES_BUCKET_ID,
          resource.fileId,
        );

        return {
          ...resource,
          fileSize: file.sizeOriginal,
        };
      } catch {
        // ❗ never poison UI on metadata failure
        return resource;
      }
    }),
  );

  return enrichedResources;
};

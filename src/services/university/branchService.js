import { databases, ID } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const BRANCHES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_BRANCHES_COLLECTION_ID;

// ── Read ──────────────────────────────────────────────────────────────────────

export const getBranchesByProgram = async (programId) => {
  const response = await databases.listDocuments(
    DATABASE_ID,
    BRANCHES_COLLECTION_ID,
    [Query.equal("programId", programId), Query.orderAsc("name")]
  );
  return response.documents;
};

export const getBranchById = async (id) => {
  return await databases.getDocument(DATABASE_ID, BRANCHES_COLLECTION_ID, id);
};

export const getAllBranches = async () => {
  const response = await databases.listDocuments(
    DATABASE_ID,
    BRANCHES_COLLECTION_ID,
    [Query.orderAsc("name"), Query.limit(500)]
  );
  return response.documents;
};

// ── Write ─────────────────────────────────────────────────────────────────────

export const createBranch = async ({ name, programId, description = "" }) => {
  return await databases.createDocument(
    DATABASE_ID,
    BRANCHES_COLLECTION_ID,
    ID.unique(),
    { name: name.trim(), programId, description: description.trim() }
  );
};

export const updateBranch = async (branchId, { name, description = "" }) => {
  return await databases.updateDocument(
    DATABASE_ID,
    BRANCHES_COLLECTION_ID,
    branchId,
    { name: name.trim(), description: description.trim() }
  );
};

export const deleteBranch = async (branchId) => {
  return await databases.deleteDocument(
    DATABASE_ID,
    BRANCHES_COLLECTION_ID,
    branchId
  );
};
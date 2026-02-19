import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const BRANCHES_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_BRANCHES_COLLECTION_ID;

// 🔹 Get branches by program
export const getBranchesByProgram = async (programId) => {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      BRANCHES_COLLECTION_ID,
      [Query.equal("programId", programId)],
    );

    return response.documents;
  } catch (error) {
    console.error("Error fetching branches:", error);
    throw error;
  }
};

// get branches by id
export const getBranchById = async (id) => {
  return await databases.getDocument(DATABASE_ID, "branches", id);
};

import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";

const SYLLABUS_COLLECTION_ID = import.meta.env
  .VITE_APPWRITE_SYLLABUS_COLLECTION_ID;

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;

export async function getAvailableSyllabusSemesters({ programId, branch }) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    SYLLABUS_COLLECTION_ID,
    [Query.equal("programId", programId), 
    Query.equal("branch", branch)],
  );

  const semesters = new Set();

  res.documents.forEach((doc) => {
    if (doc.semester) {
      semesters.add(doc.semester);
    }
  });

  return Array.from(semesters).sort((a, b) => a - b);
}

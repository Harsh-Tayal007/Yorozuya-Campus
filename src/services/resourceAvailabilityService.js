import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const RESOURCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_RESOURCES_COLLECTION_ID

export async function getAvailableResourceSemesters({
  programId,
  branch,
}) {
  if (!programId || !branch) return []

  const res = await databases.listDocuments(
    DATABASE_ID,
    RESOURCES_COLLECTION_ID,
    [
      Query.equal("programId", programId),
      Query.equal("branch", branch),
    ]
  )

  // semesters are strings → normalize to numbers
  const semesters = [
    ...new Set(
      res.documents
        .map((doc) => Number(doc.semester))
        .filter(Boolean)
    ),
  ]

  return semesters.sort((a, b) => a - b)
}

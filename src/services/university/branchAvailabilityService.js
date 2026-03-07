import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const SYLLABUS_COLLECTION_ID = import.meta.env.VITE_APPWRITE_SYLLABUS_COLLECTION_ID
const RESOURCES_COLLECTION_ID = import.meta.env.VITE_APPWRITE_RESOURCES_COLLECTION_ID

export async function getAvailableBranchesForProgram(programId) {
  const [syllabusRes, resourcesRes] = await Promise.all([
    databases.listDocuments(DATABASE_ID, SYLLABUS_COLLECTION_ID, [
      Query.equal("programId", programId),
    ]),
    databases.listDocuments(DATABASE_ID, RESOURCES_COLLECTION_ID, [
      Query.equal("programId", programId),
    ]),
  ])

  const branches = new Set()

  syllabusRes.documents.forEach(doc => {
    if (doc.branch) branches.add(doc.branch)
  })

  resourcesRes.documents.forEach(doc => {
    if (doc.branch) branches.add(doc.branch)
  })

  return Array.from(branches)
}

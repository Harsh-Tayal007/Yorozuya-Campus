import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID       = import.meta.env.VITE_APPWRITE_DATABASE_ID
const UNIVERSITIES_COL  = import.meta.env.VITE_APPWRITE_UNIVERSITIES_COLLECTION_ID
const PROGRAMS_COL      = import.meta.env.VITE_APPWRITE_PROGRAMS_COLLECTION_ID
const BRANCHES_COL      = import.meta.env.VITE_APPWRITE_BRANCHES_COLLECTION_ID

// Fetch all universities (small list - no pagination needed)
export async function fetchUniversities() {
  const res = await databases.listDocuments(DATABASE_ID, UNIVERSITIES_COL, [
    Query.orderAsc("name"),
    Query.limit(100),
  ])
  return res.documents // [{ $id, name, country, city }]
}

// Fetch programs for a university
export async function fetchPrograms(universityId) {
  if (!universityId) return []
  const res = await databases.listDocuments(DATABASE_ID, PROGRAMS_COL, [
    Query.equal("universityId", universityId),
    Query.orderAsc("name"),
    Query.limit(100),
  ])
  return res.documents // [{ $id, name, slug, universityId, degreeType }]
}

// Fetch branches for a program
export async function fetchBranches(programId) {
  if (!programId) return []
  const res = await databases.listDocuments(DATABASE_ID, BRANCHES_COL, [
    Query.equal("programId", programId),
    Query.orderAsc("name"),
    Query.limit(100),
  ])
  return res.documents // [{ $id, name, programId }]
}
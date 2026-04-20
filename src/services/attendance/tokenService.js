import { databases, ID, Query } from "@/lib/appwrite"
import { DATABASE_ID, SESSION_TOKENS_COLLECTION_ID } from "@/config/appwrite"

// Generate a 6-digit token unique within this batch
function makeToken(existing = new Set()) {
  let t
  do { t = Math.floor(100000 + Math.random() * 900000).toString() }
  while (existing.has(t))
  return t
}

// Called by teacher when starting session - one token per enrolled student
export async function generateStudentTokens(sessionId, classId, enrollments) {
  const used = new Set()
  const docs = await Promise.all(
    enrollments.map(e => {
      const token = makeToken(used)
      used.add(token)
      return databases.createDocument(
        DATABASE_ID, SESSION_TOKENS_COLLECTION_ID, ID.unique(),
        { sessionId, classId, studentId: e.studentId, token, used: false }
      )
    })
  )
  return docs
}

// Student fetches their own token for this session
export async function getMyToken(sessionId, studentId) {
  const res = await databases.listDocuments(
    DATABASE_ID, SESSION_TOKENS_COLLECTION_ID,
    [Query.equal("sessionId", sessionId), Query.equal("studentId", studentId), Query.limit(1)]
  )
  return res.documents[0] ?? null
}

// Teacher fetches all tokens for a session (to show beside each student)
export async function getSessionTokens(sessionId) {
  const res = await databases.listDocuments(
    DATABASE_ID, SESSION_TOKENS_COLLECTION_ID,
    [Query.equal("sessionId", sessionId), Query.limit(500)]
  )
  return res.documents
}

// Mark a token as used after student marks attendance
export async function markTokenUsed(tokenDocId) {
  return databases.updateDocument(
    DATABASE_ID, SESSION_TOKENS_COLLECTION_ID, tokenDocId,
    { used: true }
  )
}

// Delete all tokens for a session when it closes
export async function deleteSessionTokens(sessionId) {
  const res = await databases.listDocuments(
    DATABASE_ID, SESSION_TOKENS_COLLECTION_ID,
    [Query.equal("sessionId", sessionId), Query.limit(500)]
  )
  await Promise.all(res.documents.map(d =>
    databases.deleteDocument(DATABASE_ID, SESSION_TOKENS_COLLECTION_ID, d.$id)
  ))
}
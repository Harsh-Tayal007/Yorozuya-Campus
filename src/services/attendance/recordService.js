import { databases, ID, Query } from "@/lib/appwrite"
import {
  DATABASE_ID,
  ATTENDANCE_RECORDS_COLLECTION_ID,
  SESSIONS_COLLECTION_ID,
} from "@/config/appwrite"
import { incrementPresentCount } from "./sessionService"
import { getMyToken, markTokenUsed } from "./tokenService"

// ── Records ───────────────────────────────────────────────────────────────────

export async function markAttendanceSelf({ session, studentId, rollNumber, token }) {
  if (!session.isActive) throw new Error("Session is no longer active")

  if (session.mode === "token") {
    // Find this student's assigned token doc
    const tokenDoc = await getMyToken(session.$id, studentId)
    if (!tokenDoc) throw new Error("No token assigned. Contact your teacher.")
    if (tokenDoc.used) throw new Error("Token already used.")
    if (tokenDoc.token !== token) throw new Error("Incorrect token.")
  }

  // Prevent duplicate
  const existing = await databases.listDocuments(
    DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID,
    [Query.equal("sessionId", session.$id), Query.equal("studentId", studentId)]
  )
  if (existing.documents.length > 0) throw new Error("Attendance already marked.")

  const record = await databases.createDocument(
    DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID, ID.unique(),
    {
      sessionId: session.$id,
      classId: session.classId,
      subjectName: session.subjectName,
      studentId,
      rollNumber,
      markedAt: new Date().toISOString(),
      markedBy: "self",
    }
  )

  // Mark token as used
  if (session.mode === "token") {
    const tokenDoc = await getMyToken(session.$id, studentId)
    if (tokenDoc) await markTokenUsed(tokenDoc.$id)
  }

  await incrementPresentCount(session.$id, session.presentCount)
  return record
}

export async function markAttendanceManual({ session, studentId, rollNumber, teacherId }) {
  // Prevent duplicate
  const existing = await databases.listDocuments(
    DATABASE_ID,
    ATTENDANCE_RECORDS_COLLECTION_ID,
    [
      Query.equal("sessionId", session.$id),
      Query.equal("studentId", studentId),
    ]
  )
  if (existing.documents.length > 0) throw new Error("Already marked")

  const record = await databases.createDocument(
    DATABASE_ID,
    ATTENDANCE_RECORDS_COLLECTION_ID,
    ID.unique(),
    {
      sessionId: session.$id,
      classId: session.classId,
      subjectName: session.subjectName,
      studentId,
      rollNumber,
      markedAt: new Date().toISOString(),
      markedBy: teacherId,
    }
  )

  await incrementPresentCount(session.$id, session.presentCount)

  return record
}

export async function getRecordsBySession(sessionId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    ATTENDANCE_RECORDS_COLLECTION_ID,
    [Query.equal("sessionId", sessionId), Query.orderAsc("rollNumber"), Query.limit(500)]
  )
  return res.documents
}

export async function getRecordsByStudent(studentId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    ATTENDANCE_RECORDS_COLLECTION_ID,
    [Query.equal("studentId", studentId), Query.orderDesc("markedAt"), Query.limit(500)]
  )
  return res.documents
}

export async function hasStudentMarked(sessionId, studentId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    ATTENDANCE_RECORDS_COLLECTION_ID,
    [
      Query.equal("sessionId", sessionId),
      Query.equal("studentId", studentId),
      Query.limit(1)
    ]
  )
  return res.documents.length > 0
}

// Teacher manually adds a record (absent → present edit)
export async function addRecordManually({ sessionId, classId, subjectName, studentId, rollNumber, teacherId }) {
  const existing = await databases.listDocuments(
    DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID,
    [Query.equal("sessionId", sessionId), Query.equal("studentId", studentId), Query.limit(1)]
  )
  if (existing.documents.length > 0) throw new Error("Already present")

  return databases.createDocument(
    DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID, ID.unique(),
    {
      sessionId,
      classId,
      subjectName,
      studentId,
      rollNumber,
      markedAt: new Date().toISOString(),
      markedBy: teacherId,
    }
  )
}

// Teacher manually removes a record (present → absent edit)
export async function removeRecord(recordId) {
  return databases.deleteDocument(DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID, recordId)
}
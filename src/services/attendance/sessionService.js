import {
  ATTENDANCE_RECORDS_COLLECTION_ID,
  CLASSES_COLLECTION_ID,
  databases,
  ID,
  Query,
} from "@/lib/appwrite";
import { DATABASE_ID, SESSIONS_COLLECTION_ID } from "@/config/appwrite";
import { getEnrollmentsByClass } from "./classService";
import { deleteSessionTokens, generateStudentTokens } from "./tokenService";
import { getRecordsBySession } from "./recordService";
import { createNotification } from "../notification/notificationService";

const TOKEN_VALIDITY_MS = 90 * 1000; // 90 seconds

function generateToken() {
  // 6-digit numeric token — easy to type on mobile
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function startSession({
  classId,
  subjectName,
  teacherId,
  mode = "token",
}) {
  // ── Guard: inactive class ─────────────────────────────────────────────────
  const cls = await databases.getDocument(
    DATABASE_ID,
    CLASSES_COLLECTION_ID,
    classId,
  );
  if (!cls.isActive) throw new Error("This class is inactive.");

  // ── Guard: no duplicate active session ────────────────────────────────────
  const active = await getActiveSessionByClass(classId);
  if (active)
    throw new Error(
      "An active session already exists for this class. Close it first.",
    );

  const now = new Date();
  const tokenExpiresAt = new Date(now.getTime() + 90 * 1000).toISOString();

  const session = await databases.createDocument(
    DATABASE_ID,
    SESSIONS_COLLECTION_ID,
    ID.unique(),
    {
      classId,
      subjectName,
      teacherId,
      token: "distributed",
      tokenExpiresAt,
      startTime: now.toISOString(),
      endTime: null,
      isActive: true,
      mode,
      presentCount: 0,
      suspended: false,
    },
  );

  // ── Fetch enrollments (needed for tokens + notifications) ─────────────────
  const enrollments = await getEnrollmentsByClass(classId);

  // ── Generate unique token per student (token mode only) ───────────────────
  if (mode === "token") {
    await generateStudentTokens(session.$id, classId, enrollments);
  }

  // ── Fire notifications in background — don't block session start ──────────
  Promise.allSettled(
    enrollments.map((e) =>
      createNotification({
        recipientId: e.studentId,
        type: "attendance",
        actorId: teacherId,
        actorName: cls.name, // class name as actor label — readable in notif
        message: `Attendance started for ${subjectName} in ${cls.name}`,
      }),
    ),
  );

  return session;
}

export async function refreshToken(sessionId) {
  const now = new Date();
  const tokenExpiresAt = new Date(
    now.getTime() + TOKEN_VALIDITY_MS,
  ).toISOString();
  const token = generateToken();

  return databases.updateDocument(
    DATABASE_ID,
    SESSIONS_COLLECTION_ID,
    sessionId,
    { token, tokenExpiresAt },
  );
}

export async function closeSession(sessionId, physicalCount) {
  await deleteSessionTokens(sessionId);
  return databases.updateDocument(
    DATABASE_ID,
    SESSIONS_COLLECTION_ID,
    sessionId,
    {
      isActive: false,
      suspended: false,
      endTime: new Date().toISOString(),
      presentCount: physicalCount, // override with teacher's physical count
    },
  );
}

export async function incrementPresentCount(sessionId, currentCount) {
  return databases.updateDocument(
    DATABASE_ID,
    SESSIONS_COLLECTION_ID,
    sessionId,
    { presentCount: currentCount + 1 },
  );
}

export async function getActiveSessionByClass(classId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    SESSIONS_COLLECTION_ID,
    [
      Query.equal("classId", classId),
      Query.equal("isActive", true),
      Query.limit(500),
    ],
  );
  return res.documents[0] ?? null;
}

export async function getSessionsByClass(classId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    SESSIONS_COLLECTION_ID,
    [
      Query.equal("classId", classId),
      Query.orderDesc("$createdAt"),
      Query.limit(500),
    ],
  );
  return res.documents;
}

export async function getActiveSessionsForStudent(enrolledClassIds) {
  if (enrolledClassIds.length === 0) return [];
  const results = await Promise.all(
    enrolledClassIds.map((classId) =>
      databases.listDocuments(DATABASE_ID, SESSIONS_COLLECTION_ID, [
        Query.equal("classId", classId),
        Query.equal("isActive", true),
      ]),
    ),
  );
  return results.flatMap((r) => r.documents);
}

export async function suspendSession(sessionId) {
  await deleteSessionTokens(sessionId);
  return databases.updateDocument(
    DATABASE_ID,
    SESSIONS_COLLECTION_ID,
    sessionId,
    { isActive: false, suspended: true, endTime: new Date().toISOString() },
  );
}

export async function deleteSession(sessionId) {
  // 1. Delete all attendance records for this session
  const records = await getRecordsBySession(sessionId);
  await Promise.all(
    records.map((r) =>
      databases.deleteDocument(
        DATABASE_ID,
        ATTENDANCE_RECORDS_COLLECTION_ID,
        r.$id,
      ),
    ),
  );

  // 2. Delete session tokens (reuse existing helper)
  await deleteSessionTokens(sessionId);

  // 3. Delete the session doc itself
  await databases.deleteDocument(
    DATABASE_ID,
    SESSIONS_COLLECTION_ID,
    sessionId,
  );
}

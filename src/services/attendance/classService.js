import { databases, ID, Query } from "@/lib/appwrite";
import {
  DATABASE_ID,
  CLASSES_COLLECTION_ID,
  ENROLLMENTS_COLLECTION_ID,
  SESSIONS_COLLECTION_ID,
  ATTENDANCE_RECORDS_COLLECTION_ID,
  SESSION_TOKENS_COLLECTION_ID,
} from "@/config/appwrite";

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// ── Classes ───────────────────────────────────────────────────────────────────

export async function createClass({
  name,
  branch,
  semester,
  subjects,
  totalStrength,
  teacherId,
}) {
  const inviteCode = generateInviteCode();

  return databases.createDocument(
    DATABASE_ID,
    CLASSES_COLLECTION_ID,
    ID.unique(),
    {
      name,
      branch,
      semester,
      subjects, // string[]
      teacherIds: [teacherId],
      inviteCode,
      totalStrength,
      createdBy: teacherId,
      isActive: true,
    },
  );
}

export async function getAllClasses() {
  const res = await databases.listDocuments(
    DATABASE_ID,
    CLASSES_COLLECTION_ID,
    [Query.orderDesc("$createdAt")],
  );
  return res.documents;
}

export async function getClassesByTeacher(teacherId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    CLASSES_COLLECTION_ID,
    [Query.contains("teacherIds", teacherId), Query.orderDesc("$createdAt")],
  );
  return res.documents;
}

export async function getClassByInviteCode(inviteCode) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    CLASSES_COLLECTION_ID,
    [Query.equal("inviteCode", inviteCode)],
  );
  if (res.documents.length === 0) throw new Error("Invalid invite code");
  return res.documents[0];
}

export async function toggleClassActive(classId, isActive) {
  return databases.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId, {
    isActive,
  });
}

export async function deleteClass(classId) {
  return databases.deleteDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId);
}

// ── Enrollments ───────────────────────────────────────────────────────────────

export async function enrollStudent({
  classId,
  studentId,
  studentName,
  rollNumber,
  isLeet,
}) {
  // Prevent duplicate enrollment
  const existing = await databases.listDocuments(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    [Query.equal("classId", classId), Query.equal("studentId", studentId)],
  );
  if (existing.documents.length > 0)
    throw new Error("Already enrolled in this class");

  // Prevent duplicate roll number in same class
  const dupRoll = await databases.listDocuments(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    [Query.equal("classId", classId), Query.equal("rollNumber", rollNumber)],
  );
  if (dupRoll.documents.length > 0)
    throw new Error("Roll number already taken in this class");

  // add after the duplicate roll number check, before createDocument:
  const cls = await databases.getDocument(
    DATABASE_ID,
    CLASSES_COLLECTION_ID,
    classId,
  );
  if (!cls.isActive)
    throw new Error("This class is no longer accepting enrollments.");

  // replace the createDocument call inside enrollStudent
  return databases.createDocument(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    ID.unique(),
    {
      classId,
      studentId,
      studentName,
      rollNumber,
      isLeet: isLeet ?? false,
      status: "active",
      joinedAt: new Date().toISOString(),
    },
  );
}

export async function getEnrollmentsByClass(classId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    [
      Query.equal("classId", classId),
      Query.equal("status", "active"),
      Query.limit(500),
    ],
  );
  return res.documents;
}

export async function getEnrollmentsByStudent(studentId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    [
      Query.equal("studentId", studentId),
      Query.equal("status", "active"),
      Query.limit(500),
    ],
  );
  return res.documents;
}

export async function getEnrollment(classId, studentId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    [Query.equal("classId", classId), Query.equal("studentId", studentId)],
  );
  return res.documents[0] ?? null;
}

export async function removeStudent(enrollmentId) {
  return databases.updateDocument(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    enrollmentId,
    { status: "removed" },
  );
}

export async function updateClass(classId, updates, teacherId) {
  const cls = await databases.getDocument(
    DATABASE_ID,
    CLASSES_COLLECTION_ID,
    classId,
  );
  if (!cls.teacherIds.includes(teacherId)) {
    throw new Error("You are not authorized to edit this class.");
  }
  return databases.updateDocument(
    DATABASE_ID,
    CLASSES_COLLECTION_ID,
    classId,
    updates,
  );
}

export async function deleteClassAndAllData(classId, teacherId) {
  const cls = await databases.getDocument(
    DATABASE_ID,
    CLASSES_COLLECTION_ID,
    classId,
  );
  if (!cls.teacherIds.includes(teacherId)) {
    throw new Error("You are not authorized to delete this class.");
  }

  const enrollRes = await databases.listDocuments(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    [Query.equal("classId", classId), Query.limit(500)],
  );
  await Promise.all(
    enrollRes.documents.map((e) =>
      databases.deleteDocument(DATABASE_ID, ENROLLMENTS_COLLECTION_ID, e.$id),
    ),
  );

  const sessionRes = await databases.listDocuments(
    DATABASE_ID,
    SESSIONS_COLLECTION_ID,
    [Query.equal("classId", classId), Query.limit(500)],
  );

  await Promise.all(
    sessionRes.documents.map(async (s) => {
      const [records, tokens] = await Promise.all([
        databases.listDocuments(DATABASE_ID, ATTENDANCE_RECORDS_COLLECTION_ID, [
          Query.equal("sessionId", s.$id),
          Query.limit(500),
        ]),
        databases.listDocuments(DATABASE_ID, SESSION_TOKENS_COLLECTION_ID, [
          Query.equal("sessionId", s.$id),
          Query.limit(500),
        ]),
      ]);
      await Promise.all([
        ...records.documents.map((r) =>
          databases.deleteDocument(
            DATABASE_ID,
            ATTENDANCE_RECORDS_COLLECTION_ID,
            r.$id,
          ),
        ),
        ...tokens.documents.map((t) =>
          databases.deleteDocument(
            DATABASE_ID,
            SESSION_TOKENS_COLLECTION_ID,
            t.$id,
          ),
        ),
        databases.deleteDocument(DATABASE_ID, SESSIONS_COLLECTION_ID, s.$id),
      ]);
    }),
  );

  await databases.deleteDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId);
}

export async function updateClassTeachers(classId, teacherIds) {
  return databases.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, classId, {
    teacherIds,
  });
}

export async function getRemovedStudents(classId) {
  const res = await databases.listDocuments(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    [
      Query.equal("classId", classId),
      Query.equal("status", "removed"),
      Query.limit(500),
    ]
  )
  return res.documents
}

export async function reEnrollStudent(enrollmentId) {
  return databases.updateDocument(
    DATABASE_ID,
    ENROLLMENTS_COLLECTION_ID,
    enrollmentId,
    { status: "active" }
  )
}
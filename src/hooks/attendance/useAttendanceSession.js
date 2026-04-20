import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  startSession,
  closeSession,
  refreshToken,
  getActiveSessionByClass,
  getSessionsByClass,
  getActiveSessionsForStudent,
  suspendSession,
} from "@/services/attendance/sessionService";
import {
  markAttendanceSelf,
  markAttendanceManual,
  getRecordsBySession,
  hasStudentMarked,
  addRecordManually,
  removeRecord,
  getRecordsByStudent,
} from "@/services/attendance/recordService";
import { useAuth } from "@/context/AuthContext";
import {
  getMyToken,
  getSessionTokens,
} from "@/services/attendance/tokenService";
import { useEffect } from "react";
import client, {
  ATTENDANCE_RECORDS_COLLECTION_ID,
  SESSIONS_COLLECTION_ID,
} from "@/lib/appwrite";
import { DATABASE_ID } from "@/config/appwrite";

export function useActiveSession(classId) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!classId) return;
    const unsub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${SESSIONS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.payload.classId === classId) {
          qc.invalidateQueries({ queryKey: ["session", "active", classId] });
        }
      },
    );
    return unsub;
  }, [classId]);

  return useQuery({
    queryKey: ["session", "active", classId],
    queryFn: () => getActiveSessionByClass(classId),
    enabled: !!classId,
    staleTime: 0,
    // refetchInterval removed - Realtime handles updates
  });
}

export function useSessionHistory(classId) {
  return useQuery({
    queryKey: ["sessions", classId],
    queryFn: () => getSessionsByClass(classId),
    enabled: !!classId,
    staleTime: 1000 * 60,
  });
}

export function useStartSession(classId) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ subjectName, mode }) =>
      startSession({ classId, subjectName, teacherId: user.$id, mode }),
    onSuccess: () => {
      toast.success("Session started");
      qc.invalidateQueries({ queryKey: ["session", "active", classId] });
      qc.invalidateQueries({ queryKey: ["sessions", classId] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useCloseSession(classId) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, physicalCount }) =>
      closeSession(sessionId, physicalCount, user.$id),
    onSuccess: () => {
      toast.success("Session closed");
      qc.invalidateQueries({ queryKey: ["session", "active", classId] });
      qc.invalidateQueries({ queryKey: ["sessions", classId] });
      qc.invalidateQueries({ queryKey: ["all-records", classId] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useRefreshToken(classId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => refreshToken(sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["session", "active", classId] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useSessionRecords(sessionId) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;
    const unsub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${ATTENDANCE_RECORDS_COLLECTION_ID}.documents`,
      (response) => {
        if (response.payload.sessionId === sessionId) {
          qc.invalidateQueries({ queryKey: ["records", sessionId] });
          // Also refresh the active session so presentCount updates
          qc.invalidateQueries({
            queryKey: ["session", "active", response.payload.classId],
          });
        }
      },
    );
    return unsub;
  }, [sessionId]);

  return useQuery({
    queryKey: ["records", sessionId],
    queryFn: () => getRecordsBySession(sessionId),
    enabled: !!sessionId,
    staleTime: 0,
    // refetchInterval removed
  });
}

export function useMarkAttendance(session) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ token, rollNumber }) =>
      markAttendanceSelf({ session, studentId: user.$id, rollNumber, token }),
    onSuccess: () => {
      toast.success("Attendance marked!");
      qc.invalidateQueries({ queryKey: ["records", session.$id] });
      qc.invalidateQueries({ queryKey: ["student-sessions"] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useManualMark(session, classId) {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, rollNumber }) =>
      markAttendanceManual({
        session,
        studentId,
        rollNumber,
        teacherId: user.$id,
      }),
    onSuccess: () => {
      toast.success("Marked present");
      qc.invalidateQueries({ queryKey: ["records", session.$id] });
      qc.invalidateQueries({ queryKey: ["session", "active", classId] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useStudentActiveSessions(enrolledClassIds) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enrolledClassIds?.length) return;
    const unsub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${SESSIONS_COLLECTION_ID}.documents`,
      (response) => {
        if (enrolledClassIds.includes(response.payload.classId)) {
          qc.invalidateQueries({
            queryKey: ["student-sessions", enrolledClassIds],
          });
        }
      },
    );
    return unsub;
  }, [JSON.stringify(enrolledClassIds)]);

  return useQuery({
    queryKey: ["student-sessions", enrolledClassIds],
    queryFn: () => getActiveSessionsForStudent(enrolledClassIds),
    enabled: enrolledClassIds?.length > 0,
    staleTime: 0,
    // refetchInterval removed
  });
}

// Student: poll for their assigned token
export function useMySessionToken(sessionId, studentId) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!sessionId) return;
    const unsub = client.subscribe(
      `databases.${DATABASE_ID}.collections.${import.meta.env.VITE_APPWRITE_SESSION_TOKENS_COLLECTION_ID}.documents`,
      (response) => {
        if (
          response.payload.sessionId === sessionId &&
          response.payload.studentId === studentId
        ) {
          qc.invalidateQueries({
            queryKey: ["my-token", sessionId, studentId],
          });
        }
      },
    );
    return unsub;
  }, [sessionId, studentId]);

  return useQuery({
    queryKey: ["my-token", sessionId, studentId],
    queryFn: () => getMyToken(sessionId, studentId),
    enabled: !!sessionId && !!studentId,
    staleTime: 0,
    // refetchInterval removed
  });
}

// Teacher: all tokens for a session (to show beside student names)
export function useSessionTokens(sessionId) {
  return useQuery({
    queryKey: ["session-tokens", sessionId],
    queryFn: () => getSessionTokens(sessionId),
    enabled: !!sessionId,
    refetchInterval: 8000,
    staleTime: 0,
  });
}

export function useSuspendSession(classId) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId) => suspendSession(sessionId, user.$id),
    onSuccess: () => {
      toast.success("Session suspended - no column in report");
      qc.invalidateQueries({ queryKey: ["session", "active", classId] });
      qc.invalidateQueries({ queryKey: ["sessions", classId] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useAddRecord(sessionId, classId) {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ subjectName, studentId, rollNumber }) =>
      addRecordManually({
        sessionId,
        classId,
        subjectName,
        studentId,
        rollNumber,
        teacherId: user.$id,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-records", classId] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useRemoveRecord(classId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (recordId) => removeRecord(recordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-records", classId] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useStudentHistory(studentId, enrollments) {
  // Fetch all records for this student
  const { data: myRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["student-history-records", studentId],
    queryFn: () => getRecordsByStudent(studentId),
    enabled: !!studentId,
    staleTime: 1000 * 60,
  });

  // Fetch all closed sessions for each enrolled class
  const classIds = enrollments.map((e) => e.classId);

  const { data: allSessionsFlat = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["student-history-sessions", classIds],
    queryFn: async () => {
      const results = await Promise.all(
        classIds.map((id) => getSessionsByClass(id)),
      );
      return results.flat();
    },
    enabled: classIds.length > 0,
    staleTime: 1000 * 60,
  });

  // Only closed, non-suspended sessions
  const closedSessions = allSessionsFlat.filter(
    (s) => !s.isActive && !s.suspended,
  );

  // Set of sessionIds where student was present
  const presentSessionIds = new Set(myRecords.map((r) => r.sessionId));

  // Group by classId
  const byClass = {};
  for (const enrollment of enrollments) {
    const cid = enrollment.classId;
    const classSessions = closedSessions
      .filter((s) => s.classId === cid)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    // Per-subject aggregate
    const subjectMap = {};
    for (const s of classSessions) {
      if (!subjectMap[s.subjectName]) {
        subjectMap[s.subjectName] = { total: 0, present: 0 };
      }
      subjectMap[s.subjectName].total++;
      if (presentSessionIds.has(s.$id)) {
        subjectMap[s.subjectName].present++;
      }
    }

    // new - filter sessions by joinedAt before counting
    const joinedAt = new Date(enrollment.joinedAt);
    const eligibleSessions = classSessions.filter(
      (s) => new Date(s.startTime) >= joinedAt,
    );

    // Rebuild subjectMap using only eligible sessions
    const eligibleSubjectMap = {};
    for (const s of eligibleSessions) {
      if (!eligibleSubjectMap[s.subjectName]) {
        eligibleSubjectMap[s.subjectName] = { total: 0, present: 0 };
      }
      eligibleSubjectMap[s.subjectName].total++;
      if (presentSessionIds.has(s.$id)) {
        eligibleSubjectMap[s.subjectName].present++;
      }
    }

    byClass[cid] = {
      enrollment,
      sessions: eligibleSessions,
      subjectMap: eligibleSubjectMap,
      totalSessions: eligibleSessions.length,
      totalPresent: eligibleSessions.filter((s) => presentSessionIds.has(s.$id))
        .length,
    };
  }

  return {
    byClass,
    presentSessionIds,
    isLoading: recordsLoading || sessionsLoading,
  };
}

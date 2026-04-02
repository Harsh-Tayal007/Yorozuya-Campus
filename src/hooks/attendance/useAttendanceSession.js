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
} from "@/services/attendance/recordService";
import { useAuth } from "@/context/AuthContext";
import { getMyToken, getSessionTokens } from "@/services/attendance/tokenService";

export function useActiveSession(classId) {
  return useQuery({
    queryKey: ["session", "active", classId],
    queryFn: () => getActiveSessionByClass(classId),
    enabled: !!classId,
    refetchInterval: 10000, // poll every 10s for live token updates
    staleTime: 0,
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ sessionId, physicalCount }) => closeSession(sessionId, physicalCount),
    onSuccess: () => {
      toast.success("Session closed")
      qc.invalidateQueries({ queryKey: ["session", "active", classId] })
      qc.invalidateQueries({ queryKey: ["sessions", classId] })
      qc.invalidateQueries({ queryKey: ["all-records", classId] })
    },
    onError: (err) => toast.error(err.message),
  })
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
  return useQuery({
    queryKey: ["records", sessionId],
    queryFn: () => getRecordsBySession(sessionId),
    enabled: !!sessionId,
    refetchInterval: 8000,
    staleTime: 0,
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
  return useQuery({
    queryKey: ["student-sessions", enrolledClassIds],
    queryFn: () => getActiveSessionsForStudent(enrolledClassIds),
    enabled: enrolledClassIds?.length > 0,
    refetchInterval: 15000,
    staleTime: 0,
  });
}

// Student: poll for their assigned token
export function useMySessionToken(sessionId, studentId) {
  return useQuery({
    queryKey: ["my-token", sessionId, studentId],
    queryFn: () => getMyToken(sessionId, studentId),
    enabled: !!sessionId && !!studentId,
    refetchInterval: 5000,
    staleTime: 0,
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
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (sessionId) => suspendSession(sessionId),
    onSuccess: () => {
      toast.success("Session suspended — no column in report")
      qc.invalidateQueries({ queryKey: ["session", "active", classId] })
      qc.invalidateQueries({ queryKey: ["sessions", classId] })
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useAddRecord(sessionId, classId) {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ subjectName, studentId, rollNumber }) =>
      addRecordManually({
        sessionId, classId, subjectName,
        studentId, rollNumber, teacherId: user.$id
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-records", classId] })
    },
    onError: (err) => toast.error(err.message),
  })
}

export function useRemoveRecord(classId) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (recordId) => removeRecord(recordId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-records", classId] })
    },
    onError: (err) => toast.error(err.message),
  })
}
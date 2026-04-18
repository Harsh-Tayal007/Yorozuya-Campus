import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createClass,
  getAllClasses,
  getClassesByTeacher,
  getClassByInviteCode,
  getEnrollmentsByClass,
  getEnrollmentsByStudent,
  enrollStudent,
  removeStudent,
  toggleClassActive,
  deleteClass,
  getEnrollment,
  updateClass,
  deleteClassAndAllData,
  updateClassTeachers,
  reEnrollStudent,
  getRemovedStudents,
  hardDeleteStudent,
} from "@/services/attendance/classService";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/config/permissions";
import { ROLE_PERMISSIONS } from "@/config/permissions";

export function useClasses() {
  const { user, role } = useAuth();

  const isTeacherOrAdmin = ROLE_PERMISSIONS[role]?.includes(
    PERMISSIONS.MANAGE_CLASSES,
  );

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["classes", role, user?.$id],
    queryFn: () =>
      isTeacherOrAdmin && role !== "teacher"
        ? getAllClasses()
        : getClassesByTeacher(user.$id),
    enabled: !!user && isTeacherOrAdmin,
    staleTime: 0,
  });

  return { classes, isLoading };
}

export function useStudentClasses() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ["enrollments", "student", user?.$id],
    queryFn: () => getEnrollmentsByStudent(user.$id),
    enabled: !!user,
    staleTime: 1000 * 60,
  });

  const joinClass = useMutation({
    mutationFn: ({ inviteCode, studentName, rollNumber, isLeet }) =>
      getClassByInviteCode(inviteCode).then((cls) =>
        enrollStudent({
          classId: cls.$id,
          studentId: user.$id,
          studentName,
          rollNumber,
          isLeet: isLeet ?? false,
        }),
      ),
    onSuccess: () => {
      toast.success("Joined class successfully");
      qc.invalidateQueries({ queryKey: ["enrollments", "student", user.$id] });
    },
    onError: (err) => toast.error(err.message),
  });

  return { enrollments, isLoading, joinClass };
}

export function useClassRoster(classId) {
  return useQuery({
    queryKey: ["enrollments", "class", classId],
    queryFn: () => getEnrollmentsByClass(classId),
    enabled: !!classId,
    staleTime: 1000 * 30,
  });
}

export function useCreateClass() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data) => createClass({ ...data, teacherId: user.$id }),
    onSuccess: () => {
      toast.success("Class created");
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useRemoveStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, classId }) =>
      removeStudent(enrollmentId).then(() => classId),
    onSuccess: (classId) => {
      toast.success("Student removed");
      qc.invalidateQueries({ queryKey: ["enrollments", "class", classId] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useUpdateClass() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, updates }) =>
      updateClass(classId, updates, user.$id),
    onSuccess: () => {
      toast.success("Class updated");
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useDeleteClass() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (classId) => deleteClassAndAllData(classId, user.$id),
    onSuccess: () => {
      toast.success("Class and all associated data deleted");
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err) => toast.error(err.message),
  });
}
export function useUpdateClassTeachers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, teacherIds }) =>
      updateClassTeachers(classId, teacherIds),
    onSuccess: () => {
      toast.success("Teachers updated");
      qc.invalidateQueries({ queryKey: ["classes"] });
      qc.invalidateQueries({ queryKey: ["classes-all"] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useRemovedStudents(classId) {
  return useQuery({
    queryKey: ["enrollments", "class", classId, "removed"],
    queryFn: () => getRemovedStudents(classId),
    enabled: !!classId,
    staleTime: 1000 * 30,
  });
}

export function useReEnrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, classId }) =>
      reEnrollStudent(enrollmentId).then(() => classId),
    onSuccess: (classId) => {
      toast.success("Student re-enrolled");
      qc.invalidateQueries({ queryKey: ["enrollments", "class", classId] });
      qc.invalidateQueries({
        queryKey: ["enrollments", "class", classId, "removed"],
      });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useLeaveClass() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId }) => removeStudent(enrollmentId),
    onSuccess: () => {
      toast.success("Left class");
      qc.invalidateQueries({ queryKey: ["enrollments", "student", user.$id] });
      qc.invalidateQueries({ queryKey: ["student-history-records"] });
      qc.invalidateQueries({ queryKey: ["student-history-sessions"] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useToggleClassActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, isActive }) => toggleClassActive(classId, isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["classes-all"] });
      qc.invalidateQueries({ queryKey: ["classes"] });
    },
    onError: (err) => toast.error(err.message),
  });
}

export function useHardDeleteStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ enrollmentId, classId, studentId }) =>
      hardDeleteStudent(enrollmentId, classId, studentId),
    onSuccess: (_, { classId }) => {
      toast.success("Student records permanently deleted");
      qc.invalidateQueries({ queryKey: ["enrollments", "class", classId] });
      qc.invalidateQueries({ queryKey: ["enrollments", "class", classId, "removed"] });
      qc.invalidateQueries({ queryKey: ["all-records", classId] });
      qc.invalidateQueries({ queryKey: ["classes-all"] }); 
    },
    onError: (err) => toast.error(err.message),
  });
}

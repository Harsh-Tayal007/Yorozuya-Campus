import { useAuth } from "@/context/AuthContext"
import { PERMISSIONS, ROLE_PERMISSIONS } from "@/config/permissions"
import TeacherAttendance from "./TeacherAttendance"
import StudentAttendance from "./StudentAttendance"

export default function AttendancePage() {
  const { role } = useAuth()
  const isTeacher = ROLE_PERMISSIONS[role]?.includes(PERMISSIONS.MANAGE_CLASSES)

  return isTeacher ? <TeacherAttendance /> : <StudentAttendance />
}
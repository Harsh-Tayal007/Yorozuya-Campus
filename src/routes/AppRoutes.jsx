import { lazy, Suspense } from "react"
import { Routes, Route, Navigate } from "react-router-dom"

/* ─── Layouts (always needed, not lazy) ─── */
import PublicLayout from "@/layouts/PublicLayout"
import UserLayout from "@/layouts/UserLayout"
import AdminLayout from "@/layouts/AdminLayout"
import DashboardLayout from "@/layouts/DashboardLayout"

/* ─── Auth guards (always needed, not lazy) ─── */
import PublicRoute from "./PublicRoute"
import ProtectedRoute from "./ProtectedRoute"
import RequireAuth from "@/components/auth/RequireAuth"
import RequirePermissionRoute from "@/components/auth/RequirePermissionRoute"
import RequireAcademicProfile from "@/components/auth/RequireAcademicProfile"
import { PERMISSIONS } from "@/config/permissions"

/* ─── Critical public pages (eagerly loaded — above the fold) ─── */
import Home from "../pages/Home"

/* ─── Page title manager ─── */
import { PageTitleManager } from "@/components"

/* ══════════════════════════════════════════════
   LAZY IMPORTS
   Every chunk below is loaded only when the
   user navigates to that route.
   ══════════════════════════════════════════════ */

/* Public */
const About               = lazy(() => import("../pages/About"))
const Contact             = lazy(() => import("../pages/Contact"))
const Universities        = lazy(() => import("../pages/universities/Universities"))
const UniversityDetail    = lazy(() => import("../pages/universities/UniversityDetail"))
const Forum               = lazy(() => import("../pages/forum/Forum"))
const ThreadDetail        = lazy(() => import("../pages/forum/ThreadDetail"))
const UserProfile         = lazy(() => import("@/pages/profile/UserProfile"))
const UpdatesPage         = lazy(() => import("@/pages/updates/UpdatesPage"))
const ResourcesUserView   = lazy(() => import("@/pages/resources/ResourcesUserView"))
const SyllabusUserView    = lazy(() => import("../pages/admin/syllabus/SyllabusUserView"))
const PyqUserView         = lazy(() => import("@/pages/pyqs/PyqUserView"))
const PyqSemesterSubjects = lazy(() => import("@/pages/pyqs/PyqSemesterSubjects"))
const PyqSubjectList      = lazy(() => import("@/pages/pyqs/PyqSubjectList"))
const ProgramDetail       = lazy(() => import("@/pages/programs/ProgramDetail"))
const ProgramSyllabus     = lazy(() => import("@/pages/programs/ProgramSyllabus"))
const BranchDetail        = lazy(() => import("@/pages/branches/BranchDetail"))
const BranchSyllabus      = lazy(() => import("@/pages/branches/BranchSyllabus"))
const PrivacyPolicy       = lazy(() => import("@/pages/auth/PrivacyPolicy"))

/* Auth */
const Login           = lazy(() => import("@/pages/auth/Login"))
const Signup          = lazy(() => import("@/pages/auth/Signup"))
const OAuthCallback   = lazy(() => import("@/pages/auth/OAuthCallback"))
const ForgotPassword  = lazy(() => import("@/pages/auth/ForgotPassword"))
const ResetPassword   = lazy(() => import("@/pages/auth/ResetPassword"))
const VerifyEmail     = lazy(() => import("@/pages/auth/VerifyEmail"))

/* Dashboard / user */
const CompleteProfile         = lazy(() => import("@/pages/dashboard/CompleteProfile"))
const Dashboard               = lazy(() => import("@/pages/dashboard/Dashboard"))
const DashboardSettings       = lazy(() => import("@/pages/dashboard/DashboardSettings"))
const UniversityNoticesPage   = lazy(() => import("@/pages/dashboard/UniversityNoticesPage"))
const NotificationsPage       = lazy(() => import("@/pages/dashboard/NotificationsPage"))
const DashboardSyllabus       = lazy(() => import("@/components/dashboard/DashboardSyllabus"))
const DashboardSemesterSyllabus = lazy(() => import("@/components/dashboard/DashboardSemesterSyllabus"))
const DashboardResources      = lazy(() => import("@/components/dashboard/DashboardResources"))
const DashboardPyqs           = lazy(() => import("@/components/dashboard/DashboardPyqs"))
const DashboardPyqSemester    = lazy(() => import("@/components/dashboard/DashboardPyqSemester"))
const DashboardPyqSubject     = lazy(() => import("@/components/dashboard/DashboardPyqSubject"))

/* Tools */
const CGPACalculator    = lazy(() => import("@/pages/tools/CGPACalculator"))
const TaskTracker       = lazy(() => import("@/pages/tools/TaskTracker"))
const TimetableBuilder  = lazy(() => import("@/pages/tools/TimetableBuilder"))

/* Attendance */
const AttendancePage        = lazy(() => import("@/pages/attendance/AttendancePage"))
const ClassAttendanceReport = lazy(() => import("@/pages/attendance/ClassAttendanceReport"))

/* Errors */
const NotFound      = lazy(() => import("../pages/errors/NotFound"))
const Unauthorized  = lazy(() => import("../pages/errors/Unauthorized"))

/* Admin — heaviest chunk, loaded only for admins */
const AdminDashboard        = lazy(() => import("../pages/dashboard/AdminDashboard"))
const AdminActivity         = lazy(() => import("@/pages/dashboard/AdminActivity"))
const AdminStats            = lazy(() => import("@/pages/admin/stats/AdminStats"))
const AdminModeration       = lazy(() => import("@/pages/admin/moderation/AdminModeration"))
const AdminUpdates          = lazy(() => import("@/pages/admin/updates/AdminUpdates"))
const AdminAttendance       = lazy(() => import("@/pages/admin/attendance/AdminAttendance"))
const AdminContactMessages  = lazy(() => import("@/pages/admin/contact/AdminContactMessages"))
const Programs              = lazy(() => import("@/pages/admin/Programs"))
const UniversityPrograms    = lazy(() => import("@/pages/admin/UniversityPrograms"))
const ResourcesUpload       = lazy(() => import("@/pages/admin/resources/ResourcesUpload"))
const PyqUpload             = lazy(() => import("@/pages/admin/pyq/PyqUpload"))
const AdminPyqsPage         = lazy(() => import("@/pages/admin/pyq/AdminPyqsPage"))
const UnitsAdmin            = lazy(() => import("@/pages/admin/units/Units"))
const SyllabusAdmin         = lazy(() => import("@/pages/admin/syllabus/syllabus"))
const UserRolesAdmin        = lazy(() => import("@/pages/admin/roles/userRolesAdmin"))
const BranchesAdmin         = lazy(() => import("@/pages/branches/BranchesAdmin"))
// Universities already imported above (shared between public + admin)

/* ══════════════════════════════════════════════
   FALLBACK COMPONENTS
   ══════════════════════════════════════════════ */

/**
 * Minimal CSS-only spinner — zero JS overhead, no extra dependency.
 * Replace with your design-system skeleton if you have one.
 */
const PageSpinner = () => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
  }}>
    <div style={{
      width: 36,
      height: 36,
      border: "3px solid #e5e7eb",
      borderTop: "3px solid #6366f1",
      borderRadius: "50%",
      animation: "spin 0.7s linear infinite",
    }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
)

/* ══════════════════════════════════════════════
   ROUTE TREE
   ══════════════════════════════════════════════ */

const AppRoutes = () => (
  <>
    <PageTitleManager />
    <Suspense fallback={<PageSpinner />}>
      <Routes>

        {/* ─── 🌍 Public routes ─── */}
        <Route element={<PublicLayout />}>
          {/* Home is eager — it's the landing page / LCP target */}
          <Route path="/"         element={<Home />} />
          <Route path="/about"    element={<About />} />
          <Route path="/contact"  element={<Contact />} />
          <Route path="/forum"    element={<Forum />} />
          <Route path="/forum/:threadId" element={<ThreadDetail />} />
          <Route path="/universities"            element={<Universities />} />
          <Route path="/profile/:username"       element={<UserProfile />} />
          <Route path="/university/:universityId" element={<UniversityDetail />} />
          <Route path="/updates"  element={<UpdatesPage />} />
          <Route path="/privacy"  element={<PrivacyPolicy />} />

          {/* Programs / branches */}
          <Route path="/programs/:programId"                                                                        element={<ProgramDetail />} />
          <Route path="/programs/:programId/syllabus"                                                              element={<ProgramSyllabus />} />
          <Route path="/programs/:programId/branches/:branchName"                                                  element={<BranchDetail />} />
          <Route path="/programs/:programId/branches/:branchName/syllabus"                                        element={<BranchSyllabus />} />
          <Route path="/programs/:programId/branches/:branchName/syllabus/semester/:semester"                     element={<SyllabusUserView />} />

          {/* Resources */}
          <Route path="/programs/:programId/branches/:branchName/resources"                                       element={<ResourcesUserView />} />
          <Route path="/programs/:programId/branches/:branchName/resources/semester/:semester"                    element={<ResourcesUserView />} />
          <Route path="/programs/:programId/branches/:branchName/resources/semester/:semester/subject/:subjectId" element={<ResourcesUserView />} />
          <Route path="/programs/:programId/branches/:branchName/resources/semester/:semester/subject/:subjectId/unit/:unitId" element={<ResourcesUserView />} />

          {/* PYQs */}
          <Route path="/programs/:programId/branches/:branchName/pyqs"                                            element={<PyqUserView />} />
          <Route path="/programs/:programId/branches/:branchName/pyqs/semester/:semester"                         element={<PyqSemesterSubjects />} />
          <Route path="/programs/:programId/branches/:branchName/pyqs/semester/:semester/subject/:subjectId"      element={<PyqSubjectList />} />

          {/* Misc public */}
          <Route path="/syllabus/:syllabusId" element={<SyllabusUserView />} />
          <Route path="/resources"            element={<ResourcesUserView />} />
          <Route path="/forgot-password"      element={<ForgotPassword />} />
          <Route path="/reset-password"       element={<ResetPassword />} />
          <Route path="/verify-email"         element={<VerifyEmail />} />
        </Route>

        {/* ─── Auth routes ─── */}
        <Route path="/login"          element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup"         element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* ─── 🔒 Authenticated user routes ─── */}
        <Route element={<ProtectedRoute />}>
          <Route path="/complete-profile" element={<CompleteProfile />} />

          <Route element={<RequireAcademicProfile />}>
            <Route element={<UserLayout />}>

              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="settings"      element={<DashboardSettings />} />
                <Route path="notices"       element={<UniversityNoticesPage />} />
                <Route path="cgpa"          element={<CGPACalculator />} />
                <Route path="tasks"         element={<TaskTracker />} />
                <Route path="timetable"     element={<TimetableBuilder />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="attendance"    element={<AttendancePage />} />
                <Route path="attendance/class/:classId" element={
                  <RequirePermissionRoute permission={PERMISSIONS.MANAGE_CLASSES}>
                    <ClassAttendanceReport />
                  </RequirePermissionRoute>
                } />

                <Route path="syllabus">
                  <Route index    element={<DashboardSyllabus />} />
                  <Route path="semester/:semester" element={<DashboardSemesterSyllabus />} />
                </Route>

                <Route path="resources">
                  <Route index    element={<DashboardResources />} />
                  <Route path="semester/:semester"                               element={<DashboardResources />} />
                  <Route path="semester/:semester/subject/:subjectId"            element={<DashboardResources />} />
                  <Route path="semester/:semester/subject/:subjectId/unit/:unitId" element={<DashboardResources />} />
                </Route>

                <Route path="pyqs">
                  <Route index    element={<DashboardPyqs />} />
                  <Route path="semester/:semester"                        element={<DashboardPyqSemester />} />
                  <Route path="semester/:semester/subject/:subjectId"     element={<DashboardPyqSubject />} />
                </Route>
              </Route>

            </Route>
          </Route>
        </Route>

        {/* ─── 🔐 Admin-only routes ─── */}
        <Route path="/admin" element={
          <RequireAuth>
            <RequirePermissionRoute permission={PERMISSIONS.VIEW_ADMIN_DASHBOARD}>
              <AdminLayout />
            </RequirePermissionRoute>
          </RequireAuth>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"  element={<AdminDashboard />} />
          <Route path="activity"   element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_ACTIVITY_LOG}><AdminActivity /></RequirePermissionRoute>} />
          <Route path="stats"      element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_ACTIVITY_LOG}><AdminStats /></RequirePermissionRoute>} />
          <Route path="roles"      element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_USERS}><UserRolesAdmin /></RequirePermissionRoute>} />
          <Route path="universities" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_UNIVERSITIES}><Universities /></RequirePermissionRoute>} />
          <Route path="programs"   element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_PROGRAMS}><Programs /></RequirePermissionRoute>} />
          <Route path="universities/:id/programs" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_PROGRAMS}><UniversityPrograms /></RequirePermissionRoute>} />
          <Route path="branches"   element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_PROGRAMS}><BranchesAdmin /></RequirePermissionRoute>} />
          <Route path="syllabus"   element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_SYLLABUS}><SyllabusAdmin /></RequirePermissionRoute>} />
          <Route path="units"      element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_UNITS}><UnitsAdmin /></RequirePermissionRoute>} />
          <Route path="resources/upload" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_RESOURCES}><ResourcesUpload /></RequirePermissionRoute>} />
          <Route path="pyq/upload" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_PYQS}><PyqUpload /></RequirePermissionRoute>} />
          <Route path="pyqs"       element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_PYQS}><AdminPyqsPage /></RequirePermissionRoute>} />
          <Route path="moderation" element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_REPORTS}><AdminModeration /></RequirePermissionRoute>} />
          <Route path="updates"    element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_ADMIN_DASHBOARD}><AdminUpdates /></RequirePermissionRoute>} />
          <Route path="attendance" element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_ATTENDANCE_REPORTS}><AdminAttendance /></RequirePermissionRoute>} />
          <Route path="contact-messages" element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_CONTACT_MESSAGES}><AdminContactMessages /></RequirePermissionRoute>} />
        </Route>

        {/* ─── ⚠️ System routes ─── */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*"             element={<NotFound />} />

      </Routes>
    </Suspense>
  </>
)

export default AppRoutes
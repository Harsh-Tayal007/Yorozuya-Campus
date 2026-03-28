import { Routes, Route } from "react-router-dom"

/* 🌍 Public pages */
import Home from "../pages/Home"
import Universities from "../pages/universities/Universities"
import UniversityDetail from "../pages/universities/UniversityDetail"

import PublicLayout from "@/layouts/PublicLayout"
import UserLayout from "@/layouts/UserLayout"

import PublicRoute from "./PublicRoute"

import Forum from "../pages/forum/Forum"
import ThreadDetail from "../pages/forum/ThreadDetail"
import NotFound from "../pages/errors/NotFound"
import ResourcesUserView from "@/pages/resources/ResourcesUserView"
import SyllabusUserView from "../pages/admin/syllabus/SyllabusUserView"
import PyqUserView from "@/pages/pyqs/PyqUserView"
import PyqSemesterSubjects from "@/pages/pyqs/PyqSemesterSubjects"
import PyqSubjectList from "@/pages/pyqs/PyqSubjectList"

import ProgramDetail from "@/pages/programs/ProgramDetail"
import ProgramSyllabus from "@/pages/programs/ProgramSyllabus"
import BranchDetail from "@/pages/branches/BranchDetail"
import BranchSyllabus from "@/pages/branches/BranchSyllabus"

/* 🔐 Auth pages */
import Login from "@/pages/auth/Login"
import Signup from "@/pages/auth/Signup"
import OAuthCallback from "@/pages/auth/OAuthCallback"
import ForgotPassword from "@/pages/auth/ForgotPassword"
import ResetPassword from "@/pages/auth/ResetPassword"

/* 🔒 Route guards */
import ProtectedRoute from "./ProtectedRoute"

/* 🛑 Admin pages */
import AdminDashboard from "../pages/dashboard/AdminDashboard"
import Programs from "@/pages/admin/Programs"
import UniversityPrograms from "@/pages/admin/UniversityPrograms"
import ResourcesUpload from "@/pages/admin/resources/ResourcesUpload"
import PyqUpload from "@/pages/admin/pyq/PyqUpload"
import AdminPyqsPage from "@/pages/admin/pyq/AdminPyqsPage"
import UnitsAdmin from "@/pages/admin/units/Units"
import AdminActivity from "@/pages/dashboard/AdminActivity"
import AdminStats from "@/pages/admin/stats/AdminStats"

import Unauthorized from "../pages/errors/Unauthorized"
import { Navigate } from "react-router-dom"
import SyllabusAdmin from "@/pages/admin/syllabus/syllabus"

import RequireAuth from "@/components/auth/RequireAuth"
import RequirePermissionRoute from "@/components/auth/RequirePermissionRoute"
import { PERMISSIONS } from "@/config/permissions"
import AdminLayout from "@/layouts/AdminLayout"
import UserRolesAdmin from "@/pages/admin/roles/userRolesAdmin"
import Dashboard from "@/pages/dashboard/Dashboard"
import RequireAcademicProfile from "@/components/auth/RequireAcademicProfile"
import CompleteProfile from "@/pages/dashboard/CompleteProfile"
import DashboardLayout from "@/layouts/DashboardLayout"
import DashboardSettings from "@/pages/dashboard/DashboardSettings"
import DashboardSyllabus from "@/components/dashboard/DashboardSyllabus"
import DashboardSemesterSyllabus from "@/components/dashboard/DashboardSemesterSyllabus"
import DashboardResources from "@/components/dashboard/DashboardResources"
import DashboardPyqs from "@/components/dashboard/DashboardPyqs"
import DashboardPyqSemester from "@/components/dashboard/DashboardPyqSemester"
import DashboardPyqSubject from "@/components/dashboard/DashboardPyqSubject"
import UniversityNoticesPage from "@/pages/dashboard/UniversityNoticesPage"
import { PageTitleManager } from "@/components"
import UserProfile from "@/pages/profile/UserProfile"
import BranchesAdmin from "@/pages/branches/BranchesAdmin"

import CGPACalculator from "@/pages/tools/CGPACalculator"
import TaskTracker from "@/pages/tools/TaskTracker"
import TimetableBuilder from "@/pages/tools/TimetableBuilder"
import PrivacyPolicy from "@/pages/auth/PrivacyPolicy"

const AppRoutes = () => {
  return (
    <>
      <PageTitleManager />
      <Routes>
        {/* 🌍 Public routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:threadId" element={<ThreadDetail />} />
          <Route path="/universities" element={<Universities />} />
          <Route path="/profile/:username" element={<UserProfile />} />
          <Route path="/university/:universityId" element={<UniversityDetail />} />
          <Route path="/programs/:programId" element={<ProgramDetail />} />
          <Route path="/programs/:programId/syllabus" element={<ProgramSyllabus />} />
          <Route path="/programs/:programId/branches/:branchName" element={<BranchDetail />} />
          <Route path="/programs/:programId/branches/:branchName/syllabus" element={<BranchSyllabus />} />
          <Route path="/programs/:programId/branches/:branchName/syllabus/semester/:semester" element={<SyllabusUserView />} />
          <Route path="/programs/:programId/branches/:branchName/resources" element={<ResourcesUserView />} />
          <Route path="/programs/:programId/branches/:branchName/resources/semester/:semester" element={<ResourcesUserView />} />
          <Route path="/programs/:programId/branches/:branchName/resources/semester/:semester/subject/:subjectId" element={<ResourcesUserView />} />
          <Route path="/programs/:programId/branches/:branchName/resources/semester/:semester/subject/:subjectId/unit/:unitId" element={<ResourcesUserView />} />
          <Route path="/programs/:programId/branches/:branchName/pyqs" element={<PyqUserView />} />
          <Route path="/programs/:programId/branches/:branchName/pyqs/semester/:semester" element={<PyqSemesterSubjects />} />
          <Route path="/programs/:programId/branches/:branchName/pyqs/semester/:semester/subject/:subjectId" element={<PyqSubjectList />} />
          <Route path="/syllabus/:syllabusId" element={<SyllabusUserView />} />
          <Route path="/resources" element={<ResourcesUserView />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Route>

        {/* Auth routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* 🔒 Logged-in user routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/complete-profile" element={<CompleteProfile />} />

          <Route element={<RequireAcademicProfile />}>
            <Route element={<UserLayout />}>

              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="settings" element={<DashboardSettings />} />
                <Route path="notices" element={<UniversityNoticesPage />} />
                <Route path="cgpa" element={<CGPACalculator />} />
                <Route path="tasks" element={<TaskTracker />} />
                <Route path="timetable" element={<TimetableBuilder />} />

                <Route path="syllabus">
                  <Route index element={<DashboardSyllabus />} />
                  <Route path="semester/:semester" element={<DashboardSemesterSyllabus />} />
                </Route>

                <Route path="resources">
                  <Route index element={<DashboardResources />} />
                  <Route path="semester/:semester" element={<DashboardResources />} />
                  <Route path="semester/:semester/subject/:subjectId" element={<DashboardResources />} />
                  <Route path="semester/:semester/subject/:subjectId/unit/:unitId" element={<DashboardResources />} />
                </Route>

                <Route path="pyqs">
                  <Route index element={<DashboardPyqs />} />
                  <Route path="semester/:semester" element={<DashboardPyqSemester />} />
                  <Route path="semester/:semester/subject/:subjectId" element={<DashboardPyqSubject />} />
                </Route>
              </Route>

            </Route>
          </Route>
        </Route>

        {/* 🔐 Admin-only routes */}
        <Route path="/admin" element={
          <RequireAuth>
            <RequirePermissionRoute permission={PERMISSIONS.VIEW_ADMIN_DASHBOARD}>
              <AdminLayout />
            </RequirePermissionRoute>
          </RequireAuth>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="roles" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_USERS}><UserRolesAdmin /></RequirePermissionRoute>} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="universities" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_UNIVERSITIES}><Universities /></RequirePermissionRoute>} />
          <Route path="programs" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_PROGRAMS}><Programs /></RequirePermissionRoute>} />
          <Route path="universities/:id/programs" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_PROGRAMS}><UniversityPrograms /></RequirePermissionRoute>} />
          <Route path="branches" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_PROGRAMS}><BranchesAdmin /></RequirePermissionRoute>} />
          <Route path="syllabus" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_SYLLABUS}><SyllabusAdmin /></RequirePermissionRoute>} />
          <Route path="units" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_UNITS}><UnitsAdmin /></RequirePermissionRoute>} />
          <Route path="resources/upload" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_RESOURCES}><ResourcesUpload /></RequirePermissionRoute>} />
          <Route path="pyq/upload" element={<RequirePermissionRoute permission={PERMISSIONS.MANAGE_PYQS}><PyqUpload /></RequirePermissionRoute>} />
          <Route path="pyqs" element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_PYQS}><AdminPyqsPage /></RequirePermissionRoute>} />
          <Route path="activity" element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_ACTIVITY_LOG}><AdminActivity /></RequirePermissionRoute>} />
        <Route path="stats" element={<RequirePermissionRoute permission={PERMISSIONS.VIEW_ACTIVITY_LOG}><AdminStats /></RequirePermissionRoute>} />
        </Route>

        {/* ⚠️ System routes */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  )
}

export default AppRoutes
import { Routes, Route } from "react-router-dom"

/* 🌍 Public pages */
import Home from "../pages/Home"
import Universities from "../pages/Universities"
import UniversityDetail from "../pages/UniversityDetail"

import PublicLayout from "@/layouts/PublicLayout"
import UserLayout from "@/layouts/UserLayout"

// import CourseDetail from "../pages/CourseDetail"
import Forum from "../pages/Forum"
import ThreadDetail from "../pages/ThreadDetail"
import Tools from "../pages/Tools"
import NotFound from "../pages/NotFound"
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

/* 🔒 Route guards */
import ProtectedRoute from "./ProtectedRoute"

/* 🛑 Admin pages */
import AdminDashboard from "../pages/AdminDashboard"
import Programs from "@/pages/admin/Programs"
import UniversityPrograms from "@/pages/admin/UniversityPrograms"
import ResourcesUpload from "@/pages/admin/resources/ResourcesUpload"
import PyqUpload from "@/pages/admin/pyq/PyqUpload"
import PyqList from "@/pages/admin/pyq/PyqList"
import UnitsAdmin from "@/pages/admin/units/Units"
import AdminActivity from "@/pages/AdminActivity"

/* ⚠️ Misc */
import Unauthorized from "../pages/Unauthorized"

import { Navigate } from "react-router-dom"

import SyllabusAdmin from "@/pages/admin/syllabus/syllabus"


import RequireAuth from "@/components/auth/RequireAuth"
import RequirePermissionRoute from "@/components/auth/RequirePermissionRoute"
import { PERMISSIONS } from "@/config/permissions"
import AdminLayout from "@/pages/admin/AdminLayout"
import UserRolesAdmin from "@/pages/admin/roles/userRolesAdmin"
import Dashboard from "@/pages/user/dashboard/Dashboard"
import RequireAcademicProfile from "@/components/auth/RequireAcademicProfile"
import CompleteProfile from "@/pages/user/CompleteProfile"
import DashboardLayout from "@/layouts/DashboardLayout"
import DashboardSettings from "@/pages/user/dashboard/DashboardSettings"
import DashboardSyllabus from "@/components/dashboard/DashboardSyllabus"
import DashboardSemesterSyllabus from "@/components/dashboard/DashboardSemesterSyllabus"
import DashboardResources from "@/components/dashboard/DashboardResources"
import DashboardPyqs from "@/components/dashboard/DashboardPyqs"
import DashboardPyqSemester from "@/components/dashboard/DashboardPyqSemester"
import DashboardPyqSubject from "@/components/dashboard/DashboardPyqSubject"

const AppRoutes = () => {
  return (
    <Routes>
      {/* 🌍 Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/forum" element={<Forum />} />
        <Route path="/forum/:threadId" element={<ThreadDetail />} />
        <Route path="/tools" element={<Tools />} />

      </Route>


      {/* Auth routes */}

      {/* <Route path="/signup" element={<Signup />} /> */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/signup/academic" element={<div>Step 2 Coming</div>} />


      {/* 🔒 Logged-in user routes */}
      <Route element={<ProtectedRoute />}>

        {/* ✅ Session required only */}
        <Route
          path="/complete-profile"
          element={<CompleteProfile />}
        />

        <Route element={<RequireAcademicProfile />}>
          {/* 👤 User Layout Routes */}
          <Route element={<UserLayout />}>

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="settings" element={<DashboardSettings />} />

              <Route path="syllabus">
                <Route index element={<DashboardSyllabus />} />
                <Route path=":semester" element={<DashboardSemesterSyllabus />} />
              </Route>

              <Route path="resources">
                <Route index element={<DashboardResources />} />
                <Route path=":semester" element={<DashboardResources />} />
                <Route path=":semester/:subjectId" element={<DashboardResources />} />
                <Route path=":semester/:subjectId/:unitId" element={<DashboardResources />} />
              </Route>

              <Route path="pyqs">
                <Route index element={<DashboardPyqs />} />
                <Route path="semester/:semester" element={<DashboardPyqSemester />} />
                <Route path="semester/:semester/subject/:subjectId" element={<DashboardPyqSubject />} />
              </Route>

            </Route>


            <Route path="/universities" element={<Universities />} />

            <Route
              path="/university/:universityId"
              element={<UniversityDetail />}
            />

            <Route
              path="/programs/:programId"
              element={<ProgramDetail />}
            />

            <Route
              path="/programs/:programId/syllabus"
              element={<ProgramSyllabus />}
            />

            <Route
              path="/programs/:programId/branches/:branchName"
              element={<BranchDetail />}
            />

            <Route
              path="/programs/:programId/branches/:branchName/syllabus"
              element={<BranchSyllabus />}
            />

            <Route
              path="/programs/:programId/branches/:branchName/syllabus/:semester"
              element={<SyllabusUserView />}
            />

            <Route
              path="/programs/:programId/branches/:branchName/resources"
              element={<ResourcesUserView />}
            />

            <Route
              path="/programs/:programId/branches/:branchName/resources/:semester"
              element={<ResourcesUserView />}
            />

            <Route
              path="/programs/:programId/branches/:branchName/resources/:semester/:subjectId"
              element={<ResourcesUserView />}
            />

            <Route
              path="/programs/:programId/branches/:branchName/resources/:semester/:subjectId/:unitId"
              element={<ResourcesUserView />}
            />

            <Route
              path="/programs/:programId/branches/:branchName/pyqs"
              element={<PyqUserView />}
            />

            <Route
              path="/programs/:programId/branches/:branchName/pyqs/semester/:semester"
              element={<PyqSemesterSubjects />}
            />

            <Route
              path="/programs/:programId/branches/:branchName/pyqs/semester/:semester/subject/:subjectId"
              element={<PyqSubjectList />}
            />

            {/* Direct Access Routes */}
            <Route
              path="/syllabus/:syllabusId"
              element={<SyllabusUserView />}
            />

            <Route
              path="/resources"
              element={<ResourcesUserView />}
            />

          </Route>

        </Route>

        {/* <Route path="/forum/create" element={<ForumCreate />} /> */}
        {/* <Route path="/profile" element={<Profile />} /> */}
      </Route>

      {/* 🔐 Admin-only routes */}
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <RequirePermissionRoute
              permission={PERMISSIONS.VIEW_ADMIN_DASHBOARD}
            >
              <AdminLayout /> {/* optional, if you have layout */}
            </RequirePermissionRoute>
          </RequireAuth>
        }
      >
        {/* redirect /admin → /admin/dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />

        <Route
          path="roles"
          element={
            <RequirePermissionRoute
              permission={PERMISSIONS.MANAGE_USERS}
            >
              <UserRolesAdmin />
            </RequirePermissionRoute>
          }
        />


        <Route
          path="dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="universities"
          element={
            <RequirePermissionRoute
              permission={PERMISSIONS.MANAGE_UNIVERSITIES}
            >
              <Universities />
            </RequirePermissionRoute>
          }
        />

        {/* STEP 6.6.2 — Programs */}
        <Route
          path="programs"
          element={
            <RequirePermissionRoute
              permission={PERMISSIONS.MANAGE_PROGRAMS}
            >
              <Programs />
            </RequirePermissionRoute>
          }
        />

        <Route
          path="universities/:id/programs"
          element={
            <RequirePermissionRoute
              permission={PERMISSIONS.MANAGE_PROGRAMS}
            >
              <UniversityPrograms />
            </RequirePermissionRoute>
          }
        />

        <Route
          path="syllabus"
          element={
            <RequirePermissionRoute
              permission={PERMISSIONS.MANAGE_SYLLABUS}
            >
              <SyllabusAdmin />
            </RequirePermissionRoute>
          }
        />

        <Route
          path="units"
          element={
            <RequirePermissionRoute
              permission={PERMISSIONS.MANAGE_UNITS}
            >
              <UnitsAdmin />
            </RequirePermissionRoute>
          }
        />

        <Route
          path="resources/upload"
          element={
            <RequirePermissionRoute
              permission={PERMISSIONS.MANAGE_RESOURCES}
            >
              <ResourcesUpload />
            </RequirePermissionRoute>
          }
        />

        <Route
          path="pyq/upload"
          element={
            <RequirePermissionRoute
              permission={PERMISSIONS.MANAGE_PYQS}
            >
              <PyqUpload />
            </RequirePermissionRoute>
          }
        />

        <Route
          path="pyqs"
          element={
            <RequirePermissionRoute permission={PERMISSIONS.VIEW_PYQS}>
              <PyqList />
            </RequirePermissionRoute>
          }
        />



        <Route
          path="activity"
          element={
            <RequirePermissionRoute
              permission={PERMISSIONS.VIEW_ACTIVITY_LOG}
            >
              <AdminActivity />
            </RequirePermissionRoute>
          }
        />
      </Route>


      {/* ⚠️ System routes */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes

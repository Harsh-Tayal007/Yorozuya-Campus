import { Routes, Route } from "react-router-dom"

/* 🌍 Public pages */
import Home from "../pages/Home"
import Universities from "../pages/Universities"
import UniversityDetail from "../pages/UniversityDetail"
// import CourseDetail from "../pages/CourseDetail"
import Forum from "../pages/Forum"
import ThreadDetail from "../pages/ThreadDetail"
import Tools from "../pages/Tools"
import NotFound from "../pages/NotFound"
import ResourcesUserView from "@/pages/resources/ResourcesUserView"

import ProgramDetail from "@/pages/programs/ProgramDetail"
import ProgramSyllabus from "@/pages/programs/ProgramSyllabus"
import BranchDetail from "@/pages/branches/BranchDetail"
import BranchSyllabus from "@/pages/branches/BranchSyllabus"
import SyllabusUserView from "../pages/admin/syllabus/SyllabusUserView"


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


import AuthRedirect from "@/components/auth/AuthRedirect"


import RequireAuth from "@/components/auth/RequireAuth"
import RequirePermissionRoute from "@/components/auth/RequirePermissionRoute"
import { PERMISSIONS } from "@/config/permissions"
import AdminLayout from "@/pages/admin/AdminLayout"
import UserRolesAdmin from "@/pages/admin/roles/userRolesAdmin"

const AppRoutes = () => {
  return (
    <Routes>
      {/* 🌍 Public routes */}
      <Route path="/" element={<Home />} />
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

      <Route path="/forum" element={<Forum />} />
      <Route path="/forum/:threadId" element={<ThreadDetail />} />

      <Route path="/tools" element={<Tools />} />

      <Route
        path="/login"
        element={
          <AuthRedirect>
            <Login />
          </AuthRedirect>
        }
      />

      <Route
        path="/signup"
        element={
          <AuthRedirect>
            <Signup />
          </AuthRedirect>
        }
      />

      <Route
        path="/syllabus"
        element={<Navigate to="/" replace />}
      />


      {/* 📘 Syllabus User View */}
      <Route
        path="/syllabus/:syllabusId"
        element={<SyllabusUserView />}
      />

      {/* 📘 Resource User View */}
      <Route
        path="/resources"
        element={<ResourcesUserView />}
      />



      {/* 🔒 Logged-in user routes */}
      <Route element={<ProtectedRoute />}>
        {/* future protected pages */}
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

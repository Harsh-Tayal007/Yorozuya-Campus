import { createContext, useContext, useEffect, useState, useMemo } from "react"
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  generateAvailableUsername
} from "@/services/authService"

import { USERS_COLLECTION_ID } from "@/config/appwrite"
import { ID, Query } from "appwrite"
import { account, databases } from "@/lib/appwrite"
import { ROLE_PERMISSIONS } from "@/config/permissions"
import Signup from "@/pages/auth/Signup"

const AuthContext = createContext(null)

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = USERS_COLLECTION_ID

export const AuthProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [role, setRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const assertRoleFromDB = (role) => {
    if (!role) {
      throw new Error("Invariant violation: role missing from DB")
    }
    return role
  }


  // ✅ Permissions derived ONLY from role
  const permissions = useMemo(() => {
    if (!role) return []
    return ROLE_PERMISSIONS[role] || []
  }, [role])

  const hasPermission = (permission) => permissions.includes(permission)
  const hasAnyPermission = (permissionList) =>
    permissionList.some((p) => permissions.includes(p))

  // 🔐 ROLE SOURCE OF TRUTH
  // Role MUST come from users collection.
  // Do NOT derive role from account, prefs, UI, or defaults.




  // 🔁 Restore session
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const accountUser = await getCurrentUser()

        const res = await databases.listDocuments(
          DATABASE_ID,
          USERS_TABLE_ID,
          [Query.equal("userId", accountUser.$id)]
        )

        if (res.total === 0) {
          throw new Error("User profile not found")
        }

        const userDoc = res.documents[0]

        // 🔒 Phase 0.2.a hard invariant
        if (!userDoc.username) {
          throw new Error("Username missing in user profile")
        }

        if (!userDoc.role) {
          throw new Error("Role missing in user profile")
        }

        const roleFromDB = assertRoleFromDB(userDoc.role)

        setRole(roleFromDB)
        setCurrentUser({
          ...accountUser,
          username: userDoc.username,
          universityId: userDoc.universityId ?? null,
          programId: userDoc.programId ?? null,
          branchId: userDoc.branchId ?? null,
          profileCompleted: userDoc.profileCompleted ?? false,
        })

        setAuthStatus(true)

      } catch (err) {
        console.error("Auth restore failed", err)
        setAuthStatus(false)
        setCurrentUser(null)
        setRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  // 🔐 Login
  const login = async ({ email, password }) => {
    let accountUser

    try {
      // 🔁 Try to reuse existing session
      accountUser = await getCurrentUser()
    } catch {
      // 🆕 No session → create one
      await loginUser({ email, password })
      accountUser = await getCurrentUser()
    }

    const res = await databases.listDocuments(
      DATABASE_ID,
      USERS_TABLE_ID,
      [Query.equal("userId", accountUser.$id)]
    )

    if (res.total === 0) {
      throw new Error("User profile not found")
    }

    const userDoc = res.documents[0]

    // 🔒 Hard invariants
    if (!userDoc.username) {
      throw new Error("Username missing in user profile")
    }

    if (!userDoc.role) {
      throw new Error("Role missing in user profile")
    }


    setRole(userDoc.role)
    setCurrentUser({
      ...accountUser,
      username: userDoc.username,
      universityId: userDoc.universityId ?? null,
      programId: userDoc.programId ?? null,
      branchId: userDoc.branchId ?? null,
      profileCompleted: userDoc.profileCompleted ?? false,
    })

    setAuthStatus(true)
  }


  // 🆕 Signup — FIXED (Phase 0.2.b)
  const completeSignup = async (data) => {
    const { name, email, password, universityId, programId, branchId } = data

    // 🧹 1️⃣ Try deleting existing session
    try {
      await account.deleteSession("current")
    } catch (err) {
      // ignore if no session exists
    }

    // 1️⃣ Create auth account
    const user = await account.create(
      ID.unique(),
      email,
      password,
      name
    )

    
    // 3️⃣ Generate username
    const username = await generateAvailableUsername(name)
    
    // 4️⃣ Create DB profile
    await databases.createDocument(
      DATABASE_ID,
      USERS_TABLE_ID,
      ID.unique(),
      {
        userId: user.$id,
        email,
        name,
        username,
        role: "user",
        universityId,
        programId,
        branchId,
        profileCompleted: true,
      }
    )
    
    // // 2️⃣ Create session
    await account.createEmailPasswordSession(email, password)
    
    // return user
  }






  // function to update academic profile.
  const completeAcademicProfile = async ({
    universityId,
    programId,
    branchId,
  }) => {
    if (!currentUser) throw new Error("User not authenticated")

    const res = await databases.listDocuments(
      DATABASE_ID,
      USERS_TABLE_ID,
      [Query.equal("userId", currentUser.$id)]
    )

    if (res.total === 0) {
      throw new Error("User profile not found")
    }

    const userDoc = res.documents[0]

    await databases.updateDocument(
      DATABASE_ID,
      USERS_TABLE_ID,
      userDoc.$id,
      {
        universityId,
        programId,
        branchId,
        profileCompleted: true,
      }
    )

    // Update local state immediately
    setCurrentUser((prev) => ({
      ...prev,
      universityId,
      programId,
      branchId,
      profileCompleted: true,
    }))
  }



  // 🚪 Logout
  const logout = async () => {
    await logoutUser()
    setAuthStatus(false)
    setCurrentUser(null)
    setRole(null)
  }

  // 🔑 Role helper
  const hasRole = (allowedRoles) => {
    if (!role) return false
    return Array.isArray(allowedRoles)
      ? allowedRoles.includes(role)
      : role === allowedRoles
  }

  const isAdmin = hasRole("admin")

  return (
    <AuthContext.Provider
      value={{
        authStatus,
        currentUser,
        role,
        isAdmin,
        isLoading,

        login,
        completeSignup,
        logout,
        hasRole,
        completeAcademicProfile,

        permissions,
        hasPermission,
        hasAnyPermission,

        user: currentUser,
        loading: isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

import { createContext, useContext, useEffect, useState, useMemo, useRef } from "react"
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  generateAvailableUsername
} from "@/services/admin/authService"

import { USERS_COLLECTION_ID } from "@/config/appwrite"
import { ID, Query } from "appwrite"
import { account, databases } from "@/lib/appwrite"
import { ROLE_PERMISSIONS } from "@/config/permissions"
import { deleteCloudinaryImage } from "@/lib/deleteCloudinaryImage"
import { upsertSavedAccount, vaultStore, vaultRefreshTTL } from "@/lib/savedAccounts"

const AuthContext = createContext(null)

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = USERS_COLLECTION_ID

// ── Build currentUser shape from accountUser + userDoc ───────────────────────
const buildCurrentUser = (accountUser, userDoc) => ({
  ...accountUser,
  username: userDoc.username,
  universityId: userDoc.universityId ?? null,
  programId: userDoc.programId ?? null,
  branchId: userDoc.branchId ?? null,
  profileCompleted: userDoc.profileCompleted ?? false,
  avatarUrl: userDoc.avatarUrl ?? null,
  avatarPublicId: userDoc.avatarPublicId ?? null,
  bio: userDoc.bio ?? null,
  yearOfStudy: userDoc.yearOfStudy ?? null,
  name: userDoc.name ?? accountUser.name,
  // ── new social fields ──
  karma: userDoc.karma ?? 0,
  followerCount: userDoc.followerCount ?? 0,
  followingCount: userDoc.followingCount ?? 0,
})

export const AuthProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [role, setRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userDocId, setUserDocId] = useState(null)   // ← cached DB doc $id

  const assertRoleFromDB = (role) => {
    if (!role) throw new Error("Invariant violation: role missing from DB")
    return role
  }

  const permissions = useMemo(() => {
    if (!role) return []
    return ROLE_PERMISSIONS[role] || []
  }, [role])

  const hasPermission = (permission) => permissions.includes(permission)
  const hasAnyPermission = (permissionList) => permissionList.some((p) => permissions.includes(p))

  const sessionRestored = useRef(false)

  // ── Restore session ──────────────────────────────────────────────────────
  useEffect(() => {
    if (sessionRestored.current) return
    sessionRestored.current = true

    const restoreSession = async () => {
      try {
        const accountUser = await getCurrentUser()

        const res = await databases.listDocuments(
          DATABASE_ID, USERS_TABLE_ID,
          [Query.equal("userId", accountUser.$id)]
        )

        if (res.total === 0) throw new Error("User profile not found")

        const userDoc = res.documents[0]

        if (!userDoc.username) throw new Error("Username missing in user profile")
        if (!userDoc.role) throw new Error("Role missing in user profile")

        setRole(assertRoleFromDB(userDoc.role))
        setUserDocId(userDoc.$id)
        setCurrentUser(buildCurrentUser(accountUser, userDoc))
        setAuthStatus(true)

        upsertSavedAccount({
          userId: accountUser.$id,
          name: userDoc.name || accountUser.name,
          username: userDoc.username,
          email: accountUser.email,
          avatarUrl: userDoc.avatarUrl || null,
        })

        // Refresh TTL so active users never get logged out of vault
        vaultRefreshTTL(accountUser.$id)


      } catch (err) {
        console.error("Auth restore failed", err)
        setAuthStatus(false)
        setCurrentUser(null)
        setRole(null)
        setUserDocId(null)
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [])

  // ── Login ────────────────────────────────────────────────────────────────
  const login = async ({ email, password }) => {

    // If switching, delete current session first so loginUser doesn't get "session exists" error
    const isSwitching = !!sessionStorage.getItem("unizuya_switch_to")
    if (isSwitching) {
      try { await account.deleteSession("current") } catch { /* ignore */ }
    }

    let accountUser
    try {
      accountUser = await getCurrentUser()
    } catch {
      await loginUser({ email, password })
      accountUser = await getCurrentUser()
    }

    const res = await databases.listDocuments(
      DATABASE_ID, USERS_TABLE_ID,
      [Query.equal("userId", accountUser.$id)]
    )

    if (res.total === 0) throw new Error("User profile not found")

    const userDoc = res.documents[0]

    if (!userDoc.username) throw new Error("Username missing in user profile")
    if (!userDoc.role) throw new Error("Role missing in user profile")

    setRole(userDoc.role)
    setUserDocId(userDoc.$id)
    setCurrentUser(buildCurrentUser(accountUser, userDoc))
    setAuthStatus(true)

    // Store encrypted password for seamless switching
    if (password) await vaultStore(accountUser.$id, password)

    upsertSavedAccount({
      userId: accountUser.$id,
      name: userDoc.name || accountUser.name,
      username: userDoc.username,
      email: accountUser.email,
      avatarUrl: userDoc.avatarUrl || null,
    })
  }

  // ── Signup ───────────────────────────────────────────────────────────────
  const completeSignup = async (data) => {
    const { name, email, password, universityId, programId, branchId } = data

    try { await account.deleteSession("current") } catch { /* ignore */ }

    const authUser = await account.create(ID.unique(), email, password, name)
    const username = await generateAvailableUsername(name)

    await databases.createDocument(DATABASE_ID, USERS_TABLE_ID, ID.unique(), {
      userId: authUser.$id,
      email,
      name,
      username,
      role: "user",
      universityId,
      programId,
      branchId,
      profileCompleted: true,
      avatarUrl: null,
      avatarPublicId: null,
      bio: null,
      yearOfStudy: null,
    })

    await account.createEmailPasswordSession(email, password)
    const loggedInUser = await account.get()

    const profileRes = await databases.listDocuments(
      DATABASE_ID, USERS_TABLE_ID,
      [Query.equal("userId", loggedInUser.$id)]
    )

    const profile = profileRes.documents[0]

    setUserDocId(profile.$id)
    setCurrentUser(buildCurrentUser(loggedInUser, profile))
    setRole(profile.role)
    setAuthStatus(true)

    upsertSavedAccount({
      userId: loggedInUser.$id,
      name: profile.name,
      username: profile.username,
      email: loggedInUser.email,
      avatarUrl: profile.avatarUrl || null,
    })

    return loggedInUser
  }

  // ── Update academic profile ───────────────────────────────────────────────
  // Fixed: uses cached userDocId — no extra listDocuments needed
  const completeAcademicProfile = async ({ universityId, programId, branchId }) => {
    if (!currentUser) throw new Error("User not authenticated")
    if (!userDocId) throw new Error("User doc ID not cached")

    await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userDocId, {
      universityId, programId, branchId, profileCompleted: true,
    })

    setCurrentUser((prev) => ({
      ...prev, universityId, programId, branchId, profileCompleted: true,
    }))
  }

  // ── Update profile (bio, yearOfStudy, avatar, name) ──────────────────────
  // 1 DB request + optional Cloudinary upload + optional account.updateName
  const updateProfile = async ({
    name,
    bio,
    yearOfStudy,
    avatarUrl,
    avatarPublicId,
    oldAvatarPublicId,
  }) => {
    if (!currentUser) throw new Error("User not authenticated")
    if (!userDocId) throw new Error("User doc ID not cached")

    // Delete old Cloudinary avatar if replacing
    if (oldAvatarPublicId && oldAvatarPublicId !== avatarPublicId) {
      await deleteCloudinaryImage(oldAvatarPublicId).catch(() => { })
    }

    // Build DB update payload — only include defined fields
    const updates = {}
    if (name !== undefined) updates.name = name
    if (bio !== undefined) updates.bio = bio
    if (yearOfStudy !== undefined) updates.yearOfStudy = yearOfStudy
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl
    if (avatarPublicId !== undefined) updates.avatarPublicId = avatarPublicId

    // Update DB doc
    await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userDocId, updates)

    // If name changed, update Appwrite Auth account name too
    if (name !== undefined && name !== currentUser.name) {
      await account.updateName(name).catch(() => { })
    }

    // Update local state — no re-fetch needed
    setCurrentUser((prev) => ({ ...prev, ...updates }))

    if (currentUser?.$id) {
      upsertSavedAccount({
        userId: currentUser.$id,
        name: updates.name ?? currentUser.name,
        username: currentUser.username,
        email: currentUser.email,
        avatarUrl: updates.avatarUrl ?? currentUser.avatarUrl ?? null,
      })
    }
  }

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    await logoutUser()
    setAuthStatus(false)
    setCurrentUser(null)
    setRole(null)
    setUserDocId(null)
  }

  const hasRole = (allowedRoles) => {
    if (!role) return false
    return Array.isArray(allowedRoles) ? allowedRoles.includes(role) : role === allowedRoles
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
        userDocId,

        login,
        completeSignup,
        logout,
        hasRole,
        completeAcademicProfile,
        updateProfile,

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
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
import { getActiveBan } from "@/services/moderation/banService"
import { subscribeToPush, unsubscribeFromPush } from "@/services/notification/pushSubscriptionService"
import { sendVerificationEmail } from "@/services/auth/emailVerificationService"

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
  emailVerified: userDoc.emailVerified ?? accountUser.emailVerification ?? false, // ← new
  avatarUrl: userDoc.avatarUrl ?? null,
  avatarPublicId: userDoc.avatarPublicId ?? null,
  bio: userDoc.bio ?? null,
  yearOfStudy: userDoc.yearOfStudy ?? null,
  name: userDoc.name ?? accountUser.name,
  karma: userDoc.karma ?? 0,
  followerCount: userDoc.followerCount ?? 0,
  followingCount: userDoc.followingCount ?? 0,
})

// ── Register SW + subscribe (called after every successful auth) ─────────────
async function registerAndSubscribe(userId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
  try {
    await navigator.serviceWorker.register("/push-sw.js", { scope: "/" })
    await navigator.serviceWorker.ready          // wait for activation
    await subscribeToPush(userId)
  } catch (e) {
    console.warn("Push subscription failed:", e)
  }
}

export const AuthProvider = ({ children }) => {
  const [authStatus, setAuthStatus] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [role, setRole] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userDocId, setUserDocId] = useState(null)

  const assertRoleFromDB = (role) => {
    if (!role) throw new Error("Invariant violation: role missing from DB")
    return role
  }

  const detectOAuthProvider = async () => {
  try {
    const identities = await account.listIdentities()
    if (identities.total > 0) return identities.identities[0].provider
    return null
  } catch {
    return null
  }
}

  const permissions = useMemo(() => {
    if (!role) return []
    return ROLE_PERMISSIONS[role] || []
  }, [role])

  const hasPermission = (permission) => permissions.includes(permission)
  const hasAnyPermission = (permissionList) => permissionList.some(p => permissions.includes(p))

  const sessionRestored = useRef(false)

  // ── Restore session ────────────────────────────────────────────────────────
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

        const activeBan = await getActiveBan(accountUser.$id).catch(() => null)

        setCurrentUser({
          ...buildCurrentUser(accountUser, userDoc),
          activeBan: activeBan ?? null,
          isBanned: !!activeBan,
        })
        setAuthStatus(true)

        const provider = await detectOAuthProvider()
        upsertSavedAccount({
          userId: accountUser.$id,
          name:   userDoc.name || accountUser.name,
          username: userDoc.username,
          email:  accountUser.email,
          avatarUrl: userDoc.avatarUrl || null,
          provider,   // ← NEW: "google" | "github" | null
        })

        vaultRefreshTTL(accountUser.$id)

        // Re-subscribe in case SW was cleared or this is a new device
        registerAndSubscribe(accountUser.$id)

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

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async ({ email, password }) => {
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

    const activeBan = await getActiveBan(accountUser.$id).catch(() => null)

    setCurrentUser({
      ...buildCurrentUser(accountUser, userDoc),
      activeBan: activeBan ?? null,
      isBanned: !!activeBan,
    })
    setAuthStatus(true)

    if (password) await vaultStore(accountUser.$id, password)

    const provider = await detectOAuthProvider()
        upsertSavedAccount({
          userId: accountUser.$id,
          name:   userDoc.name || accountUser.name,
          username: userDoc.username,
          email:  accountUser.email,
          avatarUrl: userDoc.avatarUrl || null,
          provider,   // ← NEW
        })

    // Subscribe after login — no-ops silently if already subscribed
    registerAndSubscribe(accountUser.$id)
  }

  // ── Signup ─────────────────────────────────────────────────────────────────
  const completeSignup = async (data) => {
    const { name, email, password, universityId, programId, branchId } = data

    try { await account.deleteSession("current") } catch { /* ignore */ }

    // 1. Create Appwrite auth account
    const authUser = await account.create(ID.unique(), email, password, name)

    // 2. Generate username
    const username = await generateAvailableUsername(name)

    // 3. Create user profile doc — emailVerified: false
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
      emailVerified: false,           // ← new field
      avatarUrl: null,
      avatarPublicId: null,
      bio: null,
      yearOfStudy: null,
    })

    // 4. Create session so we can call account.createVerification
    await account.createEmailPasswordSession(email, password)
    const loggedInUser = await account.get()

    // 5. Send verification email (non-blocking — don't fail signup if this errors)
    try {
      await sendVerificationEmail({ userId: loggedInUser.$id, email, name })
    } catch (verifyErr) {
      console.warn("Verification email failed to send:", verifyErr)
      // Signup still succeeds — user can resend from the gate screen
    }

    // 6. Hydrate state
    const profileRes = await databases.listDocuments(
      DATABASE_ID, USERS_TABLE_ID,
      [Query.equal("userId", loggedInUser.$id)]
    )

    const profile = profileRes.documents[0]

    setUserDocId(profile.$id)
    setCurrentUser({
      ...buildCurrentUser(loggedInUser, profile),
      emailVerified: false,
    })
    setRole(profile.role)
    setAuthStatus(true)

    upsertSavedAccount({
          userId: loggedInUser.$id,
          name:   profile.name,
          username: profile.username,
          email:  loggedInUser.email,
          avatarUrl: profile.avatarUrl || null,
          provider: null,   // ← NEW: signup is always email/password
        })

    registerAndSubscribe(loggedInUser.$id)

    return loggedInUser
  }

  // ── Update academic profile ────────────────────────────────────────────────
  const completeAcademicProfile = async ({ universityId, programId, branchId }) => {
    if (!currentUser) throw new Error("User not authenticated")
    if (!userDocId) throw new Error("User doc ID not cached")

    await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userDocId, {
      universityId, programId, branchId, profileCompleted: true,
    })

    setCurrentUser(prev => ({
      ...prev, universityId, programId, branchId, profileCompleted: true,
    }))
  }

  // ── Update profile ─────────────────────────────────────────────────────────
  const updateProfile = async ({
    name, bio, yearOfStudy, avatarUrl, avatarPublicId, oldAvatarPublicId,
  }) => {
    if (!currentUser) throw new Error("User not authenticated")
    if (!userDocId) throw new Error("User doc ID not cached")

    if (oldAvatarPublicId && oldAvatarPublicId !== avatarPublicId) {
      await deleteCloudinaryImage(oldAvatarPublicId).catch(() => { })
    }

    const updates = {}
    if (name !== undefined) updates.name = name
    if (bio !== undefined) updates.bio = bio
    if (yearOfStudy !== undefined) updates.yearOfStudy = yearOfStudy
    if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl
    if (avatarPublicId !== undefined) updates.avatarPublicId = avatarPublicId

    await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userDocId, updates)

    if (name !== undefined && name !== currentUser.name) {
      await account.updateName(name).catch(() => { })
    }

    setCurrentUser(prev => ({ ...prev, ...updates }))

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

  // Add this function inside AuthProvider, after updateProfile:
  const refreshUser = async () => {
    try {
      const accountUser = await getCurrentUser()
      const res = await databases.listDocuments(
        DATABASE_ID, USERS_TABLE_ID,
        [Query.equal("userId", accountUser.$id)]
      )
      if (res.total === 0) return
      const userDoc = res.documents[0]
      const activeBan = await getActiveBan(accountUser.$id).catch(() => null)
      setCurrentUser({
        ...buildCurrentUser(accountUser, userDoc),
        activeBan: activeBan ?? null,
        isBanned: !!activeBan,
      })
    } catch (err) {
      console.error("refreshUser failed", err)
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    // Remove push subscription before session ends
    await unsubscribeFromPush().catch(() => { })
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

        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
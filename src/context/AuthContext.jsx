import { createContext, useContext, useEffect, useState, useMemo, useRef, useCallback } from "react"
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

const DATABASE_ID   = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = USERS_COLLECTION_ID

// ── Session cache key ────────────────────────────────────────────────────────
const SESSION_CACHE_KEY = "uz_session_v1"

// ── Build currentUser shape ──────────────────────────────────────────────────
const buildCurrentUser = (accountUser, userDoc) => ({
  ...accountUser,
  username:         userDoc.username,
  universityId:     userDoc.universityId     ?? null,
  programId:        userDoc.programId        ?? null,
  branchId:         userDoc.branchId         ?? null,
  profileCompleted: userDoc.profileCompleted ?? false,
  emailVerified:    userDoc.emailVerified    ?? accountUser.emailVerification ?? false,
  avatarUrl:        userDoc.avatarUrl        ?? null,
  avatarPublicId:   userDoc.avatarPublicId   ?? null,
  bio:              userDoc.bio              ?? null,
  yearOfStudy:      userDoc.yearOfStudy      ?? null,
  name:             userDoc.name             ?? accountUser.name,
  karma:            userDoc.karma            ?? 0,
  followerCount:    userDoc.followerCount    ?? 0,
  followingCount:   userDoc.followingCount   ?? 0,
})

// ── Defer SW registration completely off critical path ───────────────────────
function deferRegisterAndSubscribe(userId) {
  const run = () => registerAndSubscribe(userId)
  if (typeof requestIdleCallback !== "undefined") {
    requestIdleCallback(run, { timeout: 3000 })
  } else {
    setTimeout(run, 2000)
  }
}

async function registerAndSubscribe(userId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return
  try {
    await navigator.serviceWorker.register("/push-sw.js", { scope: "/" })
    await navigator.serviceWorker.ready
    await subscribeToPush(userId)
  } catch (e) {
    console.warn("Push subscription failed:", e)
  }
}

// ── sessionStorage helpers ───────────────────────────────────────────────────
function readSessionCache() {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeSessionCache(user, role) {
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user, role }))
  } catch { /* storage full — ignore */ }
}

function clearSessionCache() {
  try { sessionStorage.removeItem(SESSION_CACHE_KEY) } catch { /* ignore */ }
}

// ── AuthProvider ─────────────────────────────────────────────────────────────
export const AuthProvider = ({ children }) => {
  // ── Hydrate instantly from sessionStorage cache (repeat visits) ────────────
  const cached = readSessionCache()

  const [authStatus,   setAuthStatus]   = useState(!!cached)
  const [currentUser,  setCurrentUser]  = useState(cached?.user  ?? null)
  const [role,         setRole]         = useState(cached?.role   ?? null)
  const [isLoading,    setIsLoading]    = useState(!cached)          // false if cache hit
  const [userDocId,    setUserDocId]    = useState(null)

  const sessionRestored = useRef(false)

  const assertRoleFromDB = (role) => {
    if (!role) throw new Error("Invariant violation: role missing from DB")
    return role
  }

  const detectOAuthProvider = useCallback(async () => {
    try {
      const identities = await account.listIdentities()
      if (identities.total > 0) return identities.identities[0].provider
      return null
    } catch {
      return null
    }
  }, [])

  const permissions = useMemo(() => {
    if (!role) return []
    return ROLE_PERMISSIONS[role] || []
  }, [role])

  const hasPermission    = useCallback((permission)     => permissions.includes(permission),              [permissions])
  const hasAnyPermission = useCallback((permissionList) => permissionList.some(p => permissions.includes(p)), [permissions])

  // ── Full session restore from Appwrite ────────────────────────────────────
  const doFullRestore = useCallback(async () => {
    try {
      const accountUser = await getCurrentUser()

      // ── Parallelise the 3 independent Appwrite calls ──────────────────────
      const [res, activeBan, provider] = await Promise.all([
        databases.listDocuments(DATABASE_ID, USERS_TABLE_ID,
          [Query.equal("userId", accountUser.$id)]),
        getActiveBan(accountUser.$id).catch(() => null),
        detectOAuthProvider().catch(() => null),
      ])

      if (res.total === 0) throw new Error("User profile not found")

      const userDoc = res.documents[0]
      if (!userDoc.username) throw new Error("Username missing in user profile")
      if (!userDoc.role)     throw new Error("Role missing in user profile")

      const resolvedRole = assertRoleFromDB(userDoc.role)
      const user = {
        ...buildCurrentUser(accountUser, userDoc),
        activeBan: activeBan ?? null,
        isBanned: !!activeBan,
      }

      setRole(resolvedRole)
      setUserDocId(userDoc.$id)
      setCurrentUser(user)
      setAuthStatus(true)

      // Cache for instant load on next visit
      writeSessionCache(user, resolvedRole)

      upsertSavedAccount({
        userId:    accountUser.$id,
        name:      userDoc.name || accountUser.name,
        username:  userDoc.username,
        email:     accountUser.email,
        avatarUrl: userDoc.avatarUrl || null,
        provider,
      })

      vaultRefreshTTL(accountUser.$id)

      // SW registration deferred — does not block render
      deferRegisterAndSubscribe(accountUser.$id)

    } catch (err) {
      console.error("Auth restore failed", err)
      setAuthStatus(false)
      setCurrentUser(null)
      setRole(null)
      setUserDocId(null)
      clearSessionCache()
    } finally {
      setIsLoading(false)
    }
  }, [detectOAuthProvider])

  // ── Revalidate cache in background (no UI block) ─────────────────────────
  const revalidateInBackground = useCallback(async () => {
    try {
      const accountUser = await getCurrentUser()

      const [res, activeBan] = await Promise.all([
        databases.listDocuments(DATABASE_ID, USERS_TABLE_ID,
          [Query.equal("userId", accountUser.$id)]),
        getActiveBan(accountUser.$id).catch(() => null),
      ])

      if (res.total === 0) return

      const userDoc = res.documents[0]
      if (!userDoc.username || !userDoc.role) return

      const user = {
        ...buildCurrentUser(accountUser, userDoc),
        activeBan: activeBan ?? null,
        isBanned: !!activeBan,
      }

      setCurrentUser(user)
      setRole(userDoc.role)
      setUserDocId(userDoc.$id)
      setAuthStatus(true)
      writeSessionCache(user, userDoc.role)

      deferRegisterAndSubscribe(accountUser.$id)
    } catch {
      // Session expired — clear cache and update UI
      clearSessionCache()
      setAuthStatus(false)
      setCurrentUser(null)
      setRole(null)
    }
  }, [])

  // ── On mount: use cache immediately, revalidate in background ────────────
  useEffect(() => {
    if (sessionRestored.current) return
    sessionRestored.current = true

    if (cached) {
      // UI already hydrated from cache — just revalidate quietly in background
      revalidateInBackground()
    } else {
      // Cold visit — full restore (isLoading stays true until done)
      doFullRestore()
    }
  }, []) // eslint-disable-line

  // ── Login ─────────────────────────────────────────────────────────────────
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

    const [res, activeBan, provider] = await Promise.all([
      databases.listDocuments(DATABASE_ID, USERS_TABLE_ID,
        [Query.equal("userId", accountUser.$id)]),
      getActiveBan(accountUser.$id).catch(() => null),
      detectOAuthProvider().catch(() => null),
    ])

    if (res.total === 0) throw new Error("User profile not found")

    const userDoc = res.documents[0]
    if (!userDoc.username) throw new Error("Username missing in user profile")
    if (!userDoc.role)     throw new Error("Role missing in user profile")

    const user = {
      ...buildCurrentUser(accountUser, userDoc),
      activeBan: activeBan ?? null,
      isBanned: !!activeBan,
    }

    setRole(userDoc.role)
    setUserDocId(userDoc.$id)
    setCurrentUser(user)
    setAuthStatus(true)

    writeSessionCache(user, userDoc.role)

    if (password) await vaultStore(accountUser.$id, password)

    upsertSavedAccount({
      userId:    accountUser.$id,
      name:      userDoc.name || accountUser.name,
      username:  userDoc.username,
      email:     accountUser.email,
      avatarUrl: userDoc.avatarUrl || null,
      provider,
    })

    deferRegisterAndSubscribe(accountUser.$id)
  }

  // ── Signup ────────────────────────────────────────────────────────────────
  const completeSignup = async (data) => {
    const { name, email, password, universityId, programId, branchId } = data

    try { await account.deleteSession("current") } catch { /* ignore */ }

    const authUser  = await account.create(ID.unique(), email, password, name)
    const username  = data.username?.trim() || await generateAvailableUsername(name)

    await databases.createDocument(DATABASE_ID, USERS_TABLE_ID, ID.unique(), {
      userId: authUser.$id, email, name, username, role: "user",
      universityId, programId, branchId, profileCompleted: true,
      emailVerified: false, avatarUrl: null, avatarPublicId: null,
      bio: null, yearOfStudy: null,
    })

    await account.createEmailPasswordSession(email, password)
    const loggedInUser = await account.get()

    try {
      await sendVerificationEmail({ userId: loggedInUser.$id, email, name })
    } catch (verifyErr) {
      console.warn("Verification email failed to send:", verifyErr)
    }

    const profileRes = await databases.listDocuments(
      DATABASE_ID, USERS_TABLE_ID,
      [Query.equal("userId", loggedInUser.$id)]
    )

    const profile = profileRes.documents[0]
    const user = { ...buildCurrentUser(loggedInUser, profile), emailVerified: false }

    setUserDocId(profile.$id)
    setCurrentUser(user)
    setRole(profile.role)
    setAuthStatus(true)

    writeSessionCache(user, profile.role)

    upsertSavedAccount({
      userId:    loggedInUser.$id,
      name:      profile.name,
      username:  profile.username,
      email:     loggedInUser.email,
      avatarUrl: profile.avatarUrl || null,
      provider:  null,
    })

    deferRegisterAndSubscribe(loggedInUser.$id)

    return loggedInUser
  }

  // ── Update academic profile ───────────────────────────────────────────────
  const completeAcademicProfile = async ({ universityId, programId, branchId }) => {
    if (!currentUser) throw new Error("User not authenticated")
    if (!userDocId)   throw new Error("User doc ID not cached")

    await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userDocId, {
      universityId, programId, branchId, profileCompleted: true,
    })

    setCurrentUser(prev => {
      const updated = { ...prev, universityId, programId, branchId, profileCompleted: true }
      writeSessionCache(updated, role)
      return updated
    })
  }

  // ── Update profile ────────────────────────────────────────────────────────
  const updateProfile = async ({ name, bio, yearOfStudy, avatarUrl, avatarPublicId, oldAvatarPublicId }) => {
    if (!currentUser) throw new Error("User not authenticated")
    if (!userDocId)   throw new Error("User doc ID not cached")

    if (oldAvatarPublicId && oldAvatarPublicId !== avatarPublicId) {
      await deleteCloudinaryImage(oldAvatarPublicId).catch(() => {})
    }

    const updates = {}
    if (name           !== undefined) updates.name           = name
    if (bio            !== undefined) updates.bio            = bio
    if (yearOfStudy    !== undefined) updates.yearOfStudy    = yearOfStudy
    if (avatarUrl      !== undefined) updates.avatarUrl      = avatarUrl
    if (avatarPublicId !== undefined) updates.avatarPublicId = avatarPublicId

    await databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, userDocId, updates)

    if (name !== undefined && name !== currentUser.name) {
      await account.updateName(name).catch(() => {})
    }

    setCurrentUser(prev => {
      const updated = { ...prev, ...updates }
      writeSessionCache(updated, role)
      return updated
    })

    if (currentUser?.$id) {
      upsertSavedAccount({
        userId:    currentUser.$id,
        name:      updates.name      ?? currentUser.name,
        username:  currentUser.username,
        email:     currentUser.email,
        avatarUrl: updates.avatarUrl ?? currentUser.avatarUrl ?? null,
      })
    }
  }

  // ── Refresh user ──────────────────────────────────────────────────────────
  const refreshUser = async () => {
    try {
      const accountUser = await getCurrentUser()
      const [res, activeBan] = await Promise.all([
        databases.listDocuments(DATABASE_ID, USERS_TABLE_ID,
          [Query.equal("userId", accountUser.$id)]),
        getActiveBan(accountUser.$id).catch(() => null),
      ])
      if (res.total === 0) return
      const userDoc = res.documents[0]
      const user = {
        ...buildCurrentUser(accountUser, userDoc),
        activeBan: activeBan ?? null,
        isBanned: !!activeBan,
      }
      setCurrentUser(user)
      writeSessionCache(user, role)
    } catch (err) {
      console.error("refreshUser failed", err)
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    await unsubscribeFromPush().catch(() => {})
    await logoutUser()
    clearSessionCache()
    setAuthStatus(false)
    setCurrentUser(null)
    setRole(null)
    setUserDocId(null)
  }

  const hasRole  = useCallback((allowedRoles) => {
    if (!role) return false
    return Array.isArray(allowedRoles) ? allowedRoles.includes(role) : role === allowedRoles
  }, [role])

  const isAdmin = hasRole("admin")

  return (
    <AuthContext.Provider value={{
      authStatus, currentUser, role, isAdmin, isLoading, userDocId,
      login, completeSignup, logout, hasRole,
      completeAcademicProfile, updateProfile, refreshUser,
      permissions, hasPermission, hasAnyPermission,
      user: currentUser, loading: isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
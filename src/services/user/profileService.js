import { databases } from "@/lib/appwrite"
import { Query, ID } from "appwrite"

const DATABASE_ID    = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID
const FOLLOWS_COL    = "follows"
const BOOKMARKS_COL  = "bookmarks"
const THREADS_COL    = import.meta.env.VITE_APPWRITE_THREADS_COLLECTION_ID

// ── Public profile fetch ──────────────────────────────────────────────────────
export const getUserByUsername = async (username) => {
  const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
    Query.equal("username", username),
    Query.limit(1),
    Query.select([
      "$id", "userId", "username", "name", "avatarUrl", "bio",
      "yearOfStudy", "universityId", "programId", "branchId", "$createdAt",
      "followerCount", "followingCount", "karma",
    ]),
  ])
  if (res.total === 0) return null
  return res.documents[0]
}

// ── Avatar upload ─────────────────────────────────────────────────────────────
export const uploadAvatar = async (file) => {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("upload_preset", "forum_images")
  formData.append("folder", "avatars")
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/df5zdmtiz/image/upload",
    { method: "POST", body: formData }
  )
  if (!res.ok) throw new Error("Avatar upload failed")
  const data = await res.json()
  return { avatarUrl: data.secure_url, avatarPublicId: data.public_id }
}

// ── Follow ────────────────────────────────────────────────────────────────────
export const followUser = async ({ followerId, followingId, followerDocId, followingDocId }) => {
  // Only send the fields defined in your collection — no createdAt (Appwrite handles $createdAt)
  const followDoc = await databases.createDocument(
    DATABASE_ID, FOLLOWS_COL, ID.unique(),
    { followerId, followingId }
  )

  // Increment counts in parallel
  const [followerDoc, followingDoc] = await Promise.all([
    databases.getDocument(DATABASE_ID, USERS_TABLE_ID, followerDocId),
    databases.getDocument(DATABASE_ID, USERS_TABLE_ID, followingDocId),
  ])

  await Promise.all([
    databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, followerDocId, {
      followingCount: (followerDoc.followingCount ?? 0) + 1,
    }),
    databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, followingDocId, {
      followerCount: (followingDoc.followerCount ?? 0) + 1,
      karma:         (followingDoc.karma         ?? 0) + 1,
    }),
  ])

  return followDoc.$id
}

// ── Unfollow ──────────────────────────────────────────────────────────────────
export const unfollowUser = async ({ followDocId, followerDocId, followingDocId }) => {
  const [followerDoc, followingDoc] = await Promise.all([
    databases.getDocument(DATABASE_ID, USERS_TABLE_ID, followerDocId),
    databases.getDocument(DATABASE_ID, USERS_TABLE_ID, followingDocId),
  ])

  await Promise.all([
    databases.deleteDocument(DATABASE_ID, FOLLOWS_COL, followDocId),
    databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, followerDocId, {
      followingCount: Math.max(0, (followerDoc.followingCount ?? 1) - 1),
    }),
    databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, followingDocId, {
      followerCount: Math.max(0, (followingDoc.followerCount ?? 1) - 1),
      karma:         Math.max(0, (followingDoc.karma         ?? 1) - 1),
    }),
  ])
}

// ── Check follow status ───────────────────────────────────────────────────────
export const getFollowDoc = async ({ followerId, followingId }) => {
  const res = await databases.listDocuments(DATABASE_ID, FOLLOWS_COL, [
    Query.equal("followerId", followerId),
    Query.equal("followingId", followingId),
    Query.limit(1),
    Query.select(["$id"]),
  ])
  return res.total > 0 ? res.documents[0].$id : null
}

// ── Get followers/following lists ─────────────────────────────────────────────
export const getFollowers = async (userId) => {
  const res = await databases.listDocuments(DATABASE_ID, FOLLOWS_COL, [
    Query.equal("followingId", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
    Query.select(["followerId"]),
  ])
  return res.documents.map(d => d.followerId)
}

export const getFollowing = async (userId) => {
  const res = await databases.listDocuments(DATABASE_ID, FOLLOWS_COL, [
    Query.equal("followerId", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
    Query.select(["followingId"]),
  ])
  return res.documents.map(d => d.followingId)
}

// ── Bookmark ──────────────────────────────────────────────────────────────────
export const bookmarkThread = async ({ userId, threadId, threadAuthorDocId }) => {
  // Only send fields defined in collection — no createdAt
  const bookmarkDoc = await databases.createDocument(
    DATABASE_ID, BOOKMARKS_COL, ID.unique(),
    { userId, threadId }
  )

  const updates = [
    databases.getDocument(DATABASE_ID, THREADS_COL, threadId)
      .then(doc => databases.updateDocument(DATABASE_ID, THREADS_COL, threadId, {
        bookmarkCount: (doc.bookmarkCount ?? 0) + 1,
      })),
  ]

  if (threadAuthorDocId) {
    updates.push(
      databases.getDocument(DATABASE_ID, USERS_TABLE_ID, threadAuthorDocId)
        .then(doc => databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, threadAuthorDocId, {
          karma: (doc.karma ?? 0) + 2,
        }))
    )
  }

  await Promise.all(updates)
  return bookmarkDoc.$id
}

// ── Unbookmark ────────────────────────────────────────────────────────────────
export const unbookmarkThread = async ({ bookmarkDocId, threadId, threadAuthorDocId }) => {
  const updates = [
    databases.deleteDocument(DATABASE_ID, BOOKMARKS_COL, bookmarkDocId),
    databases.getDocument(DATABASE_ID, THREADS_COL, threadId)
      .then(doc => databases.updateDocument(DATABASE_ID, THREADS_COL, threadId, {
        bookmarkCount: Math.max(0, (doc.bookmarkCount ?? 1) - 1),
      })),
  ]

  if (threadAuthorDocId) {
    updates.push(
      databases.getDocument(DATABASE_ID, USERS_TABLE_ID, threadAuthorDocId)
        .then(doc => databases.updateDocument(DATABASE_ID, USERS_TABLE_ID, threadAuthorDocId, {
          karma: Math.max(0, (doc.karma ?? 2) - 2),
        }))
    )
  }

  await Promise.all(updates)
}

// ── Check bookmark status ─────────────────────────────────────────────────────
export const getBookmarkDoc = async ({ userId, threadId }) => {
  const res = await databases.listDocuments(DATABASE_ID, BOOKMARKS_COL, [
    Query.equal("userId", userId),
    Query.equal("threadId", threadId),
    Query.limit(1),
    Query.select(["$id"]),
  ])
  return res.total > 0 ? res.documents[0].$id : null
}

// ── Get user's bookmarked threads ─────────────────────────────────────────────
export const getUserBookmarks = async (userId) => {
  const res = await databases.listDocuments(DATABASE_ID, BOOKMARKS_COL, [
    Query.equal("userId", userId),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
    Query.select(["threadId", "$id"]),
  ])
  return res.documents
}
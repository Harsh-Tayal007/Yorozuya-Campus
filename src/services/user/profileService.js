import { databases } from "@/lib/appwrite"
import { Query } from "appwrite"

const DATABASE_ID    = import.meta.env.VITE_APPWRITE_DATABASE_ID
const USERS_TABLE_ID = import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID

// ── Public profile fetch ──────────────────────────────────────────────────────
// Used on /profile/:username — 1 request, minimal payload
export const getUserByUsername = async (username) => {
  const res = await databases.listDocuments(DATABASE_ID, USERS_TABLE_ID, [
    Query.equal("username", username),
    Query.limit(1),
    Query.select([
      "$id", "userId", "username", "name", "avatarUrl", "bio",
      "yearOfStudy", "universityId", "programId", "branchId", "$createdAt",
    ]),
  ])

  if (res.total === 0) return null
  return res.documents[0]
}

// ── Avatar upload — matches uploadImage.js pattern exactly ───────────────────
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
  return {
    avatarUrl:      data.secure_url,
    avatarPublicId: data.public_id,
  }
}
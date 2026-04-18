import { account, databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { DATABASE_ID, CLASSES_COLLECTION_ID } from "@/config/appwrite"

const DELETE_ACCOUNT_WORKER_URL = import.meta.env.VITE_DELETE_ACCOUNT_WORKER_URL

/**
 * Calls the Cloudflare Worker to permanently delete an account.
 * Also cleans up assigned classes to prevent ghost IDs from appearing.
 *
 * @param {string} [targetUserId] — If provided, deletes that user (admin action).
 *                                   If omitted, deletes the currently signed-in user.
 */
export const deleteAccountPermanently = async (targetUserId = null) => {
  // Determine which user is being deleted to clean up classes first
  let uid = targetUserId
  if (!uid) {
    try {
      const curr = await account.get()
      uid = curr.$id
    } catch {
      // Ignored if account not fetchable
    }
  }

  // Pre-deletion cleanup: remove user from assigned classes
  if (uid) {
    try {
      const classesRes = await databases.listDocuments(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        [Query.contains("teacherIds", uid), Query.limit(500)]
      )
      
      await Promise.all(classesRes.documents.map(cls => {
        const newTeacherIds = (cls.teacherIds || []).filter(id => id !== uid)
        // Ensure class doesn't crash if it ends up with 0 teachers, or handle it organically
        return databases.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, cls.$id, {
          teacherIds: newTeacherIds.length > 0 ? newTeacherIds : []
        }).catch(() => null) // Ignore permission errors (backend worker might cascade anyway)
      }))
    } catch (e) {
      console.warn("Failed to remove user from classes prior to deletion", e)
    }
  }

  const { jwt } = await account.createJWT()

  const body = { jwt }
  if (targetUserId) body.targetUserId = targetUserId

  const res = await fetch(DELETE_ACCOUNT_WORKER_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.error ?? "Account deletion failed")
  }

  return data
}
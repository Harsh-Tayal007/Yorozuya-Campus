import { account, databases } from "@/lib/appwrite"
import { Query } from "appwrite"
import { DATABASE_ID, CLASSES_COLLECTION_ID } from "@/config/appwrite"
import {
  fetchCloudflareWorker,
  isWorkerUnavailableError,
  readJsonSafe,
} from "@/services/shared/cloudflareWorkerClient"

const DELETE_ACCOUNT_WORKER_URL = import.meta.env.VITE_DELETE_ACCOUNT_WORKER_URL

/**
 * Calls the Cloudflare Worker to permanently delete an account.
 * Also cleans up assigned classes to prevent ghost IDs from appearing.
 *
 * @param {string} [targetUserId] - If provided, deletes that user (admin action).
 *                                   If omitted, deletes the currently signed-in user.
 */
export const deleteAccountPermanently = async (targetUserId = null) => {
  let uid = targetUserId
  if (!uid) {
    try {
      const curr = await account.get()
      uid = curr.$id
    } catch {
      // Ignored if account not fetchable
    }
  }

  if (uid) {
    try {
      const classesRes = await databases.listDocuments(
        DATABASE_ID,
        CLASSES_COLLECTION_ID,
        [Query.contains("teacherIds", uid), Query.limit(500)],
      )

      await Promise.all(classesRes.documents.map((cls) => {
        const newTeacherIds = (cls.teacherIds || []).filter((id) => id !== uid)
        return databases.updateDocument(DATABASE_ID, CLASSES_COLLECTION_ID, cls.$id, {
          teacherIds: newTeacherIds.length > 0 ? newTeacherIds : [],
        }).catch(() => null)
      }))
    } catch (e) {
      console.warn("Failed to remove user from classes prior to deletion", e)
    }
  }

  const { jwt } = await account.createJWT()

  const body = { jwt }
  if (targetUserId) body.targetUserId = targetUserId

  try {
    const res = await fetchCloudflareWorker(DELETE_ACCOUNT_WORKER_URL, {
      timeoutMs: 12_000,
      workerName: "Delete-account worker",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const data = await readJsonSafe(res)

    if (!res.ok || !data.success) {
      throw new Error(data.error ?? "Account deletion failed")
    }

    return data
  } catch (err) {
    if (isWorkerUnavailableError(err)) {
      throw new Error("Account deletion service is temporarily unavailable. Please try again shortly.")
    }
    throw err
  }
}

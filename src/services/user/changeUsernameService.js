import { account } from "@/lib/appwrite"
import {
  fetchCloudflareWorker,
  isWorkerUnavailableError,
  readJsonSafe,
} from "@/services/shared/cloudflareWorkerClient"

const WORKER_URL =
  import.meta.env.VITE_CHANGE_USERNAME_WORKER_URL ||
  "https://unizuya-change-username.harshtayal710.workers.dev"

/**
 * Change the current user's username.
 * - Creates a short-lived JWT for server-side identity verification
 * - Calls the Cloudflare Worker which cascades the change across all collections
 * - Returns { success, oldUsername, newUsername, counts } on success
 * - Throws a user-readable Error on failure
 */
export async function changeUsername(newUsername) {
  const jwt = await account.createJWT()

  try {
    const res = await fetchCloudflareWorker(WORKER_URL, {
      timeoutMs: 10_000,
      workerName: "Username worker",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jwt: jwt.jwt, newUsername }),
    })

    const data = await readJsonSafe(res)

    if (!res.ok || !data.success) {
      throw new Error(data.error ?? "Failed to change username")
    }

    return data
  } catch (err) {
    if (isWorkerUnavailableError(err)) {
      throw new Error("Username service is temporarily unavailable. Please try again in a minute.")
    }
    throw err
  }
}

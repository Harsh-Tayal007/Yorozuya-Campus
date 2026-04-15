import { account } from "@/lib/appwrite"

const WORKER_URL = "https://unizuya-change-username.harshtayal710.workers.dev"

/**
 * Change the current user's username.
 * - Creates a short-lived JWT for server-side identity verification
 * - Calls the Cloudflare Worker which cascades the change across all collections
 * - Returns { success, oldUsername, newUsername, counts } on success
 * - Throws a user-readable Error on failure
 */
export async function changeUsername(newUsername) {
  // Create a 15-minute JWT — Worker verifies it to identify the caller
  const jwt = await account.createJWT()

  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jwt: jwt.jwt, newUsername }),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    // Surface the worker's error message directly — it's already user-readable
    throw new Error(data.error ?? "Failed to change username")
  }

  return data // { success, oldUsername, newUsername, counts }
}
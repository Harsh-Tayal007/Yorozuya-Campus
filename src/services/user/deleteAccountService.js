import { account } from "@/lib/appwrite"

const DELETE_ACCOUNT_WORKER_URL = import.meta.env.VITE_DELETE_ACCOUNT_WORKER_URL

/**
 * Calls the Cloudflare Worker to permanently delete an account.
 *
 * @param {string} [targetUserId] — If provided, deletes that user (admin action).
 *                                   If omitted, deletes the currently signed-in user.
 */
export const deleteAccountPermanently = async (targetUserId = null) => {
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
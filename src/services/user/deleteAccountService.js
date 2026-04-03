import { account } from "@/lib/appwrite"

const DELETE_ACCOUNT_WORKER_URL = import.meta.env.VITE_DELETE_ACCOUNT_WORKER_URL

/**
 * Calls the Cloudflare Worker to permanently delete the account.
 * The worker verifies the JWT server-side — no sensitive keys exposed to client.
 */
export const deleteAccountPermanently = async () => {
  // createJWT() returns a short-lived (15 min) JWT the worker can verify
  // server-side. session.secret is not exposed to clients by Appwrite.
  const { jwt } = await account.createJWT()

  const res = await fetch(DELETE_ACCOUNT_WORKER_URL, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ jwt }),
  })

  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.error ?? "Account deletion failed")
  }

  return data
}